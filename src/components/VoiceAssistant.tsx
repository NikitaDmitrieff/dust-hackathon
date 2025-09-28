import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Phone, PhoneOff, Loader2 } from 'lucide-react';

// Extend window type to include OpenAIRealtimeClient
declare global {
  interface Window {
    OpenAIRealtimeClient: any;
  }
}

interface VoiceAssistantProps {
  formId: string;
  onFormGenerated?: (formData: any) => void;
  onAnswersGenerated?: (answers: any) => void;
  onClose: () => void;
  mode?: 'form_creation' | 'form_completion';
  questions?: any[];
}

interface Message {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  formId, 
  onFormGenerated, 
  onAnswersGenerated,
  onClose,
  mode = 'form_creation',
  questions = []
}) => {
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
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
      mode: mode,
      questions: questions,
      
      onConnectionChange: (state: string) => {
        setConnectionState(state as any);
        setIsRecording(state === 'connected');
      },
      
      onSessionStarted: (sessionId: string) => {
        console.log('🆔 SESSION STARTED:', sessionId);
        setCurrentSessionId(sessionId);
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

  // Disconnect functionality is now integrated into endCallAndGenerateForm

  const endCallAndGenerateForm = async () => {
    console.log('\n🚀 FRONTEND: END CALL AND GENERATE FORM BUTTON CLICKED');
    console.log('   Mode:', mode);
    console.log('   Session ID:', currentSessionId);
    console.log('   Questions count:', questions?.length || 0);
    console.log('   Timestamp:', new Date().toISOString());
    
    // First disconnect the call
    console.log('   📞 DISCONNECTING FROM CALL...');
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    
    // Add a delay to ensure disconnection, conversation saving, and analysis are processed
    console.log('   ⏳ WAITING 2 SECONDS FOR CONVERSATION PROCESSING...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('   ✅ CONVERSATION PROCESSING WAIT COMPLETED');
    
    try {
      if (mode === 'form_completion') {
        console.log('   📝 FORM COMPLETION MODE - GENERATING ANSWERS');
        // Generate answers from conversation
        if (!currentSessionId) {
          console.log('   ❌ NO SESSION ID FOUND');
          addMessage('assistant', 'No active session found. Please try again.');
          return;
        }

        console.log('   🌐 CALLING API: /api/generate-form-answers');
        const response = await fetch('http://localhost:3001/api/generate-form-answers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: currentSessionId,
            questions: questions
          })
        });

        console.log('   📨 API RESPONSE STATUS:', response.status);
        if (response.ok) {
          const answersData = await response.json();
          console.log('   ✅ ANSWERS GENERATED:', answersData);
          if (onAnswersGenerated) {
            onAnswersGenerated(answersData.answers || {});
          }
          console.log('   🚪 CLOSING VOICE ASSISTANT');
          onClose();
        } else {
          const errorText = await response.text();
          console.log('   ❌ API ERROR:', errorText);
          addMessage('assistant', 'Failed to generate answers. Please try again.');
        }
      } else {
        console.log('   📋 FORM CREATION MODE - GENERATING FORM');
        // Generate form from conversation
        console.log('   🌐 CALLING API: /api/generate-form');
        const response = await fetch('http://localhost:3001/api/generate-form');
        console.log('   📨 API RESPONSE STATUS:', response.status);
        
        if (response.ok) {
          const formData = await response.json();
          console.log('   ✅ FORM GENERATED:', formData);
          if (onFormGenerated) {
            console.log('   🔄 CALLING onFormGenerated CALLBACK');
            onFormGenerated(formData);
          }
          console.log('   🚪 CLOSING VOICE ASSISTANT');
          onClose();
        } else {
          const errorText = await response.text();
          console.log('   ❌ API ERROR:', errorText);
          addMessage('assistant', 'Failed to generate form. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ FRONTEND ERROR GENERATING:', error);
      addMessage('assistant', `Error generating ${mode === 'form_completion' ? 'answers' : 'form'}. Please check the connection.`);
    }
  };

  // Initialize empty message
  useEffect(() => {
    const initialMessage = mode === 'form_completion' 
      ? 'Connect to start answering form questions via voice. When finished, click "End Call & Generate Answers".'
      : 'Connect to start describing your form. When finished, click "End Call & Generate Form".';
      
    setMessages([{
      type: 'assistant',
      content: initialMessage,
      timestamp: new Date()
    }]);
  }, [mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
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
          {mode === 'form_completion' 
            ? 'Answer the form questions by speaking naturally with the assistant'
            : 'Tell the assistant what kind of form you want to create'
          }
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex gap-2 justify-center">
          {connectionState === 'connecting' ? (
            <Button 
              disabled={true}
              className="flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </Button>
          ) : connectionState === 'connected' ? (
            <Button 
              onClick={endCallAndGenerateForm}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <PhoneOff className="w-4 h-4" />
              End Call & {mode === 'form_completion' ? 'Generate Answers' : 'Generate Form'}
            </Button>
          ) : (
            <Button 
              onClick={connectToAssistant}
              disabled={!sdkLoaded}
              className="flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Connect
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

        {/* Close Button - Only show if not connected */}
        {connectionState === 'disconnected' && (
          <div className="flex justify-center">
            <Button 
              onClick={onClose} 
              variant="outline"
            >
              Close Assistant
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceAssistant;
