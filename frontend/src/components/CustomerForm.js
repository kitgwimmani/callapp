// src/components/CustomerForm.js
import React, { useState } from 'react';
import axios from 'axios';

export default function CustomerForm({ onAdd }) {
  const [formData, setFormData] = useState({
    customer_number: '',
    location: '',
    gender: 'Male'
  });
  const [error, setError] = useState('');

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // Basic phone number validation
    const cleanNumber = formData.customer_number.replace(/[^\d+]/g, '');
    if (cleanNumber.length < 5) {
      setError('Invalid phone number');
      return;
    }

    try {
      const res = await axios.post('http://localhost:8081/customers', {
        ...formData,
        customer_number: cleanNumber
      });
      
      onAdd(res.data);
      setFormData({ customer_number: '', location: '', gender: 'Male' });
    } catch (error) {
      console.error('Error adding customer:', error);
      setError(error.response?.data?.error || 'Failed to add customer');
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title">Add New Customer</h5>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="form-floating">
                <input
                  type="tel"
                  className="form-control"
                  id="customerNumber"
                  placeholder="Phone Number"
                  name="customer_number"
                  value={formData.customer_number}
                  onChange={handleChange}
                  required
                  pattern="[\d\s+]{5,}"
                />
                <label htmlFor="customerNumber">Phone Number *</label>
                <div className="form-text">Format: numbers and + only</div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="form-floating">
                <input
                  type="text"
                  className="form-control"
                  id="location"
                  placeholder="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
                <label htmlFor="location">Location</label>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <label htmlFor="gender">Gender</label>
              </div>
            </div>
            
            <div className="col-md-1 d-flex align-items-end">
              <button type="submit" className="btn btn-primary w-100">
                Add
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}