const Category = require('../model/Category'); 


// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1;
    const pageSize = parseInt(req.query.pageSize)||6;  
    const offset= (page - 1) * pageSize; 
    const categories = await Category.find().skip(offset).limit(pageSize).lean();
    const totalCount = await Category.countDocuments(); 
    const totalPages = Math.ceil(totalCount/ pageSize);
    res.status(200).json({categories,totalPages});
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


 
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
