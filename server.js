const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const authRoutes = require('./login/routes/authRoutes');
const categoryRoutes = require('./product/routes/categoryRoutes');
const productRoutes = require('./product/routes/productRoutes');
require('dotenv').config(); // Load .env variables
const cors = require('cors')


const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
 
 
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('MongoDB connected'))
.catch((error) => console.log('MongoDB connection error:', error));

// Routes
app.use('/', authRoutes);
app.use('/category', categoryRoutes);
app.use('/product', productRoutes);

// Start server using the PORT from the .env file
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
