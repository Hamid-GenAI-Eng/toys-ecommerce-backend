const Product = require('./product.model');
const { productJoiSchema } = require('./product.validation');
const { Parser } = require('json2csv');
const { cloudinary } = require('../../config/cloudinary');

// @desc    Get All Products (Filter, Search, Sort, Pagination, Export)
// @route   GET /api/admin/products
exports.getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 5, 
      search, 
      category, 
      brand, 
      stock_status, 
      export_csv 
    } = req.query;

    // --- 1. Build Query Object ---
    const query = {};

    // Search (Name or SKU)
    if (search) {
      query.$or = [
        { product_name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (category) query.category = category;
    if (brand) query.brand = brand;

    // Stock Status Logic (Custom Query)
    if (stock_status === 'low-stock') {
      query.stock_quantity = { $lte: 5, $gt: 0 };
    } else if (stock_status === 'out-of-stock') {
      query.stock_quantity = 0;
    }

    // --- 2. Handle CSV Export (If requested, return file immediately) ---
    if (export_csv === 'true') {
      const allProducts = await Product.find(query);
      const fields = ['sku', 'product_name', 'stock_quantity', 'original_price', 'category'];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(allProducts);

      res.header('Content-Type', 'text/csv');
      res.attachment('products.csv');
      return res.send(csv);
    }

    // --- 3. Pagination & Execution ---
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Run DB queries in parallel for performance
    const [products, totalProducts, weekCount, lowStockCount] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query), // Total matching query
      Product.countDocuments({ createdAt: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) } }), // Added this week
      Product.countDocuments({ stock_quantity: { $lte: 5 } }) // Total Low stock
    ]);

    // Format response for UI table
    const tableData = products.map(p => ({
      id: p._id,
      name: p.product_name,
      sku: p.sku,
      image: p.images[0] || '',
      category: p.category,
      price: p.original_price,
      stock: p.stock_quantity,
      status: p.status // Uses the virtual field logic
    }));

    res.json({
      success: true,
      stats: {
        total_products: totalProducts,
        added_this_week: weekCount,
        low_stock_count: lowStockCount
      },
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_pages: Math.ceil(totalProducts / limit),
        total_items: totalProducts,
        message: `Showing ${skip + 1} to ${Math.min(skip + products.length, totalProducts)} of ${totalProducts} products`
      },
      data: tableData
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create New Product
// @route   POST /api/admin/products
exports.createProduct = async (req, res) => {
  try {
    // 1. Handle File Uploads (From Cloudinary Middleware)
    let imageUrls = [];
    let videoUrl = '';

    if (req.files) {
      if (req.files.images) {
        imageUrls = req.files.images.map(file => file.path);
      }
      if (req.files.video) {
        videoUrl = req.files.video[0].path;
      }
    }

    // 2. Prepare Data for Validation
    // Joi expects data in req.body, so we merge file URLs into it
    const productData = {
      ...req.body,
      images: imageUrls,
      video: videoUrl
    };

    // Parse 'features' if it comes as a stringified JSON (common in FormData)
    if (typeof productData.features === 'string') {
      try {
        productData.features = JSON.parse(productData.features);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid format for features' });
      }
    }
 
    // 3. Validation
    const { error } = productJoiSchema.validate(productData);
    if (error) {
      // Optional: Delete uploaded files from Cloudinary if validation fails to save space
      return res.status(400).json({ message: error.details[0].message });
    }

    const skuExists = await Product.findOne({ sku: productData.sku });
    if (skuExists) return res.status(400).json({ message: 'SKU already exists' });

    // 4. Save to DB
    const newProduct = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Product
// @route   PUT /api/admin/products/:id
exports.updateProduct = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // 1. Handle New Files (if any uploaded)
    if (req.files) {
      if (req.files.images) {
        const newImages = req.files.images.map(file => file.path);
        // Logic: You might want to append or replace. Here we append.
        // If frontend sends "existingImages" array, you'd handle that merge logic here.
        updateData.images = newImages; 
      }
      if (req.files.video) {
        updateData.video = req.files.video[0].path;
      }
    }

    // Parse features if string
    if (typeof updateData.features === 'string') {
      updateData.features = JSON.parse(updateData.features);
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Product
// @route   DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Optional: Delete images from Cloudinary here using cloudinary.uploader.destroy()
    // This requires extracting the Public ID from the URL.
    
    await product.deleteOne();

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};