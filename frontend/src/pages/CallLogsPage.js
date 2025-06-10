// src/pages/CallLogsPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CallLogForm from '../components/CallLogForm';
import EditCallLogModal from '../components/EditCallLogModal';
import CustomerLookup from '../components/CustomerLookup';

export default function CallLogsPage() {
  const [callLogs, setCallLogs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCallLog, setEditingCallLog] = useState(null);
  const [filters, setFilters] = useState({
    customer_number: '',
    outcome: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchCallLogs();
    fetchCustomers();
  }, []);

  const fetchCallLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const res = await axios.get(`http://localhost:8081/calllogs?${params}`);
      setCallLogs(res.data);
      setError('');
    } catch (error) {
      console.error('Error fetching call logs:', error);
      setError('Failed to load call logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('http://localhost:8081/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleAdd = (newCallLog) => {
    setCallLogs([newCallLog, ...callLogs]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this call log?')) return;
    
    try {
      await axios.delete(`http://localhost:8081/calllogs/${id}`);
      setCallLogs(callLogs.filter(log => log.id !== id));
    } catch (error) {
      console.error('Error deleting call log:', error);
      setError('Failed to delete call log. Please try again.');
    }
  };

  const handleEdit = (callLog) => {
    setEditingCallLog(callLog);
  };

  const handleUpdate = (updatedCallLog) => {
    setCallLogs(callLogs.map(log => 
      log.id === updatedCallLog.id ? updatedCallLog : log
    ));
    setEditingCallLog(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchCallLogs();
  };

  const resetFilters = () => {
    setFilters({
      customer_number: '',
      outcome: '',
      start_date: '',
      end_date: ''
    });
    fetchCallLogs();
  };

  return (
    <section className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Call Log Management</h2>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      <CallLogForm 
        onAdd={handleAdd} 
        customers={customers} 
      />

      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Filter Call Logs</h5>
        </div>
        <div className="card-body">
          <form onSubmit={applyFilters}>
            <div className="row g-3">
              <div className="col-md-3">
                <CustomerLookup
                  customers={customers}
                  value={filters.customer_number}
                  onChange={(value) => setFilters({...filters, customer_number: value})}
                />
              </div>
              
              <div className="col-md-2">
                <select
                  className="form-select"
                  name="outcome"
                  value={filters.outcome}
                  onChange={handleFilterChange}
                >
                  <option value="">All Outcomes</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Not Answered">Not Answered</option>
                  <option value="Busy">Busy</option>
                  <option value="Wrong Number">Wrong Number</option>
                  <option value="Left Message">Left Message</option>
                </select>
              </div>
              
              <div className="col-md-3">
                <label className="form-label">Start Date</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div className="col-md-3">
                <label className="form-label">End Date</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div className="col-md-1 d-flex align-items-end">
                <button type="submit" className="btn btn-primary me-2">
                  Apply
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <h3 className="mt-5 mb-4">Call Log History</h3>
      
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading call logs...</p>
        </div>
      ) : callLogs.length === 0 ? (
        <div className="alert alert-info">
          No call logs found. Please add some call logs.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Date/Time</th>
                <th>Customer</th>
                <th>Outcome</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {callLogs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.called_at).toLocaleString()}</td>
                  <td>
                    <div>{log.customer_number}</div>
                    {log.customer_location && (
                      <small className="text-muted">{log.customer_location}</small>
                    )}
                  </td>
                  <td>
                    <span className={`badge bg-${log.outcome === 'Contacted' ? 'success' : 'warning'}`}>
                      {log.outcome}
                    </span>
                  </td>
                  <td>{log.remark || '—'}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleEdit(log)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(log.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingCallLog && (
        <EditCallLogModal 
          callLog={editingCallLog}
          onClose={() => setEditingCallLog(null)}
          onUpdate={handleUpdate}
          customers={customers}
        />
      )}
    </section>
  );
}