const mongoose = require('mongoose');
const slugify = require('slugify');

const featureSchema = new mongoose.Schema({
  title: String,
  description: String
}, { _id: false }); 

const productSchema = new mongoose.Schema({
  product_name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true },
  brand: { type: String, required: true },
  description: { type: String, required: true },
  
  // Media (Storing URLs - Frontend should upload to S3/Cloudinary first)
  images: [{ type: String }], 
  video: { type: String },

  // Pricing & Stock
  original_price: { type: Number, required: true },
  sale_price: { type: Number },
  discount_percentage: { type: Number, default: 0 },
  on_sale: { type: Boolean, default: false },
  stock_quantity: { type: Number, required: true, min: 0 },
  
  // Details
  age_group: { type: String },
  material: { type: String },
  piece_count: { type: Number },
  weight: { type: String }, // e.g. "500g"
  origin_country: { type: String },
  
  // Badges & Categories
  badge: { 
    type: String, 
    enum: ['bestseller', 'sale', 'new', 'limited', 'none'],
    default: 'none'
  },
  category: { 
    type: String, 
    required: true,
    enum: ['action-figures', 'educational', 'puzzles', 'board-games', 'outdoor-play']
  },
  certifications: [{ type: String }], // Array of strings
  style_variants: [{ type: String }], // e.g. ["Red", "Blue"]
  
  // Content
  features: [featureSchema],
  safety_warning: { type: String },
  
  // Visibility & SEO
  is_published: { type: Boolean, default: true },
  meta_title: String,
  meta_description: String,
  url_slug: { type: String, unique: true }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual Field: Status
productSchema.virtual('status').get(function() {
  if (this.stock_quantity === 0) return 'out-of-stock';
  if (this.stock_quantity <= 5) return 'low-stock';
  if (this.on_sale) return 'in-sale';
  return 'in-stock';
});


// Middleware: Auto-generate Slug and Calculate Discount
productSchema.pre('save', async function() {
  // 1. Generate Slug if missing
  if (!this.url_slug && this.product_name) {
    this.url_slug = slugify(this.product_name, { lower: true, strict: true });
  }

  // 2. Calculate Discount Percentage
  if (this.on_sale && this.sale_price && this.original_price) {
    this.discount_percentage = Math.round(
      ((this.original_price - this.sale_price) / this.original_price) * 100
    );
  }
});

module.exports = mongoose.model('Product', productSchema);