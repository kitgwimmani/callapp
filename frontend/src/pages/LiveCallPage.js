import React, { useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';
import axios from 'axios';

const LiveCallPage = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [isFetchingCustomer, setIsFetchingCustomer] = useState(true);
  const vapiRef = useRef(null);

  const phoneNumber = '+17133303844';

  useEffect(() => {
    const vapi = new Vapi({
      apiKey: process.env.REACT_APP_VAPI_PUBLIC_KEY,
    });

    vapiRef.current = vapi;

    vapi.on('call-start', () => {
      setIsConnected(true);
      setIsLoading(false);
    });

    vapi.on('call-end', () => {
      setIsCalling(false);
      setIsConnected(false);
      setIsLoading(false);
    });

    vapi.on('error', (err) => {
      console.error('Vapi error:', err);
      setError(err.message || 'Failed to connect to the voice assistant');
      setIsLoading(false);
      setIsCalling(false);
    });

    return () => {
      if (vapiRef.current) {
        vapiRef.current.hangUp();
      }
    };
  }, []);

  useEffect(() => {
    const fetchCustomer = async () => {
      setIsFetchingCustomer(true);
      try {
        const res = await axios.get('http://localhost:8081/customers');
        const found = res.data.find(c => c.customer_number === phoneNumber);
        setCustomerDetails(found || null);
      } catch (err) {
        console.error('Failed to fetch customer:', err);
        setError('Failed to load customer details. Please try again.');
      } finally {
        setIsFetchingCustomer(false);
      }
    };

    fetchCustomer();
  }, [phoneNumber]);

  const startCall = async () => {
  

    setError(null);
    setIsCalling(true);
    setIsLoading(true);

    try {
      await vapiRef.current.start({
        agentId: process.env.REACT_APP_VAPI_AGENT_ID,
        phone: phoneNumber,
        prompt: prompt.trim(),
      });
    } catch (err) {
      console.error('Start call error:', err);
      console.error('Full error object:', JSON.stringify(err, null, 2));
      setError(err.message || 'Failed to start the call');
      setIsLoading(false);
      setIsCalling(false);
    }
  };

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.hangUp();
    }
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    if (error) setError(null);
  };

  return (
    <div style={styles.container}>
      <h1>Live Voice Assistant</h1>

      <div style={styles.status}>
        {isConnected
          ? 'Connected to Agent'
          : isLoading
            ? 'Connecting...'
            : isCalling
              ? 'Calling...'
              : 'Idle'}
      </div>

      <div style={styles.infoBox}>
        <p><strong>Phone:</strong> {phoneNumber}</p>
        {isFetchingCustomer ? (
          <p>Loading customer details...</p>
        ) : customerDetails ? (
          <>
            <p><strong>Location:</strong> {customerDetails.location || 'N/A'}</p>
            <p><strong>Gender:</strong> {customerDetails.gender || 'N/A'}</p>
          </>
        ) : (
          <p style={{ color: '#e67e22' }}>No customer details found for this number.</p>
        )}
      </div>

      <div style={styles.inputContainer}>
        <textarea
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Enter your prompt for the assistant..."
          style={styles.textarea}
          disabled={isCalling || isLoading}
        />
      </div>

      <div style={styles.buttons}>
        {!isCalling ? (
          <button
            onClick={startCall}
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Starting...' : 'Start Call'}
          </button>
        ) : (
          <button
            onClick={endCall}
            style={{ ...styles.button, background: '#e74c3c' }}
            disabled={isLoading}
          >
            End Call
          </button>
        )}
      </div>

      {error && (
        <div style={styles.error}>
          <p>Error: {error}</p>
          {error.includes('Failed to fetch') && (
            <p style={styles.errorTip}>
              Tip: Check your internet connection and try again
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
  },
  status: {
    margin: '1rem 0',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#555',
  },
  infoBox: {
    margin: '1rem 0',
    padding: '1rem',
    backgroundColor: '#f1f1f1',
    borderRadius: '8px',
    textAlign: 'left',
    minHeight: '90px',
  },
  inputContainer: {
    margin: '1.5rem 0',
  },
  textarea: {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid #ddd',
    minHeight: '120px',
    resize: 'vertical',
    fontFamily: 'sans-serif',
  },
  buttons: {
    marginTop: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  button: {
    padding: '1rem 2rem',
    fontSize: '1rem',
    cursor: 'pointer',
    background: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
  },
  error: {
    marginTop: '1.5rem',
    color: '#e74c3c',
    padding: '1rem',
    backgroundColor: '#fdedec',
    borderRadius: '0.5rem',
  },
  errorTip: {
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    color: '#7f8c8d',
  },
};

export default LiveCallPage;
