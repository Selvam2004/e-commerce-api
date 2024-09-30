const mongoose = require('mongoose');  
const mongoosastic = require('mongoosastic');
const { Client } = require('@elastic/elasticsearch');
const esClient = new Client({ node: 'http://localhost:9200' });
// Initialize Elasticsearch client 

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  }, 
  categoryName: {
    type: String,
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
productSchema.plugin(mongoosastic, {
  esClient,             // Elasticsearch client
  index: 'products',    // Name of the Elasticsearch index
  type: '_doc',         // Document type (_doc is default for ES 7.x+)
});
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
