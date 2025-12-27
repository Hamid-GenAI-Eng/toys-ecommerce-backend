const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limit: 10MB (Adjust based on Cloudinary plan)
});

// Config for handling multiple fields
const productUpload = upload.fields([
  { name: 'images', maxCount: 5 }, // Allow up to 5 product images
  { name: 'video', maxCount: 1 }   // Allow 1 video
]);

module.exports = productUpload;