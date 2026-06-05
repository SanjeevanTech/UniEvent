const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a student
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, image } = req.body;

  // Simple validation
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter all required fields.' });
  }

  // Check email domain
  if (!email.endsWith('@vau.ac.lk')) {
    return res.status(400).json({ success: false, message: 'Please use a valid university email (@vau.ac.lk).' });
  }

  try {
    // Check for existing user
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const newUserResult = await db.query(
      'INSERT INTO users (name, email, password, role, image) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, image',
      [name, email, hashedPassword, 'student', image || null]
    );

    const user = newUserResult.rows[0];
    
    // Convert id to string to match AsyncStorage type expectation in frontend
    user.id = String(user.id);

    // Create JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
  }

  try {
    // Check for user
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No account found with this email. Please sign up.' });
    }

    const user = userResult.rows[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect password.' });
    }

    // Convert id to string
    const userResponse = {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image
    };

    // Create JWT Token
    const token = jwt.sign(
      { id: userResponse.id, email: userResponse.email, role: userResponse.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, email, image } = req.body;
  const userId = req.user.id;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and Email are required.' });
  }

  try {
    // Check if email is being changed and is already taken
    const emailCheckResult = await db.query('SELECT * FROM users WHERE email = $1 AND id != $2', [email, userId]);
    if (emailCheckResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const updateResult = await db.query(
      'UPDATE users SET name = $1, email = $2, image = $3 WHERE id = $4 RETURNING id, name, email, role, image',
      [name, email, image || null, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = updateResult.rows[0];
    user.id = String(user.id);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error during profile update.' });
  }
});

module.exports = router;
