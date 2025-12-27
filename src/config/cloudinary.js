const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary 
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'techmall-products', // Folder name in Cloudinary Dashboard
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4'],
    resource_type: 'auto', // Auto-detect 'image' or 'video'
  },
});

module.exports = { cloudinary, storage };