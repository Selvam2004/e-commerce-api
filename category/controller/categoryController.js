const Category = require('../model/Category'); 

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body; 

    // Check if category with the same name already exists
    let category = await Category.findOne({ name });
    if (category) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // Create new category
    category = new Category({ name, description, imageUrl });
    await category.save();
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

 
 
