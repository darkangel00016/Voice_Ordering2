import React, { useState } from 'react';
import VoiceControls from './../components/VoiceControls';

/**
 * Example usage of the VoiceControls component.
 * 
 * This component acts as a "Smart Home Assistant" container.
 * It manages the state required by VoiceControls (listening state, text-to-speech trigger)
 * and processes the transcripts received from the child component.
 */
const SmartHomeAssistant: React.FC = () => {
  // State to track the text recognized from the microphone
  const [transcript, setTranscript] = useState<string>("");
  
  // State to track if the microphone is currently active
  // This is lifted state because VoiceControls needs to notify us if it stops automatically (e.g. silence)
  const [isListening, setIsListening] = useState<boolean>(false);
  
  // State to trigger the browser's text-to-speech engine
  // When this string changes, VoiceControls will speak it
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);

  /**
   * Handler for when the user finishes speaking a phrase.
   * This is where you would typically send the text to an NLU/LLM service.
   */
  const handleTranscript = (text: string) => {
    setTranscript(text);
    const lowerText = text.toLowerCase();

    // Simple keyword matching logic for demonstration
    if (lowerText.includes("hello") || lowerText.includes("hi")) {
      setAssistantResponse("Hello! I am ready to help.");
    } else if (lowerText.includes("time")) {
      setAssistantResponse(`The current time is ${new Date().toLocaleTimeString()}`);
    } else if (lowerText.includes("light")) {
      setAssistantResponse("I've toggled the lights for you.");
    } else {
      setAssistantResponse("I didn't quite catch that command.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 border rounded-lg shadow-sm overflow-hidden bg-gray-50">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Smart Home Hub</h2>
        
        {/* Display the conversation history */}
        <div className="space-y-4 mb-6 min-h-[100px]">
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-xs text-gray-400 uppercase font-bold">You said:</p>
            <p className="text-gray-800">{transcript || "..."}</p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded shadow-sm">
            <p className="text-xs text-blue-400 uppercase font-bold">Assistant:</p>
            <p className="text-blue-800">{assistantResponse || "Waiting for command..."}</p>
          </div>
        </div>
      </div>

      {/* 
        VoiceControls Integration:
        1. onTranscript: Receives the text string.
        2. isListening: Passes down the current state.
        3. onListeningChange: Allows the child to update the parent's state (e.g., auto-stop).
        4. textToSpeak: Triggers audio output.
      */}
      <VoiceControls
        onTranscript={handleTranscript}
        isListening={isListening}
        onListeningChange={setIsListening}
        textToSpeak={assistantResponse}
      />
    </div>
  );
};

export default SmartHomeAssistant;