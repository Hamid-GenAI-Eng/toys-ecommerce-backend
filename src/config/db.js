const mongoose = require('mongoose');

let conn = null;

const connectDB = async () => {
  // If connection is already established, reuse it (Performance Boost)
  if (conn == null) {
    try {
      conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB Connected (New Connection)');
    } catch (error) {
      console.error('MongoDB Connection Error:', error);
      process.exit(1);
    }
  } else {
    console.log('MongoDB Connected (Cached)');
  }

  return conn;
};

module.exports = connectDB;