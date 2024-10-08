const Product = require('../models/Product');
const Category = require('../../category/model/Category');
const { Client } = require('@elastic/elasticsearch');
const client = new Client({
  node: 'http://localhost:9200' // your Elasticsearch server
});

exports.getElasticSearch = async (req, res) => {
  const page = parseInt(req.query.page)||1;
    const pageSize = parseInt(req.query.pageSize)||6;  
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;  
  const input = req.query.search || ''; // Default to an empty string if undefined

  if (!input) {
    return res.status(400).json({ error: 'Search term is required.' });
  }

  // Regular expressions to extract price conditions and their values
  const priceConditionMatch = input.match(/(above|below|greater than|less than|gt|lt|at|under|over)\s*(\d+)/i);
  let rangeCondition = null;
  let priceValue = null;

  // Determine the range condition and price value if present
  if (priceConditionMatch) {
    const condition = priceConditionMatch[1].toLowerCase();
    priceValue = parseInt(priceConditionMatch[2], 10);
    
    // Map user-friendly terms to Elasticsearch conditions
    rangeCondition = condition === 'above' || condition === 'greater than' || condition === 'gt' || condition === 'over'
      ? 'gt' 
      : 'lt'; 
  }
 
  const body = {
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query: input,
              fields: [
                'productName^2', 
                'categoryName^1',  
                'description'  
              ],
              type: 'most_fields'  ,
              //fuzziness: '1'
            },
          },
        ],
        ...(rangeCondition && {
          filter: {
            range: {
              discountPrice: {
                [rangeCondition]: priceValue,
              },
            },
          },
        }),
      },
    }, 
 
    size: 50, 
  };

 

  try {
    // Perform the search using the Elasticsearch client
    const  searchResponse  = await client.search({
      index: 'products',  
      body,
    });
    const results = searchResponse.hits.hits.map(hit=>hit._source);
    const totalCount =results.length;  
        const totalPages = Math.ceil(totalCount/ pageSize);
        const updatedProducts =results.slice(startIndex,endIndex)
    const categorySuggestions = searchResponse.aggregations;

    return res.json({ updatedProducts, totalPages,categorySuggestions });
  } catch (error) {
    console.error('Elasticsearch search error:', error);
    return res.status(500).json({ error: 'Error fetching results from Elasticsearch' });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
  const page = parseInt(req.query.page)||1;
  const pageSize = parseInt(req.query.pageSize)||6;  
  const offset= (page - 1) * pageSize; 
  let products;
  products = await  Product.find().skip(offset).limit(pageSize).lean();
    const totalCount = await Product.countDocuments(); 
    const totalPages = Math.ceil(totalCount/ pageSize);
    res.status(200).json({products,totalPages});
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


// exports.getElasticSearch =  async (req, res) => {
//   try { 
//     const page = parseInt(req.query.page)||1;
//     const pageSize = parseInt(req.query.pageSize)||6; 
//     const search = req.query.search||"";
//     const startIndex = (page - 1) * pageSize;
//     const endIndex = page * pageSize;  
//     const response = await client.search({
//       index: 'products',
//       body: {
//         size:100,
//         query: { 
//           bool: {
//             should: [
//               {
//                 match_phrase_prefix: {
//                   productName: search// Match productName with prefix
//                 }
//               },
//               {
//                 match_phrase_prefix: {
//                   categoryName: search // Match categoryName with prefix (add more fields as needed)
//                 }
//               },
//               {
//                 match_phrase_prefix: {
//                   description: search // Match categoryName with prefix (add more fields as needed)
//                 }
//               },
              
//               // Add more fields here if needed
//             ]
//           }
          
//         }
//       }
//     });   
//     const products = response.hits.hits.map(hit => hit._source);  
//     const totalCount =products.length;  
//     const totalPages = Math.ceil(totalCount/ pageSize);
//     const updatedProducts = products.slice(startIndex,endIndex)

//     if (updatedProducts && updatedProducts.length > 0) {
//       res.status(200).json({updatedProducts,totalPages});
//     } else {
//       res.status(404).json({ error: 'No results found' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }
       
// Get all products
// exports.getAllProducts = async (req, res) => {
//   try {
//   const page = parseInt(req.query.page)||1;
//   const pageSize = parseInt(req.query.pageSize)||6; 
//   const search = req.query.search||"";
//   const offset= (page - 1) * pageSize; 
//   let products;
//   products = await  Product.find({$or:[{productName:{$regex:search}},{categoryName:{$regex:search}}]}).skip(offset).limit(pageSize).lean();
//     const totalCount = await Product.find({$or:[{productName:{$regex:search}},{categoryName:{$regex:search}}]}).countDocuments(); 
//     const totalPages = Math.ceil(totalCount/ pageSize);
//     res.status(200).json({products,totalPages});
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error });
//   }
// };

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
      const { productName, categoryName,description, imageUrl, originalPrice, discountPrice, currentStock } = productData;

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
        categoryName, 
        description,// Use the ObjectId of the category
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