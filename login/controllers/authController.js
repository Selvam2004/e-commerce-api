const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");


// Signup Controller  

exports.signup = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Define salt rounds
        const saltRounds = parseInt(process.env.SALT_ROUNDS) ;

        // Generate salt and hash password
        bcrypt.genSalt(saltRounds, function (err, salt) {
            if (err) {
                return res.status(500).json({ message: 'Error generating salt', error: err.message });
            }

            bcrypt.hash(password, salt, async function (err, hashedPassword) {
                if (err) {
                    return res.status(500).json({ message: 'Error hashing password', error: err.message });
                }

                // Create new user with hashed password
                const user = new User({
                    name,
                    email,
                    password: hashedPassword
                });

                await user.save();
                res.status(201).json({ message: 'User created successfully' });
            });
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};


// Login Controller
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        // Check if the password matches the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        const token = jwt.sign({ name: user.name, email: user.email }, process.env.JWT_SECRET,{expiresIn:'1hr'}); 
        res.status(200).json({ message: 'Login successful',token });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};
