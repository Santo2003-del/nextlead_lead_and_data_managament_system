const ScrapeJob = require('../../models/ScrapeJob');
const { queues } = require('../../config/redis');
const { log } = require('../../services/activityService');
const logger = require('../../config/logger');

// POST /scrape
const createJob = async (req, res) => {
  try {
    const { name, source, config } = req.body;
    if (!name || !source || !config) return res.status(400).json({ error: 'name, source, config required' });

    const job = await ScrapeJob.create({
      name,
      source,
      config,
      created_by: req.user.id
    });

    await queues.scrape.add({ jobId: job._id.toString() }, { attempts: 2 });
    await log({
      userId: req.user.id, action: 'scrape', entityType: 'scrape_job',
      entityId: job._id, metadata: { name, source }, req
    });

    res.status(201).json({ job: { ...job.toObject(), id: job._id.toString() } });
  } catch (err) {
    logger.error('[Scrape] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /scrape
const listJobs = async (req, res) => {
  try {
    const mongoQuery = req.user.role === 'admin' ? {} : { created_by: req.user.id };

    const jobs = await ScrapeJob.find(mongoQuery)
      .sort({ created_at: -1 })
      .limit(50)
      .populate('created_by', 'name')
      .lean();

    const formattedJobs = jobs.map(j => ({
      ...j,
      id: j._id.toString(),
      created_by_name: j.created_by ? j.created_by.name : null
    }));

    res.json({ jobs: formattedJobs });
  } catch (err) {
    logger.error('[Scrape] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /scrape/:id
const getJob = async (req, res) => {
  try {
    const job = await ScrapeJob.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job: { ...job, id: job._id.toString() } });
  } catch (err) {
    logger.error('[Scrape] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /scrape/:id
const cancelJob = async (req, res) => {
  try {
    const job = await ScrapeJob.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ['pending', 'running'] } },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
    if (!job) return res.status(400).json({ error: 'Job cannot be cancelled' });
    res.json({ message: 'Job cancelled' });
  } catch (err) {
    logger.error('[Scrape] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createJob, listJobs, getJob, cancelJob };
