import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const LiveCallPage = () => {
  // Configuration
  const { customerNumber } = useParams();
  const config = {
    phoneNumber: customerNumber,
    apiBaseUrl: 'https://api.vapi.ai',
    phoneNumberId: 'c13eff76-4b18-4730-83dc-2d9be75a7298',
    defaultCustomerName: 'Customer',
    voiceConfig: {
      provider: "11labs",
      voiceId: "p43fx6U8afP2xoq1Ai9f"
    }
  };

  const [state, setState] = useState({
    isCalling: false,
    isConnected: false,
    error: null,
    prompt: '',
    isLoading: false,
    customerDetails: null,
    isFetchingCustomer: true,
    callStatus: 'idle',
    callId: null,
    listenUrl: null
  });

  const apiKey =  'e0f1360f-cf5e-4cd1-b8d7-78f5fa8582f2';

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await axios.get('http://localhost:8081/customers');
        const found = res.data.find(c => c.customer_number === config.phoneNumber);
        setState(prev => ({ ...prev, 
          customerDetails: found || null,
          isFetchingCustomer: false 
        }));
      } catch (err) {
        console.error('Failed to fetch customer:', err);
        setState(prev => ({ ...prev, 
          error: 'Failed to load customer details',
          isFetchingCustomer: false 
        }));
      }
    };

    fetchCustomer();
  }, []);

  const pollCallStatus = async (callId) => {
    try {
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        const response = await axios.get(`${config.apiBaseUrl}/call/${callId}`, {
          headers: { Authorization: `Bearer ${apiKey}` }
        });

        if (response.data.status === 'connected' && response.data.listenUrl) {
          return response.data.listenUrl;
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        setState(prev => ({ ...prev, 
          callStatus: `connecting (${attempts}/${maxAttempts})`
        }));
      }

      throw new Error('Call connection timed out');
    } catch (error) {
      console.error('Error polling call status:', error);
      throw error;
    }
  };

  const startCall = async () => {
    if (!apiKey) {
      setState(prev => ({ ...prev, 
        error: 'API key is missing. Please configure REACT_APP_VAPI_API_KEY in your environment variables.'
      }));
      return;
    }

    setState(prev => ({ ...prev, 
      error: null,
      isCalling: true,
      isLoading: true,
      callStatus: 'initiating'
    }));

    try {
      const payload = {
        phoneNumberId: config.phoneNumberId,
        customer: {
          number: config.phoneNumber,
          name: state.customerDetails?.name || config.defaultCustomerName
        },
        assistant: {
          name: "SmartSol",
          voice: config.voiceConfig,
          ...(state.prompt.trim() && { prompt: state.prompt.trim() })
        }
      };

      const response = await axios.post(`${config.apiBaseUrl}/call`, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });

      const callId = response.data.id;
      setState(prev => ({ ...prev, callId, callStatus: 'connecting' }));

      const url = await pollCallStatus(callId);
      setState(prev => ({ ...prev, 
        listenUrl: url,
        isConnected: true,
        isLoading: false,
        callStatus: 'connected'
      }));
    } catch (error) {
      console.error("Error initiating call:", error);
      setState(prev => ({ ...prev, 
        error: error.response?.data?.message || error.message || 'Failed to start call',
        isCalling: false,
        isLoading: false,
        callStatus: 'failed'
      }));
    }
  };

  const endCall = async () => {
    if (!state.callId) return;

    try {
      await axios.post(`${config.apiBaseUrl}/call/${state.callId}/end`, {}, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
    } catch (error) {
      console.error("Error ending call:", error);
    } finally {
      setState(prev => ({ ...prev, 
        isCalling: false,
        isConnected: false,
        callStatus: 'ended',
        callId: null,
        listenUrl: null
      }));
    }
  };

  const handlePromptChange = (e) => {
    setState(prev => ({ ...prev, 
      prompt: e.target.value,
      error: null
    }));
  };

  const statusMessages = {
    idle: 'Ready to call',
    initiating: 'Initiating call...',
    connecting: 'Connecting...',
    connected: 'Call connected',
    failed: 'Call failed',
    ended: 'Call ended'
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Live Voice Assistant</h1>

      {!apiKey && (
        <div style={styles.error}>
          <p>Configuration Error: API key is missing</p>
          <p style={styles.errorTip}>
            Please set REACT_APP_VAPI_API_KEY in your .env file
          </p>
        </div>
      )}

      <div style={styles.status}>
        {statusMessages[state.callStatus]}
        {state.listenUrl && (
          <div style={styles.listenLink}>
            <a href={state.listenUrl} target="_blank" rel="noopener noreferrer">
              Listen to call
            </a>
          </div>
        )}
      </div>

      <div style={styles.infoBox}>
        <p><strong>Phone:</strong> {config.phoneNumber}</p>
        {state.isFetchingCustomer ? (
          <p>Loading customer details...</p>
        ) : state.customerDetails ? (
          <>
            <p><strong>Name:</strong> {state.customerDetails.name || 'N/A'}</p>
            <p><strong>Location:</strong> {state.customerDetails.location || 'N/A'}</p>
          </>
        ) : (
          <p style={{ color: '#e67e22' }}>No customer details found for this number.</p>
        )}
      </div>

      <div style={styles.inputContainer}>
        <textarea
          value={state.prompt}
          onChange={handlePromptChange}
          placeholder="enter custom prompt"
          style={styles.textarea}
          disabled={state.isCalling || state.isLoading}
        />
      </div>

      <div style={styles.buttons}>
        {!state.isCalling ? (
          <button
            onClick={startCall}
            style={styles.startButton}
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Starting...' : 'Start Call'}
          </button>
        ) : (
          <button
            onClick={endCall}
            style={styles.endButton}
            disabled={state.isLoading}
          >
            End Call
          </button>
        )}
      </div>

      {state.error && (
        <div style={styles.error}>
          <p>Error: {state.error}</p>
          {state.error.includes('Failed to fetch') && (
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
    fontFamily: 'Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  header: {
    color: '#2c3e50',
    marginBottom: '1.5rem'
  },
  status: {
    margin: '1.5rem 0',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#3498db',
    padding: '0.5rem',
    backgroundColor: '#ebf5fb',
    borderRadius: '4px'
  },
  listenLink: {
    marginTop: '0.5rem',
    fontSize: '0.9rem'
  },
  infoBox: {
    margin: '1.5rem 0',
    padding: '1.2rem',
    backgroundColor: '#fff',
    borderRadius: '8px',
    textAlign: 'left',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  inputContainer: {
    margin: '1.5rem 0'
  },
  textarea: {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ddd',
    minHeight: '120px',
    resize: 'vertical',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box'
  },
  buttons: {
    marginTop: '2rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem'
  },
  startButton: {
    padding: '1rem 2rem',
    fontSize: '1rem',
    cursor: 'pointer',
    background: '#2ecc71',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    transition: 'background 0.2s',
    ':hover': {
      background: '#27ae60'
    }
  },
  endButton: {
    padding: '1rem 2rem',
    fontSize: '1rem',
    cursor: 'pointer',
    background: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    transition: 'background 0.2s',
    ':hover': {
      background: '#c0392b'
    }
  },
  error: {
    marginTop: '1.5rem',
    color: '#e74c3c',
    padding: '1rem',
    backgroundColor: '#fdedec',
    borderRadius: '6px',
    textAlign: 'left'
  },
  errorTip: {
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    color: '#7f8c8d'
  }
};

export default LiveCallPage;