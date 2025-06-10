// src/pages/CallPage.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LiveCallButton from '../components/LiveCallButton';

export default function CallPage() {
  const [customerNumber, setCustomerNumber] = useState('');
  const [generatedAgent, setGeneratedAgent] = useState('');
  const [callHistory, setCallHistory] = useState([]);
  const [isUsable, setIsUsable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [callStatus, setCallStatus] = useState('Ready');
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // Refs for audio management
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const socketRef = useRef(null);

  const agents = ['SmartSol', 'Jakob', 'Good Deal'];

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  // Get list of unused agents
  const getUnusedAgent = (usedAgents) => {
    const available = agents.filter(agent => !usedAgents.includes(agent));
    if (available.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
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

  // Handle customer number submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerNumber) return;

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      setGeneratedAgent('');
      setIsUsable(false);

      const response = await axios.get(`http://localhost:8081/calllogs?customer_number=${customerNumber}`);
      setCallHistory(response.data);

      const usedAgents = response.data
        .filter(log => log.customer_number === customerNumber)
        .map(log => {
          const match = log.remark?.match(/Called from: (.*)/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      const newAgent = getUnusedAgent(usedAgents);
      setGeneratedAgent(newAgent);
      setIsUsable(!!newAgent);
    } catch (err) {
      console.error('Error fetching call history:', err);
      setError(`Failed to fetch call history. ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add new call log
  const handleAddCallLog = async () => {
    if (!generatedAgent || !customerNumber) return;

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const newCall = {
        called_at: new Date().toISOString(),
        customer_number: customerNumber,
        outcome: 'Connected',
        remark: `Called from: ${generatedAgent}`
      };

      await axios.post('http://localhost:8081/calllogs', newCall);

      const response = await axios.get(`http://localhost:8081/calllogs?customer_number=${customerNumber}`);
      setCallHistory(response.data);
      setIsUsable(false);
      setSuccessMessage('Call log successfully added!');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding call log:', err);
      setError(`Failed to add call log. ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Start a VAPI call
  const startCall = async () => {
    if (!customerNumber || !generatedAgent) return;

    try {
      setCallStatus('Initializing call...');
      setIsCallActive(true);
      setTranscript('');

      // In a real implementation, you would call your backend to get the WebSocket URL
      // For demo purposes, we'll mock this
      const response = await axios.post('/api/create-vapi-call', {
        assistantId: 'your-assistant-id', // This would match your generatedAgent
        customerNumber: customerNumber
      });

      const { websocketUrl } = response.data;

      // Initialize WebSocket connection
      socketRef.current = new WebSocket(websocketUrl);

      // Set up audio
      await setupAudio();

      // WebSocket event handlers
      socketRef.current.onopen = () => {
        setCallStatus('Call connected');
      };

      socketRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'audio') {
          playAudio(message.audio);
        } else if (message.type === 'transcript') {
          setTranscript(prev => prev + message.transcript + '\n');
        } else if (message.type === 'status') {
          setCallStatus(message.status);
          if (message.status === 'ended') {
            endCall();
          }
        }
      };

      socketRef.current.onclose = () => {
        setCallStatus('Call ended');
        endCall();
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setCallStatus('Connection error');
        endCall();
      };

    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('Error starting call');
      endCall();
    }
  };

  // Set up audio for the call
  const setupAudio = async () => {
    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const microphone = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      
      processorRef.current = audioContextRef.current.createScriptProcessor(1024, 1, 1);
      microphone.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      processorRef.current.onaudioprocess = (e) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          const audioData = e.inputBuffer.getChannelData(0);
          socketRef.current.send(JSON.stringify({
            type: 'audio',
            audio: Array.from(audioData)
          }));
        }
      };
    } catch (error) {
      console.error('Audio setup error:', error);
      throw new Error('Could not access microphone');
    }
  };

  // Play received audio
  const playAudio = (audioData) => {
    if (!audioContextRef.current) return;
    
    const audioBuffer = audioContextRef.current.createBuffer(
      1, 
      audioData.length, 
      audioContextRef.current.sampleRate
    );
    audioBuffer.getChannelData(0).set(audioData);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  // End the current call
  const endCall = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    cleanupAudio();
    setIsCallActive(false);
  };

  // Clean up audio resources
  const cleanupAudio = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
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
                    autoFocus
                    pattern="[\d+]{5,15}"
                  />
                  <label htmlFor="customerNumber">Customer Phone Number *</label>
                  <div className="form-text">Enter the customer's phone number to view call history</div>
                </div>
              </div>

              <div className="col-md-4">
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading || isCallActive}
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
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {generatedAgent && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title mb-0">Selected Caller (Agent)</h5>
              <button
                className="btn btn-outline-primary"
                onClick={() => {
                  const used = callHistory
                    .map(log => {
                      const match = log.remark?.match(/Called from: (.*)/);
                      return match ? match[1] : null;
                    })
                    .filter(Boolean);
                  const newAgent = getUnusedAgent(used);
                  setGeneratedAgent(newAgent);
                  setIsUsable(!!newAgent);
                }}
                disabled={loading || isCallActive}
              >
                Generate New Caller
              </button>
            </div>

            <div className="d-flex align-items-center">
              <div className="display-4 text-primary fw-bold me-3">
                {generatedAgent || 'N/A'}
              </div>

              <div>
                {generatedAgent ? (
                  isUsable ? (
                    <span className="badge bg-success fs-6">Agent is available</span>
                  ) : (
                    <span className="badge bg-danger fs-6">Agent already used</span>
                  )
                ) : (
                  <span className="badge bg-secondary fs-6">No new agents available</span>
                )}
              </div>
            </div>

            <p className="mt-3">
              {isUsable
                ? "This agent has never been used to call this customer before."
                : generatedAgent
                  ? "This agent has been used previously to call this customer."
                  : "No available agents left to assign."}
            </p>

            <div className="d-flex gap-3 mt-3">
              <button
                className="btn btn-success flex-grow-1"
                onClick={handleAddCallLog}
                disabled={!isUsable || !generatedAgent || loading || isCallActive}
              >
                <i className="bi bi-telephone me-2"></i>
                Save the activity now
              </button>

              <LiveCallButton 
                isActive={isCallActive}
                onStart={startCall}
                onEnd={endCall}
                disabled={!customerNumber || !generatedAgent || loading}
              />
            </div>

            {isCallActive && (
              <div className="mt-4">
                <div className="alert alert-info">
                  <strong>Call Status:</strong> {callStatus}
                </div>
                
                <div className="card">
                  <div className="card-header">
                    Live Transcript
                  </div>
                  <div className="card-body" style={{ height: '200px', overflowY: 'auto' }}>
                    {transcript || 'Waiting for transcript...'}
                  </div>
                </div>
              </div>
            )}
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
                    <th>Caller</th>
                    <th>Outcome</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {callHistory.map((log) => {
                    const callerMatch = log.remark?.match(/Called from: (.*)/);
                    const caller = callerMatch ? callerMatch[1] : 'Unknown';

                    return (
                      <tr key={log.id}>
                        <td>{formatDate(log.called_at)}</td>
                        <td>
                          {caller}
                          {caller === generatedAgent && !isUsable && (
                            <span className="text-danger ms-2" title="Already used">
                              <i className="bi bi-exclamation-circle-fill"></i>
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              log.outcome === 'Connected'
                                ? 'bg-success'
                                : log.outcome === 'Voicemail'
                                  ? 'bg-warning text-dark'
                                  : 'bg-danger'
                            }`}
                          >
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