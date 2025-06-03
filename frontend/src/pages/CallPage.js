// src/pages/CallPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LiveCallButton from '../components/LiveCallButton';

export default function CallPage() {
  const [customerNumber, setCustomerNumber] = useState('');
  const [generatedNumber, setGeneratedNumber] = useState('');
  const [callHistory, setCallHistory] = useState([]);
  const [isUsable, setIsUsable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate a random USA-looking phone number
  const generateRandomNumber = () => {
    // Format: +1 (XXX) XXX-XXXX
    const areaCode = Math.floor(Math.random() * 800) + 200;
    const prefix = Math.floor(Math.random() * 800) + 200;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    
    return `+1 (${areaCode}) ${prefix}-${lineNumber}`;
  };

  // Handle customer number submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerNumber) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Generate new number
      const newNumber = generateRandomNumber();
      setGeneratedNumber(newNumber);
      
      // Fetch call history for customer
      const response = await axios.get(`http://localhost:8081/calllogs?customer_number=${customerNumber}`);
      setCallHistory(response.data);
      
      // Check if number is usable (never been used in call history)
      const numberUsed = response.data.some(log => 
        log.customer_number === customerNumber && 
        log.remark?.includes(newNumber)
      );
      setIsUsable(!numberUsed);
      
    } catch (err) {
      console.error('Error fetching call history:', err);
      setError('Failed to fetch call history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new call log
  const handleAddCallLog = async () => {
    if (!generatedNumber || !customerNumber) return;
    
    try {
      const newCall = {
        called_at: new Date().toISOString(),
        customer_number: customerNumber,
        outcome: 'Connected',
        remark: `Called from: ${generatedNumber}`
      };
      
      await axios.post('http://localhost:8081/calllogs', newCall);
      
      // Update call history
      const response = await axios.get(`http://localhost:8081/calllogs?customer_number=${customerNumber}`);
      setCallHistory(response.data);
      
      // Number is now used
      setIsUsable(false);
      
    } catch (err) {
      console.error('Error adding call log:', err);
      setError('Failed to add call log. Please try again.');
    }
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <section className="container py-4">
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h2 className="card-title mb-4">Call Management</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-end">
              <div className="col-md-8">
                <div className="form-floating">
                  <input
                    type="tel"
                    className="form-control"
                    id="customerNumber"
                    placeholder="Customer Phone Number"
                    value={customerNumber}
                    onChange={(e) => setCustomerNumber(e.target.value)}
                    required
                    pattern="[\d\s+]{5,}"
                  />
                  <label htmlFor="customerNumber">Customer Phone Number *</label>
                  <div className="form-text">Enter the customer's phone number to view call history</div>
                </div>
              </div>
              
              <div className="col-md-4">
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                      Loading...
                    </>
                  ) : 'Get Call History'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      {generatedNumber && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title mb-0">Generated Caller ID</h5>
              <button 
                className="btn btn-outline-primary"
                onClick={() => setGeneratedNumber(generateRandomNumber())}
              >
                Generate New Number
              </button>
            </div>
            
            <div className="d-flex align-items-center">
              <div className="display-4 text-primary fw-bold me-3">
                {generatedNumber}
              </div>
              
              <div>
                {isUsable ? (
                  <span className="badge bg-success fs-6">Number is usable</span>
                ) : (
                  <span className="badge bg-danger fs-6">Number already used</span>
                )}
              </div>

              <LiveCallButton/>
              
            </div>
            
            <p className="mt-3">
              {isUsable 
                ? "This number has never been used to call this customer before." 
                : "This number has been used previously to call this customer."}
            </p>
            
            <div className="d-grid mt-3">
              <button 
                className="btn btn-success"
                onClick={handleAddCallLog}
                disabled={!isUsable}
              >
                <i className="bi bi-telephone me-2"></i>
                Place Call with This Number
              </button>
            </div>
          </div>
        </div>
      )}
      
      {callHistory.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-4">Call History for {customerNumber}</h5>
            
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Date & Time</th>
                    <th>Caller ID</th>
                    <th>Outcome</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {callHistory.map((log) => {
                    // Extract caller ID from remark
                    const callerIdMatch = log.remark?.match(/Called from: (.*)/);
                    const callerId = callerIdMatch ? callerIdMatch[1] : 'Unknown';
                    
                    return (
                      <tr key={log.id}>
                        <td>{formatDate(log.called_at)}</td>
                        <td>{callerId}</td>
                        <td>
                          <span className={`badge ${
                            log.outcome === 'Connected' ? 'bg-success' : 
                            log.outcome === 'Voicemail' ? 'bg-warning text-dark' : 'bg-danger'
                          }`}>
                            {log.outcome}
                          </span>
                        </td>
                        <td>{log.remark}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {!callHistory.length && customerNumber && !loading && (
        <div className="alert alert-info">
          No call history found for this customer number.
        </div>
      )}
    </section>
  );
}