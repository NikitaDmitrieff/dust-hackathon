import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react';

// Extend window type to include OpenAIRealtimeClient
declare global {
  interface Window {
    OpenAIRealtimeClient: any;
  }
}

interface VoiceAssistantProps {
  formId: string;
  onFormGenerated: (formData: any) => void;
  onClose: () => void;
}

interface Message {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  formId, 
  onFormGenerated, 
  onClose 
}) => {
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  
  const clientRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAssistantMessageRef = useRef<string>('');

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load the OpenAI SDK
  useEffect(() => {
    const loadSDK = async () => {
      try {
        // Load the SDK script dynamically
        const script = document.createElement('script');
        script.type = 'module';
        script.innerHTML = `
          import OpenAIRealtimeClient from '/openai-realtime-sdk.js';
          window.OpenAIRealtimeClient = OpenAIRealtimeClient;
          window.dispatchEvent(new CustomEvent('sdkLoaded'));
        `;
        document.head.appendChild(script);
        
        // Wait for the SDK to be loaded
        const handleSDKLoaded = () => {
          setSdkLoaded(true);
          window.removeEventListener('sdkLoaded', handleSDKLoaded);
        };
        window.addEventListener('sdkLoaded', handleSDKLoaded);
        
      } catch (error) {
        console.error('Failed to load OpenAI SDK:', error);
        setConnectionState('error');
      }
    };
    
    loadSDK();
  }, []);

  const addMessage = (type: 'user' | 'assistant', content: string) => {
    setMessages(prev => {
      // Remove empty state message if exists
      const filtered = prev.filter(msg => msg.content !== 'Start a conversation to see messages here');
      return [...filtered, {
        type,
        content,
        timestamp: new Date()
      }];
    });
  };

  const updateAssistantMessage = (text: string) => {
    currentAssistantMessageRef.current += text;
    
    setMessages(prev => {
      const filtered = prev.filter(msg => msg.content !== 'Start a conversation to see messages here');
      const lastMessage = filtered[filtered.length - 1];
      
      if (lastMessage?.type === 'assistant') {
        // Update the last assistant message
        return [
          ...filtered.slice(0, -1),
          { ...lastMessage, content: `Assistant: ${currentAssistantMessageRef.current}` }
        ];
      } else {
        // Create new assistant message
        return [...filtered, {
          type: 'assistant',
          content: `Assistant: ${currentAssistantMessageRef.current}`,
          timestamp: new Date()
        }];
      }
    });
  };

  const initClient = () => {
    if (!window.OpenAIRealtimeClient) {
      console.error('OpenAI SDK not loaded');
      return;
    }

    // Don't create a new client if one already exists
    if (clientRef.current) {
      console.log('Client already exists, disconnecting old one first...');
      clientRef.current.disconnect();
    }
    
    clientRef.current = new window.OpenAIRealtimeClient({
      serverUrl: 'http://localhost:3001',
      wsUrl: 'ws://localhost:3001/ws',
      
      onConnectionChange: (state: string) => {
        setConnectionState(state as any);
        setIsRecording(state === 'connected');
      },
      
      onUserTranscript: (transcript: string) => {
        addMessage('user', `You: ${transcript}`);
      },
      
      onAssistantTranscript: (text: string) => {
        updateAssistantMessage(text);
      },
      
      onAssistantResponseStart: () => {
        currentAssistantMessageRef.current = '';
      },
      
      onError: (error: any) => {
        console.error('SDK Error:', error);
        setConnectionState('error');
        addMessage('assistant', `Error: ${error.message || error}`);
      }
    });
  };

  const connectToAssistant = async () => {
    try {
      if (!sdkLoaded) {
        addMessage('assistant', 'SDK is loading, please wait...');
        return;
      }
      
      // Prevent multiple connection attempts
      if (clientRef.current?.isConnected) {
        console.log('Already connected');
        return;
      }
      
      initClient();
      await clientRef.current.connect();
      
    } catch (error) {
      console.error('Connection failed:', error);
      addMessage('assistant', 'Connection failed. Please try again.');
    }
  };

  const disconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  };

  const generateForm = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/generate-form');
      if (response.ok) {
        const formData = await response.json();
        onFormGenerated(formData);
        onClose();
      } else {
        addMessage('assistant', 'Failed to generate form. Please try again.');
      }
    } catch (error) {
      console.error('Error generating form:', error);
      addMessage('assistant', 'Error generating form. Please check the connection.');
    }
  };

  // Initialize empty message
  useEffect(() => {
    setMessages([{
      type: 'assistant',
      content: 'Start a conversation to see messages here',
      timestamp: new Date()
    }]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const getStatusDisplay = () => {
    switch (connectionState) {
      case 'connecting':
        return { text: 'Connecting...', className: 'bg-yellow-100 text-yellow-700', dotClass: 'bg-yellow-500 animate-pulse' };
      case 'connected':
        return { 
          text: `Connected ${isRecording ? '(Recording)' : '(Ready)'}`, 
          className: 'bg-green-100 text-green-700', 
          dotClass: 'bg-green-500' 
        };
      case 'error':
        return { text: 'Error', className: 'bg-red-100 text-red-700', dotClass: 'bg-red-500' };
      default:
        return { text: 'Disconnected', className: 'bg-gray-100 text-gray-700', dotClass: 'bg-gray-500' };
    }
  };

  const status = getStatusDisplay();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Assistant
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Tell the assistant what kind of form you want to create
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Controls - Same logic as POC */}
        <div className="flex gap-2 justify-center">
          <Button 
            onClick={connectToAssistant}
            disabled={connectionState === 'connected' || connectionState === 'connecting' || !sdkLoaded}
            className="flex items-center gap-2"
          >
            {connectionState === 'connecting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" />
                Connect
              </>
            )}
          </Button>
          
          <Button 
            onClick={disconnect}
            disabled={connectionState === 'disconnected'}
            variant="outline"
            className="flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            Disconnect
          </Button>
          
          {connectionState === 'connected' && (
            <Button 
              onClick={generateForm}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              Generate Form
            </Button>
          )}
        </div>

        {/* Status Indicator - Same as POC */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${status.className}`}>
            <div className={`w-2 h-2 rounded-full ${status.dotClass}`} />
            {status.text}
          </div>
        </div>

        {/* Messages - Same style as POC */}
        <ScrollArea className="h-64 w-full border rounded-lg p-4 bg-gray-50">
          <div className="space-y-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm ${
                  message.type === 'user' 
                    ? 'bg-blue-100 text-blue-800' 
                    : message.content.includes('Start a conversation')
                    ? 'text-gray-500 text-center italic'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {message.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Close Button */}
        <div className="flex justify-center">
          <Button 
            onClick={onClose} 
            variant="outline"
          >
            Close Assistant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceAssistant;
