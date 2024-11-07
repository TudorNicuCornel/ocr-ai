const express = require('express');
const router = express.Router();
const firestore = require('../config/db');

// Get admin data
router.get('/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;
    console.log('Fetching admin data for collection:', collectionId);

    const userCollection = firestore.collection(collectionId);
    const userData = await userCollection.doc('userData').get();
    const adminData = await userCollection.doc('adminData').get();

    if (!userData.exists || !adminData.exists) {
      return res.status(404).json({
        success: false,
        message: 'Admin data not found'
      });
    }

    res.status(200).json({
      success: true,
      userData: userData.data(),
      adminData: adminData.data()
    });
  } catch (error) {
    console.error('Get admin data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin data',
      error: error.message
    });
  }
});

module.exports = router;