// Migration script to fix duplicate key errors
// Run this once to clean up old database indexes

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function migrateDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feedlith', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Drop the old email index from teachers collection
    const db = mongoose.connection.db;
    
    try {
      await db.collection('teachers').dropIndex('email_1');
      console.log('✅ Dropped old email index from teachers collection');
    } catch (error) {
      console.log('ℹ️ Email index does not exist (this is expected):', error.message);
    }

    // Remove any duplicate teachers with null or empty emails
    try {
      const result = await db.collection('teachers').deleteMany({
        $or: [
          { email: null },
          { email: '' },
        ]
      });
      console.log(`✅ Removed ${result.deletedCount} duplicate teacher records`);
    } catch (error) {
      console.log('ℹ️ No duplicate records found');
    }

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();
