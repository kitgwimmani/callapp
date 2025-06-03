// src/components/CustomerLookup.js
import React, { useState } from 'react';

export default function CustomerLookup({ customers, value, onChange, required }) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const filteredCustomers = customers.filter(customer => 
    customer.customer_number.includes(search) || 
    (customer.location && customer.location.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (customer) => {
    onChange(customer.customer_number);
    setSearch(`${customer.customer_number}${customer.location ? ` (${customer.location})` : ''}`);
    setShowDropdown(false);
  };

  return (
    <div className="position-relative">
      <input
        type="text"
        className="form-control"
        placeholder="Search customer..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!showDropdown) setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        required={required}
      />
      
      {showDropdown && filteredCustomers.length > 0 && (
        <div 
          className="dropdown-menu show w-100"
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        >
          {filteredCustomers.map(customer => (
            <button
              key={customer.id}
              type="button"
              className="dropdown-item"
              onClick={() => handleSelect(customer)}
            >
              <div>{customer.customer_number}</div>
              {customer.location && (
                <small className="text-muted">{customer.location}</small>
              )}
            </button>
          ))}
        </div>
      )}
      
      {value && (
        <input
          type="hidden"
          name="customer_number"
          value={value}
        />
      )}
    </div>
  );
}