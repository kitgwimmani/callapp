// src/pages/CustomersPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CustomerForm from '../components/CustomerForm';
import EditCustomerModal from '../components/EditCustomerModal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8081/customers');
      setCustomers(res.data);
      setError('');
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (newCustomer) => {
    setCustomers([...customers, newCustomer]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await axios.delete(`http://localhost:8081/customers/${id}`);
      setCustomers(customers.filter(customer => customer.id !== id));
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError('Failed to delete customer. Please try again.');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
  };

  const handleUpdate = (updatedCustomer) => {
    setCustomers(customers.map(customer => 
      customer.id === updatedCustomer.id ? updatedCustomer : customer
    ));
    setEditingCustomer(null);
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.customer_number.includes(searchTerm) || 
    (customer.location && customer.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <section className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Customer Management</h2>
        <div className="col-md-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search by phone or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              className="btn btn-outline-secondary" 
              type="button"
              onClick={() => setSearchTerm('')}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      <CustomerForm onAdd={handleAdd} />

      <h3 className="mt-5 mb-4">Existing Customers</h3>
      
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="alert alert-info">
          {searchTerm ? 'No matching customers found.' : 'No customers found. Please add some customers.'}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Phone Number</th>
                <th>Location</th>
                <th>Gender</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.customer_number}</td>
                  <td>{customer.location || 'N/A'}</td>
                  <td>{customer.gender || 'Not specified'}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleEdit(customer)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(customer.id)}
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

      {editingCustomer && (
        <EditCustomerModal 
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onUpdate={handleUpdate}
        />
      )}
    </section>
  );
}