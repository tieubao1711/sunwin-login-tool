const path = require('path');
const config = require('../config');
const { nowIsoCompact } = require('../utils/time');
const { ensureDir, writeJson } = require('../utils/file');
const { createImportRun, finishImportRun } = require('../repositories/importRunRepository');
const { processSingleAccount } = require('./workerService');
const { resetWarp } = require('./../utils/warpManager');
const {
  notifyRunSummaryFile,
  flushAllBatches,
  waitForDataQueueDrain
} = require('./telegramService');

const OUTPUT_DIR = path.resolve(process.cwd(), 'output');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class RunManager {
  constructor() {
    this.state = 'idle'; // idle | running | paused | stopping
    this.accounts = [];
    this.source = '';
    this.cursor = 0;
    this.total = 0;
    this.summary = null;
    this.run = null;
    this.startedAt = null;

    this.runtimeConfig = {
      concurrency: 3,
      delayBetweenRequestsMs: 0,
      highBalanceThreshold: 100000,
      resetWarpEvery: 5
    };
  }

  getIO() {
    return global.io;
  }

  getStatus() {
    return {
      state: this.state,
      cursor: this.cursor,
      total: this.total,
      runId: this.run ? String(this.run._id) : null,
      summary: this.summary,
      config: this.runtimeConfig,
      source: this.source
    };
  }

  async start({ accounts, source, options = {} }) {
    if (this.state === 'running' || this.state === 'paused') {
      throw new Error('Run is already in progress');
    }

    this.state = 'running';
    this.accounts = accounts || [];
    this.source = source || '';
    this.cursor = 0;
    this.total = this.accounts.length;
    this.startedAt = new Date();

    this.runtimeConfig = {
      concurrency: Number(options.concurrency || config.concurrency || 3),
      delayBetweenRequestsMs: Number(
        options.delayBetweenRequestsMs ?? config.delayBetweenRequestsMs ?? 0
      ),
      highBalanceThreshold: Number(
        options.highBalanceThreshold ?? config.highBalanceThreshold ?? 100000
      ),
      resetWarpEvery: Number(
        options.resetWarpEvery ?? config.resetWarpEvery ?? 5
      )
    };

    this.run = await createImportRun({
      name: config.runName || `run-${nowIsoCompact()}`,
      sourceFile: source,
      startedAt: this.startedAt,
      totalAccounts: this.total,
      threshold: this.runtimeConfig.highBalanceThreshold,
      notes: 'Dashboard controlled bulk login run'
    });

    this.summary = {
      runId: String(this.run._id),
      runName: this.run.name,
      sourceFile: source,
      totalAccounts: this.total,
      successCount: 0,
      failedCount: 0,
      highBalanceCount: 0,
      threshold: this.runtimeConfig.highBalanceThreshold,
      durationMs: 0,
      startedAt: this.startedAt.toISOString(),
      finishedAt: null
    };

    const io = this.getIO();
    if (io) {
      io.emit('run:started', {
        runId: String(this.run._id),
        runName: this.run.name,
        totalAccounts: this.total,
        startedAt: this.startedAt.toISOString()
      });
    }

    try {
      await this.runByWarpBatches();
      await this.finishRun();
    } catch (err) {
      console.error('[RunManager] Run error:', err.message);
      await this.finishRun();
    }
  }

  async waitIfPaused() {
    while (this.state === 'paused') {
      await sleep(300);
    }
  }

  async runByWarpBatches() {
    const resetEvery = Number(this.runtimeConfig.resetWarpEvery || 0);

    if (resetEvery <= 0) {
      await this.runBatch(this.accounts, 0);
      return;
    }

    for (let i = 0; i < this.accounts.length; i += resetEvery) {
      if (this.state === 'stopping') return;

      await this.waitIfPaused();

      const batch = this.accounts.slice(i, i + resetEvery);

      console.log(
        `\n🌐 Reset WARP trước batch ${i + 1}-${i + batch.length}/${this.accounts.length}`
      );

      await resetWarp();

      await this.runBatch(batch, i);
    }
  }

  async runBatch(batch, baseIndex) {
    let localCursor = 0;
    const workersCount = Math.max(1, Number(this.runtimeConfig.concurrency || 1));

    const worker = async () => {
      while (true) {
        if (this.state === 'stopping') return;

        await this.waitIfPaused();

        const localIndex = localCursor++;
        if (localIndex >= batch.length) return;

        const globalIndex = baseIndex + localIndex;
        const account = batch[localIndex];

        const result = await processSingleAccount(
          account,
          this.run._id,
          globalIndex,
          this.total,
          {
            delayBetweenRequestsMs: this.runtimeConfig.delayBetweenRequestsMs,
            highBalanceThreshold: this.runtimeConfig.highBalanceThreshold
          }
        );

        this.cursor = Math.max(this.cursor, globalIndex + 1);

        if (result.status === 'SUCCESS') this.summary.successCount += 1;
        if (result.status === 'FAILED') this.summary.failedCount += 1;
        if (result.highBalance) this.summary.highBalanceCount += 1;

        const io = this.getIO();
        if (io) {
          io.emit('run:stats', {
            runId: String(this.run._id),
            summary: this.summary,
            processed: this.summary.successCount + this.summary.failedCount
          });
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(workersCount, batch.length) },
      () => worker()
    );

    await Promise.all(workers);
  }

  async finishRun() {
    if (!this.run || !this.summary) {
      this.state = 'idle';
      return;
    }

    const finishedAt = new Date();

    this.summary.finishedAt = finishedAt.toISOString();
    this.summary.durationMs = finishedAt.getTime() - new Date(this.summary.startedAt).getTime();

    await finishImportRun(this.run._id, {
      finishedAt,
      durationMs: this.summary.durationMs,
      successCount: this.summary.successCount,
      failedCount: this.summary.failedCount,
      highBalanceCount: this.summary.highBalanceCount,
      summary: this.summary
    });

    ensureDir(OUTPUT_DIR);

    writeJson(
      path.resolve(process.cwd(), 'output', `run-summary-${nowIsoCompact()}.json`),
      { summary: this.summary }
    );

    const io = this.getIO();
    if (io) {
      io.emit('run:summary', {
        runId: String(this.run._id),
        summary: this.summary
      });
    }

    try {
      console.log('[Run] Flushing Telegram...');
      await flushAllBatches();

      console.log('[Run] Waiting Telegram queue...');
      await waitForDataQueueDrain();

      console.log('[Run] Sending summary...');
      await notifyRunSummaryFile(String(this.run._id));
    } catch (err) {
      console.log(`[TELEGRAM ERROR] RUN_SUMMARY | ${err.message}`);
    }

    console.log(
      `[Run] Finished ${this.run.name} | success=${this.summary.successCount} | failed=${this.summary.failedCount}`
    );

    this.state = 'idle';
    this.accounts = [];
    this.cursor = 0;
    this.total = 0;
  }

  pause() {
    if (this.state === 'running') this.state = 'paused';
    return this.getStatus();
  }

  resume() {
    if (this.state === 'paused') this.state = 'running';
    return this.getStatus();
  }

  stop() {
    if (this.state === 'running' || this.state === 'paused') {
      this.state = 'stopping';
    }
    return this.getStatus();
  }
}

module.exports = new RunManager();