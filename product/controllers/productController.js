const Product = require('../models/Product');
const Category = require('../models/Category');
const { Client } = require('@elastic/elasticsearch');
const client = new Client({
  node: 'http://localhost:9200' // your Elasticsearch server
});;
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
    
    product.on('es-indexed', (err, result) => {
      if (err) console.log('Error indexing to Elasticsearch', err);
      else console.log('Product indexed successfully');
    });
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
      const { productName, categoryName, imageUrl, originalPrice, discountPrice, currentStock } = productData;

      // Check if category is provided for each product
    

      // Find the category by ID or name for each product
      let categoryData = await Category.findOne({name:categoryName}); 
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
        categoryName, // Use the ObjectId of the category
        imageUrl,
        originalPrice,
        discountPrice,
        currentStock
      });

      // Save the product
      await product.save();
      product.on('es-indexed', (err, result) => {
        if (err) console.log('Error indexing to Elasticsearch', err);
        else console.log('Product indexed successfully');
      });

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


exports.getElasticSearch =  async (req, res) => {
  try {
    // Assuming you're passing query params like ?name=Product%20A
    const queryParam = req.query.name||''; 
    const response = await client.search({
      index: 'products',
      body: {
        query: { 
          bool: {
            should: [
              {
                match_phrase_prefix: {
                  productName: queryParam // Match productName with prefix
                }
              },
              {
                match_phrase_prefix: {
                  categoryName: queryParam // Match categoryName with prefix (add more fields as needed)
                }
              },
              // Add more fields here if needed
            ]
          }
          
        }
      }
    });  
    const hits = response.hits.hits.map(hit => hit._source);
    // Check if results are found
    if (hits && hits.length > 0) {
      res.status(200).json(hits);
    } else {
      res.status(404).json({ error: 'No results found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
      
// Get all products
exports.getAllProducts = async (req, res) => {
  try {
  const page = parseInt(req.query.page)||1;
  const pageSize = parseInt(req.query.pageSize)||6; 
  const search = req.query.search||"";
  const offset= (page - 1) * pageSize; 
  let products;
  products = await  Product.find({$or:[{productName:{$regex:search}},{categoryName:{$regex:search}}]}).skip(offset).limit(pageSize).lean();
    const totalCount = await Product.find({productName:{$regex:search}}).countDocuments(); 
    const totalPages = Math.ceil(totalCount/ pageSize);
    res.status(200).json({products,totalPages});
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
    const updatedProducts = products.slice(startIndex, endIndex);

    // Send the updated products
    res.status(200).json({updatedProducts,totalPages} );
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

 
