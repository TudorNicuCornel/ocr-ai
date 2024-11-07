const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Register API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/org', require('./routes/org')); // Add this line
app.use('/api/admin', require('./routes/admin')); // You'll need this for admin data
app.use('/api/ai', require('./routes/ai')); // Add this line

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something broke!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});