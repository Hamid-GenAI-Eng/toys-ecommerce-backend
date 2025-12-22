const User = require('../modules/auth/user.model');
const dotenv = require('dotenv');
dotenv.config();

const seedAdmin = async () => {
  const adminEmail = "admin@techmallpk.pk";
  const adminPass = "Admin@Tech12";

  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    await User.create({
      name: "Super Admin",
      email: adminEmail,
      password: adminPass, // User model will auto-hash this
      role: "Admin",
      isVerified: true
    });
    console.log("Admin Account Created Successfully");
  }
};

module.exports = seedAdmin;