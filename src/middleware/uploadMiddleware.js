const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const productUpload = (req, res, next) => {
  const handler = upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 }
  ]);

  handler(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        message: err.message || 'File upload failed'
      });
    }
    next();
  });
};

module.exports = productUpload;
