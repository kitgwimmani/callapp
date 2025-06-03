import React, { useState, useEffect, useRef } from 'react';
import { Vapi } from '@vapi-ai/web';

const LiveCallPage = () => {
  const [callStatus, setCallStatus] = useState('disconnected');
  const [transcript, setTranscript] = useState('');
  const [context, setContext] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const vapiRef = useRef(null);
  const [callSummary, setCallSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize Vapi client with your public key
    vapiRef.current = new Vapi(process.env.REACT_APP_VAPI_PUBLIC_KEY);
    
    const vapi = vapiRef.current;
    
    vapi.on('call-start', () => {
      setCallStatus('connecting');
    });
    
    vapi.on('call-connected', () => {
      setCallStatus('connected');
    });
    
    vapi.on('call-end', () => {
      setCallStatus('disconnected');
      setTranscript(prev => prev + '\n[Call ended]');
      setIsLoading(false);
    });
    
    vapi.on('error', (error) => {
      console.error('VAPI error:', error);
      setCallStatus('failed');
      setIsLoading(false);
    });
    
    vapi.on('speech-start', () => {
      setTranscript(prev => prev + '\nSmartSol: ');
    });
    
    vapi.on('message', (message) => {
      if (message.role === 'assistant' && message.type === 'transcript') {
        setTranscript(prev => prev + message.transcript);
      }
    });
    
    vapi.on('call-summary', (summary) => {
      setCallSummary(summary);
    });

    return () => {
      if (vapi && vapi.isActive()) {
        vapi.stop();
      }
    };
  }, []);

  const startCall = async () => {
    if (!context.trim()) {
      alert('Please add context for the assistant');
      return;
    }

    setIsLoading(true);
    try {
      const fullPrompt = `You are SmartSol, an intelligent solution assistant. Context provided by user: ${context}. Use this information to provide tailored assistance.`;
      
      await vapiRef.current.start({
        assistant: {
          name: 'SmartSol',
          prompt: fullPrompt,
          model: 'gpt-4-turbo'
        }
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus('failed');
      setIsLoading(false);
    }
  };

  const stopCall = () => {
    setIsLoading(false);
    vapiRef.current.stop();
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      if (isMuted) {
        vapiRef.current.unmute();
      } else {
        vapiRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="live-call-container">
      <h1>SmartSol Live Assistant</h1>
      
      <div className="context-section">
        <h2>Add Context</h2>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Provide context for SmartSol (e.g., 'I need help with account setup', 'Explain product features', etc.)"
          rows={4}
          disabled={callStatus === 'connected' || isLoading}
        />
      </div>
      
      <div className="call-controls">
        <button 
          onClick={startCall} 
          disabled={callStatus === 'connected' || isLoading}
          className="start-button"
        >
          {isLoading ? 'Connecting...' : 'Start Call'}
        </button>
        
        <button 
          onClick={stopCall} 
          disabled={callStatus !== 'connected'}
          className="stop-button"
        >
          End Call
        </button>
        
        <button 
          onClick={toggleMute} 
          disabled={callStatus !== 'connected'}
          className="mute-button"
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>
      
      <div className="status-indicator">
        Status: 
        <span className={`status-${callStatus}`}>
          {callStatus.toUpperCase()}
        </span>
      </div>
      
      <div className="transcript-container">
        <h2>Conversation</h2>
        <div className="transcript-content">
          {transcript || 'Call transcript will appear here...'}
        </div>
      </div>
      
      {callSummary && (
        <div className="summary-container">
          <h2>Call Summary</h2>
          <p>{callSummary}</p>
        </div>
      )}
    </div>
  );
};

export default LiveCallPage;