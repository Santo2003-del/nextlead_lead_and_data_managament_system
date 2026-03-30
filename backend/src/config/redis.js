// Functional In-Memory Queue (No Redis required)
const events = require('events');
const logger = require('./logger');

class InMemoryQueue extends events.EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.handler = null;
    this.isPaused = false;
  }

  async add(data, options = {}) {
    const job = { 
      id: `job-${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
      data,
      attemptsMade: 0,
      timestamp: Date.now()
    };
    
    logger.info(`[Queue:${this.name}] Job ${job.id} added`);
    
    // Process "async" but catch errors
    setImmediate(async () => {
      if (!this.handler) {
        logger.warn(`[Queue:${this.name}] No worker registered for this job yet.`);
        return;
      }
      try {
        await this.handler(job);
        this.emit('completed', job);
      } catch (err) {
        logger.error(`[Queue:${this.name}] Job ${job.id} failed:`, err.message);
        this.emit('failed', job, err);
      }
    });

    return job;
  }

  process(...args) {
    if (args.length === 2 && typeof args[0] === 'number') {
      this.handler = args[1];
    } else {
      this.handler = args[0];
    }
    logger.info(`[Queue:${this.name}] Worker attached (In-Memory Processing)`);
  }

  async count() { return 0; }
  async clean() { }
  async close() { }
}

const redis = {
  on: () => { },
  status: 'ready',
  get: async () => null,
  set: async () => 'OK',
};

const queues = {
  enrich: new InMemoryQueue('nexlead:enrich'),
  export: new InMemoryQueue('nexlead:export'),
  scrape: new InMemoryQueue('nexlead:scrape'),
  import: new InMemoryQueue('nexlead:import'),
};

logger.info('✅ Background workers switched to In-Memory mode (Redis dependency removed)');
module.exports = { redis, queues };

