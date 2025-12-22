const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const seedAdmin = require('./utils/seeder'); // Import seeder

dotenv.config();

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    // Run Admin Seeder
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));