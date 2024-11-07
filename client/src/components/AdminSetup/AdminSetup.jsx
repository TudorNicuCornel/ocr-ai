import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminSetup.css';

const AdminSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    linkedIn: '',
    position: '',
    department: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Get email and collection ID from localStorage
  const collectionId = localStorage.getItem('collectionId');
  const userType = localStorage.getItem('userType');

  useEffect(() => {
    // Redirect to login if no collectionId exists
    if (!collectionId) {
      navigate('/login');
    }
  }, [collectionId, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/admin-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId,
          ...formData
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate based on user type
        if (userType === 'company') {
          navigate('/org-chart');
        } else {
          navigate('/download');
        }
      } else {
        alert(data.message || 'Setup failed');
      }
    } catch (error) {
      console.error('Setup error:', error);
      alert('An error occurred during setup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-setup-container">
      <div className="admin-setup-box">
        <h1>Admin Setup</h1>
        <p className="subtitle">Please complete your profile information</p>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="linkedIn">LinkedIn Profile (optional)</label>
            <input
              type="url"
              id="linkedIn"
              name="linkedIn"
              value={formData.linkedIn}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/your-profile"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="position">Position</label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSetup;