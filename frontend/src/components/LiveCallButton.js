import React from 'react';
import { Link } from 'react-router-dom';

const LiveCallButton = () => {
  return (
    <Link to="/live-call" className="btn btn-primary d-inline-flex align-items-center gap-2">
      <i className="bi bi-telephone-forward"></i>
      Live Call
    </Link>
  );
};

export default LiveCallButton;
