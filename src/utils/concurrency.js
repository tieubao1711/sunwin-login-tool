async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let currentIndex = 0;

  async function runner() {
    while (true) {
      const index = currentIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, limit) },
    () => runner()
  );

  await Promise.all(workers);
  return results;
}

module.exports = {
  mapWithConcurrency
};