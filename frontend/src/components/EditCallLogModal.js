// src/components/EditCallLogModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EditCallLogModal({ callLog, onClose, onUpdate, customers }) {
  const [formData, setFormData] = useState({ 
    called_at: '',
    customer_number: '',
    outcome: '',
    remark: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (callLog) {
      const localDateTime = new Date(callLog.called_at);
      localDateTime.setMinutes(localDateTime.getMinutes() - localDateTime.getTimezoneOffset());
      
      setFormData({
        called_at: localDateTime.toISOString().slice(0, 16),
        customer_number: callLog.customer_number,
        outcome: callLog.outcome,
        remark: callLog.remark || ''
      });
    }
  }, [callLog]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await axios.put(
        `http://localhost:8081/calllogs/${callLog.id}`,
        {
          ...formData,
          called_at: new Date(formData.called_at).toISOString()
        }
      );
      
      onUpdate(res.data);
      onClose();
    } catch (error) {
      console.error('Error updating call log:', error);
      setError(error.response?.data?.error || 'Failed to update call log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Call Log</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Call Date/Time *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      name="called_at"
                      value={formData.called_at}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Customer *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.customer_number}
                      readOnly
                    />
                    <div className="form-text">Customer cannot be changed</div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Outcome *</label>
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
                  </div>
                </div>
                
                <div className="col-12">
                  <div className="mb-3">
                    <label className="form-label">Remarks</label>
                    <textarea
                      className="form-control"
                      name="remark"
                      value={formData.remark}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>
                </div>
              </div>
              
              <div className="d-flex justify-content-end mt-4">
                <button 
                  type="button" 
                  className="btn btn-secondary me-2" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}