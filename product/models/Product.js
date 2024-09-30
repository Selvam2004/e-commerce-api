const mongoose = require('mongoose');  

// Initialize Elasticsearch client 

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',  // Reference to the Category model
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  discountPrice: {
    type: Number,
    required: true
  },
  currentStock: {
    type: Number,
    required: true
  }
}); 

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
