// src/components/CallLogForm.js
import React, { useState } from 'react';
import axios from 'axios';
import CustomerLookup from './CustomerLookup';

export default function CallLogForm({ onAdd, customers }) {
  const [formData, setFormData] = useState({
    called_at: new Date().toISOString().slice(0, 16),
    customer_number: '',
    outcome: 'Contacted',
    remark: ''
  });
  const [error, setError] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!formData.customer_number) {
      setError('Please select a customer');
      return;
    }

    try {
      const res = await axios.post('http://localhost:8081/calllogs', {
        ...formData,
        called_at: new Date(formData.called_at).toISOString()
      });
      
      onAdd(res.data);
      setFormData({
        called_at: new Date().toISOString().slice(0, 16),
        customer_number: '',
        outcome: 'Contacted',
        remark: ''
      });
    } catch (error) {
      console.error('Error adding call log:', error);
      setError(error.response?.data?.error || 'Failed to add call log');
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title">Add New Call Log</h5>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <div className="form-floating">
                <input
                  type="datetime-local"
                  className="form-control"
                  name="called_at"
                  value={formData.called_at}
                  onChange={handleChange}
                  required
                />
                <label>Call Date/Time *</label>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="form-floating">
                <CustomerLookup
                  customers={customers}
                  value={formData.customer_number}
                  onChange={(value) => setFormData({...formData, customer_number: value})}
                  required
                />
                <label>Customer *</label>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="form-floating">
                <select
                  className="form-select"
                  name="outcome"
                  value={formData.outcome}
                  onChange={handleChange}
                  required
                >
                  <option value="Contacted">Contacted</option>
                  <option value="Not Answered">Not Answered</option>
                  <option value="Busy">Busy</option>
                  <option value="Wrong Number">Wrong Number</option>
                  <option value="Left Message">Left Message</option>
                </select>
                <label>Outcome *</label>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="form-floating">
                <textarea
                  className="form-control"
                  placeholder="Remarks"
                  name="remark"
                  value={formData.remark}
                  onChange={handleChange}
                  style={{ height: '100px' }}
                />
                <label>Remarks</label>
              </div>
            </div>
            
            <div className="col-12">
              <button type="submit" className="btn btn-primary">
                Add Call Log
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}