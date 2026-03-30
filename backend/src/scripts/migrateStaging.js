require('dotenv').config();
const mongoose = require('mongoose');
const ScrapedData = require('../models/ScrapedData');
const User = require('../models/User');

const log = (msg) => process.stdout.write(msg + '\n');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        log('Connected to MongoDB');

        const result = await ScrapedData.updateMany(
            { 
                $or: [
                    { source: { $exists: false } },
                    { source: 'import' },
                    { source: null }
                ]
            },
            { $set: { source: 'Unknown' } }
        );

        log(`Updated source for ${result.modifiedCount} records`);

        const recordsWithoutName = await ScrapedData.find({
            $or: [
                { uploadedByName: { $exists: false } },
                { uploadedByName: null }
            ],
            created_by: { $exists: true }
        });

        log(`Found ${recordsWithoutName.length} records missing uploadedByName but having created_by`);

        let updatedNames = 0;
        for (const record of recordsWithoutName) {
            const user = await User.findById(record.created_by);
            if (user) {
                await ScrapedData.findByIdAndUpdate(record._id, {
                    $set: {
                        uploadedByName: user.name,
                        uploadedBy: user._id
                    }
                });
                updatedNames++;
            } else {
                await ScrapedData.findByIdAndUpdate(record._id, {
                    $set: {
                        uploadedByName: 'Unknown'
                    }
                });
                updatedNames++;
            }
        }
        
        log(`Updated uploadedByName for ${updatedNames} records`);

        log('Migration complete');
        process.exit(0);

    } catch (err) {
        process.stderr.write('Migration error: ' + err.message + '\n');
        process.exit(1);
    }
};

migrate();

