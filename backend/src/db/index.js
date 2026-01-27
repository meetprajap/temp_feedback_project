import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {// it is return the promise
  try {
    // DB is in another continent - always use await
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    console.log(`\n${connectionInstance.connection.host}`); // Dev/Prod/Test env check
    console.log('MongoDB Connected !!');
  } catch (error) {
    console.error('MONGODB connection error  ', error);
    process.exit(1); // Exit with failure code
  }
};

export default connectDB;
