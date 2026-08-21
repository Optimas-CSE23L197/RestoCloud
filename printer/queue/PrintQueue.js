class PrintQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  add(job) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        ...job,
        resolve,
        reject,
      });

      this.process();
    });
  }

  async process() {
    if (this.processing) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();

      try {
        const result = await job.task();
        job.resolve(result);
      } catch (error) {
        job.reject(error);
      }
    }

    this.processing = false;
  }

  clear() {
    const pending = this.queue.splice(0);

    pending.forEach((job) => {
      job.reject(new Error("Print queue cleared"));
    });
  }

  get length() {
    return this.queue.length;
  }
}

export default new PrintQueue();
