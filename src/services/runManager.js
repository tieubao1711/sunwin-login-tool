const config = require('../config');
const { nowIsoCompact } = require('../utils/time');
const { createImportRun, finishImportRun } = require('../repositories/importRunRepository');
const { ensureDir, writeJson } = require('../utils/file');
const path = require('path');
const { processSingleAccount } = require('./workerService');

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
    this.workers = [];
    this.runtimeConfig = {
      concurrency: 3,
      delayBetweenRequestsMs: 0,
      highBalanceThreshold: 100000
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

    this.runtimeConfig = {
      concurrency: Number(options.concurrency || config.concurrency || 3),
      delayBetweenRequestsMs: Number(
        options.delayBetweenRequestsMs || config.delayBetweenRequestsMs || 0
      ),
      highBalanceThreshold: Number(
        options.highBalanceThreshold || config.highBalanceThreshold || 100000
      )
    };

    const startedAt = new Date();

    this.run = await createImportRun({
      name: config.runName || `run-${nowIsoCompact()}`,
      sourceFile: source,
      startedAt,
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
      startedAt: startedAt.toISOString(),
      finishedAt: null
    };

    const io = this.getIO();
    if (io) {
      io.emit('run:started', {
        runId: String(this.run._id),
        runName: this.run.name,
        totalAccounts: this.total,
        startedAt: startedAt.toISOString()
      });
    }

    this.workers = Array.from(
      { length: Math.max(1, this.runtimeConfig.concurrency) },
      (_, idx) => this.runWorker(idx)
    );

    await Promise.all(this.workers);

    const finishedAt = new Date();
    this.summary.finishedAt = finishedAt.toISOString();
    this.summary.durationMs =
      finishedAt.getTime() - new Date(this.summary.startedAt).getTime();

    await finishImportRun(this.run._id, {
      finishedAt,
      durationMs: this.summary.durationMs,
      successCount: this.summary.successCount,
      failedCount: this.summary.failedCount,
      highBalanceCount: this.summary.highBalanceCount,
      summary: this.summary
    });

    ensureDir(path.resolve(process.cwd(), 'output'));
    writeJson(
      path.resolve(process.cwd(), 'output', `run-summary-${nowIsoCompact()}.json`),
      { summary: this.summary }
    );

    if (io) {
      io.emit('run:summary', {
        runId: String(this.run._id),
        summary: this.summary
      });
    }

    this.state = 'idle';
    this.accounts = [];
    this.workers = [];
  }

  async runWorker(workerIndex) {
    while (true) {
      if (this.state === 'stopping') {
        return;
      }

      if (this.state === 'paused') {
        await sleep(300);
        continue;
      }

      const index = this.cursor++;
      if (index >= this.total) return;

      const account = this.accounts[index];
      const result = await processSingleAccount(
        account,
        this.run._id,
        index,
        this.total,
        {
          delayBetweenRequestsMs: this.runtimeConfig.delayBetweenRequestsMs,
          highBalanceThreshold: this.runtimeConfig.highBalanceThreshold
        }
      );

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