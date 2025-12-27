const Wishlist = require('./wishlist.model');
const Product = require('../products/product.model');

// @desc    Get User Wishlist (Populated with Product Details)
// @route   GET /api/wishlist
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'products.product',
        select: 'product_name images original_price sale_price on_sale url_slug stock_quantity'
      });

    if (!wishlist) {
      // If no wishlist exists yet, return empty array instead of 404
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Filter out null products (in case a product was deleted by Admin)
    const validProducts = wishlist.products.filter(item => item.product !== null);

    res.status(200).json({
      success: true,
      count: validProducts.length,
      data: validProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add Item to Wishlist
// @route   POST /api/wishlist
exports.addToWishlist = async (req, res) => {
  const { productId } = req.body;

  try {
    // 1. Verify Product Exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // 2. Find Wishlist or Create if doesn't exist (Upsert logic)
    // We use $addToSet to prevent duplicates automatically
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { 
        $addToSet: { products: { product: productId } } 
      },
      { new: true, upsert: true } // Create if not found
    );

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlist.products.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove Item from Wishlist
// @route   DELETE /api/wishlist/:productId
exports.removeFromWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { 
        $pull: { products: { product: req.params.productId } } 
      },
      { new: true }
    );

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      count: wishlist.products.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check if a specific product is in wishlist (For UI "Heart" icon state)
// @route   GET /api/wishlist/check/:productId
exports.checkWishlistStatus = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ 
      user: req.user._id,
      'products.product': req.params.productId 
    });

    res.status(200).json({
      isWishlisted: !!wishlist // Returns true if found, false otherwise
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};