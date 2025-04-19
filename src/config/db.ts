import mongoose from 'mongoose';
import assert from 'node:assert';

const connectDB = async () => {
  console.log(process.env.MONGO_URI);
  console.log(process.env.MINIO_URL);
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/eupep-test';
  console.log(uri);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (err) {
    assert.fail(`MongoDB connection error. Exiting application with error Message: ${err}`);
  }
};

export default connectDB;

