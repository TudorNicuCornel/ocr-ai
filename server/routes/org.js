const express = require('express');
const router = express.Router();
const firestore = require('../config/db');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = process.env.googleCloudStorageBucketName;
const bucket = storage.bucket(bucketName);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Save org chart data
router.post('/:collectionId/save', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { departments, connections, adminData } = req.body;

    const orgRef = firestore.collection(collectionId).doc('orgChart');
    const doc = await orgRef.get();

    let existingData = {};
    if (doc.exists) {
      existingData = doc.data();
    }

    // Merge new data with existing data
    const mergedData = {
      departments: mergeDepartments(existingData.departments || [], departments),
      connections,
      adminData: mergeAdminData(existingData.adminData || {}, adminData),
      updatedAt: new Date().toISOString()
    };

    await orgRef.set(mergedData);

    res.status(200).json({
      success: true,
      message: 'Organization chart saved successfully'
    });
  } catch (error) {
    console.error('Save org chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save organization chart',
      error: error.message
    });
  }
});

function mergeDepartments(existingDepartments = [], newDepartments = []) {
  const mergedDepartments = existingDepartments.map(existingDept => {
    const newDept = newDepartments.find(dept => dept.id === existingDept.id);
    if (newDept) {
      return {
        ...existingDept,
        ...newDept,
        employees: mergeEmployees(existingDept.employees, newDept.employees)
      };
    }
    return existingDept;
  });

  // Add any new departments that didn't exist before
  newDepartments.forEach(newDept => {
    if (!existingDepartments.find(dept => dept.id === newDept.id)) {
      mergedDepartments.push(newDept);
    }
  });

  return mergedDepartments;
}

function mergeEmployees(existingEmployees = [], newEmployees = []) {
  const mergedEmployees = existingEmployees.map(existingEmp => {
    const newEmp = newEmployees.find(emp => emp.id === existingEmp.id);
    if (newEmp) {
      return {
        ...existingEmp,
        ...newEmp,
        documents: {
          ci: mergeDocuments(existingEmp.documents.ci, newEmp.documents.ci),
          contract: mergeDocuments(existingEmp.documents.contract, newEmp.documents.contract),
          cv: mergeDocuments(existingEmp.documents.cv, newEmp.documents.cv)
        }
      };
    }
    return existingEmp;
  });

  // Add any new employees that didn't exist before
  newEmployees.forEach(newEmp => {
    if (!existingEmployees.find(emp => emp.id === newEmp.id)) {
      mergedEmployees.push(newEmp);
    }
  });

  return mergedEmployees;
}

function mergeDocuments(existingDocs = [], newDocs = []) {
  const existingPaths = existingDocs.map(doc => (typeof doc === 'string' ? doc : doc.path));
  const newUniqueDocs = newDocs.filter(doc => {
    const path = typeof doc === 'string' ? doc : doc.path;
    return !existingPaths.includes(path);
  });
  return [...existingDocs, ...newUniqueDocs];
}

function mergeAdminData(existingAdminData = {}, newAdminData = {}) {
  return {
    ...existingAdminData,
    ...newAdminData,
    documents: {
      ci: mergeDocuments(existingAdminData.documents?.ci, newAdminData.documents?.ci),
      contract: mergeDocuments(existingAdminData.documents?.contract, newAdminData.documents?.contract),
      cv: mergeDocuments(existingAdminData.documents?.cv, newAdminData.documents?.cv)
    }
  };
}

// Get org chart data
router.get('/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const orgRef = firestore.collection(collectionId).doc('orgChart');
    const doc = await orgRef.get();

    if (!doc.exists) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: doc.data()
    });
  } catch (error) {
    console.error('Get org chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get organization chart',
      error: error.message
    });
  }
});

// Upload document
router.post('/:collectionId/:userId/upload', upload.single('file'), async (req, res) => {
  const { collectionId, userId } = req.params;
  const { section } = req.body;

  if (!['ci', 'contract', 'cv'].includes(section)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid section. Must be one of: ci, contract, cv'
    });
  }

  try {
    const file = req.file;
    const fileName = `${userId}/${section}/${file.originalname}`;
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      resumable: false
    });

    blobStream.on('error', (err) => {
      console.error('File upload error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to upload file',
        error: err.message
      });
    });

    blobStream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

      // Call the existing method to get the org chart
      const orgChart = await getOrgChart(collectionId);
      const user = findUserInOrgChart(orgChart, userId);

      if (user) {
        user.documents[section].push(publicUrl);
        await updateOrgChart(collectionId, orgChart);
      }

      res.status(200).json({
        success: true,
        fileUrl: publicUrl
      });
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
});

async function getOrgChart(collectionId) {
  const orgRef = firestore.collection(collectionId).doc('orgChart');
  const doc = await orgRef.get();
  if (!doc.exists) {
    throw new Error('Org chart not found');
  }
  return doc.data();
}

function findUserInOrgChart(orgChart, userId) {
  for (const department of orgChart.departments) {
    for (const employee of department.employees) {
      if (employee.id === userId) {
        return employee;
      }
    }
  }
  if (orgChart.adminData.id === userId) {
    return orgChart.adminData;
  }
  return null;
}

async function updateOrgChart(collectionId, orgChart) {
  const orgRef = firestore.collection(collectionId).doc('orgChart');
  await orgRef.set(orgChart);
}

router.get('/:collectionId/admin/documents', async (req, res) => {
  const { collectionId } = req.params;
  const orgRef = firestore.collection(collectionId).doc('orgChart');
  const doc = await orgRef.get();

  if (!doc.exists) {
    return res.status(200).json({
      success: true,
      data: null
    });
  }

  const orgData = doc.data();
  const adminDocuments = orgData.adminData?.documents || null;

  if (!adminDocuments) {
    return res.status(404).json({
      success: false,
      message: 'Admin documents not found'
    });
  }

  res.status(200).json({
    success: true,
    data: adminDocuments
  });
});

// Generate signed URL
router.get('/signed-url', async (req, res) => {
  const { fileName } = req.query;

  if (!fileName) {
    return res.status(400).json({ success: false, message: 'File name is required' });
  }

  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  try {
    const [url] = await storage
      .bucket(bucketName)
      .file(fileName)
      .getSignedUrl(options);

    // Convert the URL to the authenticated URL format
    const authenticatedUrl = url.replace('storage.googleapis.com', 'storage.cloud.google.com');

    res.status(200).json({ success: true, url: authenticatedUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ success: false, message: 'Failed to generate signed URL' });
  }
});

module.exports = router;