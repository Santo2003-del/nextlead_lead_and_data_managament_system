require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db').connectDB;
const ScrapedData = require('../models/ScrapedData');
const Lead = require('../models/Lead');
const logger = require('../config/logger');

async function cleanup() {
    try {
        await connectDB();
        logger.info('Database cleanup started...');

        // 1. Normalize ScrapedData
        logger.info('Normalizing ScrapedData...');
        const scrapedItems = await ScrapedData.find({});
        for (const item of scrapedItems) {
            let updated = false;
            
            if (item.email && (item.email !== item.email.toLowerCase().trim())) {
                item.email = item.email.toLowerCase().trim();
                updated = true;
            }
            
            // Basic email validation
            if (item.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) {
                item.email = undefined;
                updated = true;
            }

            ['first_name', 'last_name', 'company_name', 'job_title', 'keyword', 'country'].forEach(f => {
                if (item[f] && item[f] !== item[f].trim()) {
                    item[f] = item[f].trim();
                    updated = true;
                }
            });

            if (updated) await item.save();
        }

        // 2. Remove Duplicates in ScrapedData (email + keyword)
        logger.info('Removing duplicates in ScrapedData...');
        const duplicates = await ScrapedData.aggregate([
            {
                $group: {
                    _id: { email: '$email', keyword: '$keyword' },
                    ids: { $push: '$_id' },
                    count: { $sum: 1 }
                }
            },
            { $match: { count: { $gt: 1 }, '_id.email': { $ne: null } } }
        ]);

        for (const group of duplicates) {
            const [keep, ...remove] = group.ids.reverse(); // Keep the newest
            await ScrapedData.deleteMany({ _id: { $in: remove } });
            logger.info(`Removed ${remove.length} duplicates for ${group._id.email}`);
        }

        // 3. Normalize Leads
        logger.info('Normalizing Leads...');
        const leads = await Lead.find({});
        for (const lead of leads) {
            let updated = false;
            if (lead.email && lead.email !== lead.email.toLowerCase().trim()) {
                lead.email = lead.email.toLowerCase().trim();
                updated = true;
            }
            ['first_name', 'last_name', 'company', 'job_title', 'industry', 'country'].forEach(f => {
                if (lead[f] && lead[f] !== lead[f].trim()) {
                    lead[f] = lead[f].trim();
                    updated = true;
                }
            });
            if (updated) await lead.save();
        }

        logger.info('Database cleanup completed successfully.');
        process.exit(0);
    } catch (err) {
        logger.error('Cleanup failed:', err.message);
        process.exit(1);
    }
}

cleanup();
