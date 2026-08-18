const { randomUUID } = require('crypto');

const MAX_JOBS = 100;

class BaseWorker {
  constructor() {
    this.jobs = new Map();
  }

  generateJobId() {
    return `job_${randomUUID()}`;
  }

  async createJob(type, data) {
    // Evict oldest job if max capacity reached to prevent memory exhaustion (CWE-400)
    if (this.jobs.size >= MAX_JOBS) {
      const oldestKey = this.jobs.keys().next().value;
      if (oldestKey) {
        this.jobs.delete(oldestKey);
      }
    }

    const jobId = this.generateJobId();
    const job = {
      id: jobId,
      type,
      status: 'queued',
      progress: 0,
      data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.jobs.set(jobId, job);
    return job;
  }

  async processJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    try {
      job.status = 'processing';
      job.updatedAt = new Date();
      
      // Simulate processing
      const totalSteps = 10;
      for (let i = 0; i < totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        job.progress = Math.floor(((i + 1) / totalSteps) * 100);
        job.updatedAt = new Date();
      }
      
      job.status = 'completed';
      job.result = await this.performJob(job);
      job.updatedAt = new Date();
      
      return job;
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.updatedAt = new Date();
      throw error;
    }
  }

  async getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    return job;
  }

  // To be implemented by child classes
  async performJob(job) {
    throw new Error('performJob must be implemented by child class');
  }
}

module.exports = BaseWorker;
