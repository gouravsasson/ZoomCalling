import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const ZoomBot = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  
  const websocketRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());
  let buffer = useRef(new Blob()); 

  const playCollectedAudio = async () => {
    try {
      if (audioChunksRef.current.length === 0) return;

      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      
      audioRef.current.src = audioUrl;
      setIsPlaying(true);

      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audioRef.current.onerror = (error) => {
        console.error('Audio playback error:', error);
        setError('Error playing audio');
        setIsPlaying(false);
      };

      
      await audioRef.current.play();

      
      audioChunksRef.current = [];

    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        websocketRef.current = new WebSocket(`wss://67d0-103-157-7-117.ngrok-free.app/socket/zoom/29695038-8eaa-4111-a70f-d56ca04dce13/`);

        websocketRef.current.onopen = () => {
          console.log('WebSocket Connected');
          setIsConnected(true);
          setError(null); 
          websocketRef.current.send(JSON.stringify({ offset: 0.0 }));
        };

        websocketRef.current.onclose = () => {
          console.log('WebSocket Disconnected');
          setIsConnected(false);
          setTimeout(connectWebSocket, 3000); 
        };

        websocketRef.current.onerror = (error) => {
          console.error('WebSocket Error:', error);
          setError('Failed to connect to audio stream');
        };

        websocketRef.current.onmessage = async (event) => {
          if (event.data instanceof Blob) {
            buffer.current = new Blob([buffer.current, event.data]);

            
            while (buffer.current.size > 102400) {
              const chunk = buffer.current.slice(0, 102400); 
              audioChunksRef.current.push(chunk);
              buffer.current = buffer.current.slice(102400); 
            }
          } else {
            try {
              const message = JSON.parse(event.data);
              if (message.event === "clear") {
                
                if (buffer.current.size > 0) {
                  audioChunksRef.current.push(buffer.current);
                  buffer.current = new Blob(); 
                }
                await playCollectedAudio();
              }
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          }
        };

      } catch (error) {
        console.error('Error initializing WebSocket:', error);
        setError('Failed to initialize connection');
      }
    };
    
    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (audioRef.current.src) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div>{error}</div>      
      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {isPlaying ? (
              <Volume2 className="h-5 w-5 text-green-500" />
            ) : (
              <VolumeX className="h-5 w-5 text-gray-500" />
            )}
            <span className="text-sm">
              {isPlaying ? 'Playing' : 'Silent'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomBot;
