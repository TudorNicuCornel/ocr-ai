// server/config/db.js
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    databaseId: process.env.FIRESTORE_DATABASE_ID,
    apiEndpoint: 'firestore.googleapis.com',
  });

// Test the connection
async function testConnection() {
  try {
    const testCollection = firestore.collection('test');
    await testCollection.doc('test').set({ test: true });
    console.log('Firestore connection successful');
  } catch (error) {
    console.error('Firestore connection error:', error);
  }
}

testConnection();

module.exports = firestore;