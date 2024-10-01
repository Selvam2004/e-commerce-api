const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Create a new category
router.post('/addcategories', categoryController.createCategory);

// Get all categories
router.get('/getcategories', categoryController.getAllCategories);
 
module.exports = router;
 