import React, { useState, useEffect, useRef, useCallback } from 'react';

// Define the Web Speech API interfaces as they might not be in all TS environments
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

interface VoiceControlsProps {
  /** Callback when the user finishes speaking a phrase */
  onTranscript: (text: string) => void;
  /** External control to know if the system is currently processing/listening */
  isListening: boolean;
  /** Callback to notify parent of listening state changes initiated by this component */
  onListeningChange: (isListening: boolean) => void;
  /** Optional: Text to speak immediately (e.g., assistant response) */
  textToSpeak?: string | null;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  onTranscript,
  isListening,
  onListeningChange,
  textToSpeak
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Refs to hold API instances
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize Speech APIs on mount
  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError("Voice features are not supported in this browser.");
      return;
    }

    // Setup Recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after one sentence/phrase
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      onListeningChange(true);
      setError(null);
    };

    recognition.onend = () => {
      onListeningChange(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      onListeningChange(false);
      if (event.error === 'not-allowed') {
        setHasPermission(false);
        setError("Microphone access denied.");
      } else {
        setError(`Error: ${event.error}`);
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onTranscript(transcript);
      }
    };

    recognitionRef.current = recognition;

    // Setup Synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Check permission status if possible
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((permissionStatus) => {
          setHasPermission(permissionStatus.state === 'granted');
          permissionStatus.onchange = () => {
            setHasPermission(permissionStatus.state === 'granted');
          };
        });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [onTranscript, onListeningChange]);

  // Handle Text-to-Speech Trigger
  useEffect(() => {
    if (textToSpeak && synthRef.current) {
      // Cancel any current speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      synthRef.current.speak(utterance);
    }
  }, [textToSpeak]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // If we are speaking, stop speaking before listening
      if (isSpeaking && synthRef.current) {
        synthRef.current.cancel();
      }
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Handle edge case where start is called while already started
        console.warn("Recognition already started");
      }
    }
  }, [isListening, isSupported, isSpeaking]);

  if (!isSupported) {
    return (
      <div className="p-4 text-sm text-gray-500 bg-gray-100 rounded-md">
        Voice controls unavailable.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 p-4 border-t border-gray-200 bg-white">
      {/* Status Feedback */}
      <div className="h-6 text-sm font-medium" aria-live="polite">
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : isListening ? (
          <span className="text-blue-600 animate-pulse">Listening...</span>
        ) : isSpeaking ? (
          <span className="text-green-600">Assistant is speaking...</span>
        ) : (
          <span className="text-gray-500">Tap mic to speak</span>
        )}
      </div>

      {/* Main Control Button */}
      <button
        onClick={toggleListening}
        disabled={!isSupported || (hasPermission === false)}
        className={`
          relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all
          focus:outline-none focus:ring-4 focus:ring-blue-300
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white scale-110' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
          ${(hasPermission === false) ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''}
        `}
        aria-label={isListening ? "Stop listening" : "Start listening"}
        title={hasPermission === false ? "Microphone access denied" : "Push to talk"}
      >
        {/* Microphone Icon */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className="w-8 h-8"
        >
          {isListening ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          )}
        </svg>
        
        {/* Ripple Effect when listening */}
        {isListening && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
        )}
      </button>

      {/* Permission Helper Text */}
      {hasPermission === false && (
        <p className="text-xs text-red-500 mt-2 text-center">
          Please enable microphone access in your browser settings to use voice commands.
        </p>
      )}
    </div>
  );
};

export default VoiceControls;