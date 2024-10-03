const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Get all products
router.get('/getElasticSearch', productController.getElasticSearch); 
router.get('/getproducts', productController.getAllProducts); 
router.get('/getcategoryproducts/:name', productController.getCategoryProducts);
  
 

// Create a new product
router.post('/addproducts', productController.createProduct);
router.post('/addMultipleproducts',productController.createMultipleProducts);
module.exports = router;
