const Joi = require('joi');

const productJoiSchema = Joi.object({
  product_name: Joi.string().required(),
  sku: Joi.string().required(),
  brand: Joi.string().required(),
  description: Joi.string().required(),
  images: Joi.array().items(Joi.string().uri()).min(1).required(),
  original_price: Joi.number().required(),
  stock_quantity: Joi.number().required(),
  category: Joi.string().valid('action-figures', 'educational', 'puzzles', 'board-games', 'outdoor-play').required(),
  
  // Optional Fields
  on_sale: Joi.boolean(),
  sale_price: Joi.number().allow(null),
  age_group: Joi.string(),
  material: Joi.string(),
  piece_count: Joi.number(),
  weight: Joi.string(),
  origin_country: Joi.string(),
  badge: Joi.string().valid('bestseller', 'sale', 'new', 'limited', 'none'),
  certifications: Joi.array().items(Joi.string()),
  style_variants: Joi.array().items(Joi.string()),
  safety_warning: Joi.string(),
  features: Joi.array().items(Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required()
  })),
  is_published: Joi.boolean(),
  video: Joi.string().uri().allow(''),
  meta_title: Joi.string(),
  meta_description: Joi.string(),
  url_slug: Joi.string()
});

module.exports = { productJoiSchema };