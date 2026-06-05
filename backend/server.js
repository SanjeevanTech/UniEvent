const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Function to seed default admin on startup if they don't exist
const seedDefaultAdmin = async () => {
  try {
    const adminEmail = 'admin@vau.ac.lk';
    
    // Check if table users exists (it might not be created yet if db container is still initializing, we will retry)
    const tableCheck = await db.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')"
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log('Database tables do not exist yet. Waiting for initialization...');
      return;
    }

    const adminCheck = await db.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    
    if (adminCheck.rows.length === 0) {
      console.log('Default admin not found. Seeding admin user...');
      const defaultPassword = 'Admin123';
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);
      
      await db.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
        ['System Admin', adminEmail, hashedPassword, 'admin']
      );
      
      console.log('Default administrator user seeded successfully!');
    } else {
      console.log('Default administrator user verified.');
    }
  } catch (error) {
    console.error('Error seeding default admin:', error.message);
  }
};

// Start Server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Wait a few seconds to let DB startup if starting simultaneously, then verify/seed admin
  setTimeout(seedDefaultAdmin, 3000);
});
