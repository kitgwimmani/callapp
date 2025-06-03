import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    callsToday: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8081/dashboard-stats');
        setStats(response.data);
        setError('');
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load dashboard statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container py-4">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-primary mb-3">Smart Solutions Dashboard</h1>
        <p className="lead text-muted">With Real-time statistics and management</p>
      </div>
      
      {error && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}
      
      
      
      <div className="row g-4">
        {/* Customers Card */}
        <div className="col-md-6 col-lg-3 mb-4">
          <div className="card border-0 shadow-lg h-100 hover-lift">
            <div className="card-body p-4 text-center">
              <div className="icon-wrapper bg-primary-light rounded-circle p-3 mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-people-fill text-primary" viewBox="0 0 16 16">
                  <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                  <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/>
                  <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
                </svg>
              </div>
              <h3 className="h5 fw-bold mb-3">Customers</h3>
              <p className="text-muted mb-4">Manage customer information and profiles</p>
              <Link to="/customers" className="btn btn-outline-primary px-4">
                Manage
              </Link>
            </div>
          </div>
        </div>
        
        {/* Call Logs Card */}
        <div className="col-md-6 col-lg-3 mb-4">
          <div className="card border-0 shadow-lg h-100 hover-lift">
            <div className="card-body p-4 text-center">
              <div className="icon-wrapper bg-info-light rounded-circle p-3 mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-journal-text text-info" viewBox="0 0 16 16">
                  <path d="M5 10.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                  <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                  <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
                </svg>
              </div>
              <h3 className="h5 fw-bold mb-3">Call Logs</h3>
              <p className="text-muted mb-4">Track and manage call records and history</p>
              <Link to="/call-logs" className="btn btn-outline-info px-4">
                View Logs
              </Link>
            </div>
          </div>
        </div>
        
        {/* Users Card */}
        <div className="col-md-6 col-lg-3 mb-4">
          <div className="card border-0 shadow-lg h-100 hover-lift">
            <div className="card-body p-4 text-center">
              <div className="icon-wrapper bg-success-light rounded-circle p-3 mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-person-badge-fill text-success" viewBox="0 0 16 16">
                  <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm4.5 0a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm5 2.755C12.146 12.825 10.623 12 8 12s-4.146.826-5 1.755V14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-.245z"/>
                </svg>
              </div>
              <h3 className="h5 fw-bold mb-3">Users</h3>
              <p className="text-muted mb-4">Manage system users and permissions</p>
              <Link to="/users" className="btn btn-outline-success px-4">
                Manage Users
              </Link>
            </div>
          </div>
        </div>
        
        {/* Make a Call Card */}
        <div className="col-md-6 col-lg-3 mb-4">
          <div className="card border-0 shadow-lg h-100 hover-lift">
            <div className="card-body p-4 text-center">
              <div className="icon-wrapper bg-warning-light rounded-circle p-3 mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-telephone-outbound-fill text-warning" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511zM11 .5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V1.707l-4.146 4.147a.5.5 0 0 1-.708-.708L14.293 1H11.5a.5.5 0 0 1-.5-.5z"/>
                </svg>
              </div>
              <h3 className="h5 fw-bold mb-3">Make a Call</h3>
              <p className="text-muted mb-4">Initiate a new call with customer</p>
              <Link to="/call" className="btn btn-warning px-4 fw-bold">
                Start Calling
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Stats Section */}
      <div className="row mb-5">
        <div className="col-lg-10 mx-auto">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="row text-center">
                <div className="col-md-4 border-end py-3">
                  <div className="fs-2 fw-bold text-primary">
                    {loading ? (
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : stats.customers}
                  </div>
                  <div className="text-muted">
                    <i className="bi bi-people me-2"></i>
                    Active Customers
                  </div>
                </div>
                <div className="col-md-4 border-end py-3">
                  <div className="fs-2 fw-bold text-info">
                    {loading ? (
                      <div className="spinner-border spinner-border-sm text-info" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : stats.callsToday}
                  </div>
                  <div className="text-muted">
                    <i className="bi bi-telephone me-2"></i>
                    Calls Today
                  </div>
                </div>
                <div className="col-md-4 py-3">
                  <div className="fs-2 fw-bold text-success">
                    {loading ? (
                      <div className="spinner-border spinner-border-sm text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      `${stats.successRate}%`
                    )}
                  </div>
                  <div className="text-muted">
                    <i className="bi bi-check-circle me-2"></i>
                    Success Rate
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175) !important;
        }
        .icon-wrapper {
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bg-primary-light {
          background-color: rgba(13, 110, 253, 0.1);
        }
        .bg-info-light {
          background-color: rgba(13, 202, 240, 0.1);
        }
        .bg-success-light {
          background-color: rgba(25, 135, 84, 0.1);
        }
        .bg-warning-light {
          background-color: rgba(255, 193, 7, 0.1);
        }
      `}</style>
    </div>
  );
}