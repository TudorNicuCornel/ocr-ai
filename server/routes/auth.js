// server/routes/auth.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const firestore = require('../config/db');

router.post('/login', async (req, res) => {
  try {
    const { email, password, cui, userType } = req.body;
    console.log('Login attempt:', { email, userType, cui });

    // Generate collection ID
    const collectionId = userType === 'company' ? cui : crypto.randomBytes(16).toString('hex');

    // Initialize company data
    let companyData = null;

    // Only try to fetch company data if it's a company user
    if (userType === 'company' && cui) {
      try {
        const response = await axios.get(`https://api.aipro.ro/get?cui=${cui}`, {
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        });
        companyData = response.data;
        console.log('Company data fetched:', companyData);
      } catch (apiError) {
        console.log('Warning: Could not fetch company data:', apiError.message);
        companyData = {
          cui: cui,
          fetchError: 'Could not fetch additional company data',
          timestamp: new Date().toISOString()
        };
      }
    }

    // Create a new collection for the user if it doesn't exist
    try {
      const userCollection = firestore.collection(collectionId);
      
      // Save user data
      await userCollection.doc('userData').set({
        email,
        password, // In a real app, hash this password
        userType,
        cui: userType === 'company' ? cui : null,
        companyData,
        createdAt: new Date().toISOString()
      });

      console.log('Data saved successfully to collection:', collectionId);

      res.status(200).json({
        success: true,
        message: 'Login successful and data saved',
        collectionId,
        companyData,
        userType
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({
        success: false,
        message: 'Failed to save data to database',
        error: dbError.message
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false,
      message: 'An unexpected error occurred',
      error: error.message 
    });
  }
});

router.post('/admin-setup', async (req, res) => {
    try {
      const { 
        collectionId,
        firstName,
        lastName,
        phone,
        linkedIn,
        position,
        department
      } = req.body;
  
      if (!collectionId) {
        return res.status(400).json({ 
          success: false,
          message: 'Collection ID is required' 
        });
      }
  
      // Get reference to the user's collection
      const userCollection = firestore.collection(collectionId);
  
      // Save admin data
      await userCollection.doc('adminData').set({
        firstName,
        lastName,
        phone,
        linkedIn,
        position,
        department,
        updatedAt: new Date().toISOString()
      });
  
      res.status(200).json({
        success: true,
        message: 'Admin setup completed successfully'
      });
  
    } catch (error) {
      console.error('Admin setup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save admin data',
        error: error.message
      });
    }
  });

module.exports = router;