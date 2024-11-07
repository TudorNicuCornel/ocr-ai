const API_BASE_URL = '/api/org';

export const orgService = {
  async saveOrgChart(collectionId, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/${collectionId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving org chart:', error);
      throw error;
    }
  },

  async getOrgChart(collectionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/${collectionId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting org chart:', error);
      throw error;
    }
  },

  async uploadFiles(collectionId, files) {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/${collectionId}/upload`, {
        method: 'POST',
        body: formData
      });
      return await response.json();
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },

  async deleteDocument(collectionId, fileName) {
    try {
      const response = await fetch(`${API_BASE_URL}/${collectionId}/document`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName })
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
};