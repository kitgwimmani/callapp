import React, { useState } from 'react';
import axios from 'axios';

export default function UserForm({ onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8081/users', formData);
      onAdd();
      setFormData({ name: '', email: '' });
    } catch (error) {
      console.error('❌ Error adding user:', error.response?.data || error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="row g-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
       
        <div className="col-md-1">
          <button type="submit" className="btn btn-success w-100">Add</button>
        </div>
      </div>
    </form>
  );
}
