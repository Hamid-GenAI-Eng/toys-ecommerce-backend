const serverless = require('serverless-http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const seedAdmin = require('./src/utils/seeder');

// 1. Connect to DB before handling request
// Note: We wrap the app logic to ensure DB is ready
module.exports.authService = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false; // Important for MongoDB reuse
  
  await connectDB();
  
  // Optional: Run seeder logic (Optimized to not block requests heavily)
  // In production, best to run this as a separate deploy script
  if (process.env.RUN_SEEDER === 'true') {
     await seedAdmin();
  }

  // 2. Pass request to Express
  const handler = serverless(app);
  return handler(event, context);
};