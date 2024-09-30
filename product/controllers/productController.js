const Product = require('../models/Product');
const Category = require('../models/Category');

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { productName, category, imageUrl, originalPrice, discountPrice, currentStock } = req.body;

    // Check if category is provided
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }
     
    // Find the category by ID or name
    let categoryData = await Category.findOne({name:category});
     
      if (!categoryData) {
        return res.status(404).json({ message: 'Category not found' });
      }
    
    // Ensure the category field is properly set
    if (!categoryData._id) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Create the new product
    const product = new Product({
      productName,
      category: categoryData._id, // Use the ObjectId of the category
      imageUrl,
      originalPrice,
      discountPrice,
      currentStock
    });

    // Save the product
    await product.save();

    // Add the product to the category's product array
    categoryData.products.push(product._id);
    await categoryData.save(); 
   

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Create multiple products from an array
exports.createMultipleProducts = async (req, res) => {
  try {
    const productsArray = req.body; // Expecting an array of product data
    
    // Validate if the array is present
    if (!Array.isArray(productsArray) || productsArray.length === 0) {
      return res.status(400).json({ message: 'No products provided' });
    }

    const createdProducts = [];

    // Loop through each product in the array
    for (let productData of productsArray) {
      const { productName, category, imageUrl, originalPrice, discountPrice, currentStock } = productData;

      // Check if category is provided for each product
      if (!category) {
        return res.status(400).json({ message: `Category is required for product: ${productName}` });
      }

      // Find the category by ID or name for each product
      let categoryData = await Category.findOne({name:category}); 
        if (!categoryData) {
          return res.status(404).json({ message: `Category not found for product: ${productName}` });
        }
      

      // Ensure the category field is properly set
      if (!categoryData._id) {
        return res.status(400).json({ message: `Invalid category for product: ${productName}` });
      }

      // Create the new product
      const product = new Product({
        productName,
        category:categoryData._id, // Use the ObjectId of the category
        imageUrl,
        originalPrice,
        discountPrice,
        currentStock
      });

      // Save the product
      await product.save();

      // Add the product to the category's product array
      categoryData.products.push(product._id);
      await categoryData.save();

      // Add the created product to the response array
      createdProducts.push(product);
    }

    res.status(201).json({ message: 'Products created successfully', products: createdProducts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
  const page = parseInt(req.query.page)||1;
  const pageSize = parseInt(req.query.pageSize)||6; 
  const search = req.query.search||"";
  const offset= (page - 1) * pageSize; 
  let products;
  products = await  Product.find({productName:{$regex:search}})
    .populate({
      path: 'category',  // Field to populate
      select: 'name -_id'  // Select only the 'name' field, exclude '_id'
    }).skip(offset).limit(pageSize).lean();
    const totalCount = await Product.find({productName:{$regex:search}}).countDocuments();
    const updatedProducts = products.map(product => {
      return {
        ...product,
        category: product.category?.name || 'Unknown Category'  // Convert the category object to just the name string
      };
    }) ;
    const totalPages = Math.ceil(totalCount/ pageSize);
    res.status(200).json({updatedProducts,totalPages});
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getCategoryProducts = async (req, res) => {
  try {
    const name = req.params.name; 
   const page = parseInt(req.query.page)||1;
    const pageSize = parseInt(req.query.pageSize)||6; 
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize; 

   

    // Find category by name and populate its products
    const category = await Category.findOne({ name }).populate('products');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Extract the products
    const products = category.products; 
    const totalPages = Math.ceil(products.length / pageSize);
    // Modify each product's category field to just the name
    const updatedProducts = products.map(product => ({
      ...product._doc,  // Spread the original product data
      category: name    // Replace category object with name
    })).slice(startIndex, endIndex);

    // Send the updated products
    res.status(200).json({updatedProducts,totalPages} );
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

 
