import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UserForm from '../components/UserForm';

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:8081/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  return (
    <section>
      <h2 className="mb-4">User Management</h2>
      <UserForm onAdd={fetchUsers} />

      <h3 className="mt-5">System Users</h3>
      <div className="row mt-3">
        {users.map(u => (
          <div className="col-md-4 mb-3" key={u.id}>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{u.name}</h5>
                <h6 className="card-subtitle mb-2 text-muted">{u.email}</h6>
                <p className="card-text">Role: {u.role}</p>
                <div className="d-flex justify-content-end">
                  <button className="btn btn-sm btn-outline-primary me-2">Edit</button>
                  <button className="btn btn-sm btn-outline-danger">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
