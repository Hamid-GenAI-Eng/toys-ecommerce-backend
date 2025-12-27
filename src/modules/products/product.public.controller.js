const Product = require('./product.model');
const Review = require('../reviews/review.model');

// @desc    Get All Public Products (with Search & Pagination)
// @route   GET /api/products
exports.getPublicProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category, sort } = req.query;
    
    // 1. Filter: Only show published products
    const query = { is_published: true };

    if (search) {
      query.product_name = { $regex: search, $options: 'i' };
    }

    if (category) {
      query.category = category; // Matches category slug
    }

    // 2. Sorting
    let sortOption = { createdAt: -1 }; // Default: Newest first
    if (sort === 'price-low') sortOption = { original_price: 1 };
    if (sort === 'price-high') sortOption = { original_price: -1 };
    if (sort === 'top-rated') sortOption = { 'ratings.average': -1 };

    // 3. Projection: Select only needed fields for cards
    const selectFields = 'product_name images original_price sale_price on_sale ratings category url_slug';

    const products = await Product.find(query)
      .select(selectFields)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Single Product Detail by Slug
// @route   GET /api/products/:slug
exports.getProductDetail = async (req, res) => {
  try {
    const product = await Product.findOne({ url_slug: req.params.slug, is_published: true });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Fetch Reviews for this product (Limit to 10 initially for performance)
    const reviews = await Review.find({ product: product._id })
      .sort({ createdAt: -1 })
      .limit(10); // Frontend can implement "Load More"

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        reviews // Returns the reviews array here
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Product Review
// @route   POST /api/products/:id/reviews
exports.createProductReview = async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Create Review
    await Review.create({
      product: productId,
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment
    });

    res.status(201).json({ message: 'Review added successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};