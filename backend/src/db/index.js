import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {// it is return the promise
  try {
    // DB is in another continent - always use await
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    console.log(`\n${connectionInstance.connection.host}`); // Dev/Prod/Test env check
    console.log('MongoDB Connected !!');
    
    // Drop old email index from teachers collection if it exists
    try {
      const db = mongoose.connection.db;
      const teachersCollection = db.collection('teachers');
      
      // Get all indexes
      const indexes = await teachersCollection.getIndexes();
      
      // Check if email_1 index exists and drop it
      if (indexes.email_1) {
        await teachersCollection.dropIndex('email_1');
        console.log('✅ Dropped old email index from teachers collection');
      }
      
      // Also remove any duplicate teachers with null emails
      const result = await teachersCollection.deleteMany({
        email: { $in: [null, ''] }
      });
      
      if (result.deletedCount > 0) {
        console.log(`✅ Removed ${result.deletedCount} duplicate teacher records with null emails`);
      }
    } catch (indexError) {
      // Silently handle index errors
      console.log('ℹ️ Skipping index cleanup (collection may be new)');
    }
  } catch (error) {
    console.error('MONGODB connection error  ', error);
    process.exit(1); // Exit with failure code
  }
};

export default connectDB;
