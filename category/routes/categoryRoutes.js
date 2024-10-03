const express = require('express');
const router = express.Router();
const categoryController = require('../controller/categoryController');


// Get all categories
router.get('/getcategories', categoryController.getAllCategories);



// Create a new category
router.post('/addcategories', categoryController.createCategory);
 
module.exports = router;
 