import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    cui: ''
  });
  const [userType, setUserType] = useState('company');
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userType
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Store the basic info
        localStorage.setItem('collectionId', data.collectionId);
        localStorage.setItem('userType', userType);
        
        // If company data is available, store it
        if (data.companyData) {
          localStorage.setItem('companyData', JSON.stringify(data.companyData));
        }

        // If there was an error fetching company data, show a warning but continue
        if (data.companyData?.fetchError) {
          console.warn('Note:', data.companyData.fetchError);
        }

        navigate('/admin-setup');
      } else {
        alert(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Could not connect to the server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Login</h1>
        <div className="user-type-selector">
          <button 
            className={`type-btn ${userType === 'company' ? 'active' : ''}`}
            onClick={() => setUserType('company')}
            type="button"
          >
            Company
          </button>
          <button 
            className={`type-btn ${userType === 'freelance' ? 'active' : ''}`}
            onClick={() => setUserType('freelance')}
            type="button"
          >
            Freelance
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          {userType === 'company' && (
            <div className="form-group">
              <input
                type="text"
                name="cui"
                placeholder="CUI"
                value={formData.cui}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Loading...' : `Login as ${userType}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;