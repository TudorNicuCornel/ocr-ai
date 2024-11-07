const firestore = require('../config/db');

class User {
  static async findByEmail(collectionId, email) {
    try {
      const usersRef = firestore.collection(collectionId);
      const snapshot = await usersRef.where('email', '==', email).get();
      return !snapshot.empty ? snapshot.docs[0].data() : null;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }

  static async create(collectionId, userData) {
    try {
      const usersRef = firestore.collection(collectionId);
      await usersRef.add(userData);
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
}

module.exports = User;