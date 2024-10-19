import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useParams } from 'react-router-dom';

const ZoomBot = () => {
  const { id } = useParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob ,setAudioBlob] =useState([]);
  const [error, setError] = useState(null);
  
  const websocketRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());
  const ChunkSize = 0

  const playCollectedAudio = async () => {
    try {
      if (audioChunksRef.current.length === 0) return;

      // Create a blob from all collected chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Clean up previous audio
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      // Set up new audio
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

      // Play the audio
      await audioRef.current.play();

      // Clear the chunks for next stream
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
        websocketRef.current = new WebSocket(`wss://app.closerx.ai/socket/zoom/${id}/`);

        websocketRef.current.onopen = () => {
          console.log('WebSocket Connected');
          setIsConnected(true);
          // Send initial message with offset 0
          websocketRef.current.send(JSON.stringify({ offset: 0.0 }));
        };

        websocketRef.current.onclose = () => {
          console.log('WebSocket Disconnected');
          setIsConnected(false);
        };

        websocketRef.current.onerror = (error) => {
          console.error('WebSocket Error:', error);
          setError('Failed to connect to audio stream');
        };

        websocketRef.current.onmessage = async (event) => {
          if (event.data instanceof Blob) {

            // Received binary audio data
            audioChunksRef.current.push(event.data);
          } else {
            try {
              // Handle text messages
              const message = JSON.parse(event.data);
              // Check if this is the end of an audio stream
              if (message.event === "clear") {
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

    // Cleanup function
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
    <div className="w-screen h-screen p-4 bg-black ">
      <div>{error}</div>      
      <div className="mt-4 p-4  bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-black' : 'bg-black'
              }`}
            />
            <span className="text-sm">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {isPlaying ? (
              <Volume2 className="h-5 w-5 text-black" />
            ) : (
              <VolumeX className="h-5 w-5 text-black" />
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


// import React, { useEffect, useRef, useState } from 'react';
// import { useParams } from 'react-router-dom';

// const ZoomBot = () => {
//   const { id } = useParams();
//   const audioChunksRef = useRef([]);  
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [hasInteracted, setHasInteracted] = useState(false); 
//   const audioElement = useRef(new Audio());
//   const websocket = useRef(null);
//   const chunkSize = 100 * 1024; 


//   useEffect(() => {
//     websocket.current = new WebSocket(`wss://01c6-103-108-5-104.ngrok-free.app/socket/zoom/${id}/`);
//     websocket.current.onopen = () => {
//       console.log('WebSocket Connected');
//     };

//     websocket.current.onmessage = (event) => {
//       if (event.data instanceof Blob) {
//         handleAudioChunk(event.data);
//       } else {
//         const data = JSON.parse(event.data);
//         if (data.event === 'clear') {
//           // handleClear();
//         } else if (data.event === 'end') {
//           // handleEnd();
//         }
//       }
//     };

//     audioElement.current.onended = playNextChunk;

//     return () => {
//       if (websocket.current) {
//         websocket.current.close();
//       }
//     };
//   }, [id]);

//   const handleAudioChunk = (blob) => {
//     // const data = new Blob([blob], { type: 'audio/wav' });
//     const chunks = [];
//     for (let i = 0; i < blob.size; i += chunkSize) {
//       chunks.push(blob.slice(i, i + chunkSize));
//     }
    
    
//     audioChunksRef.current = [...audioChunksRef.current, ...chunks];

//     if (!isPlaying) {
//       playNextChunk();  
//     }
//   };

//   const handleClear = () => {
//     audioElement.current.pause();
//     audioChunksRef.current = [];  
//     setIsPlaying(false);
//   };

//   const handleEnd = () => {
    
//   };

//   const playNextChunk = () => {
//     if (audioChunksRef.current.length > 0) {  
//       const chunk = audioChunksRef.current[0];
//       const url = URL.createObjectURL(chunk);
//       audioElement.current.src = url;
//       audioElement.current.play()
//         .then(() => {
//           setIsPlaying(true);
//           URL.revokeObjectURL(url);
//         })
//         .catch(error => console.error('Playback failed:', error));
      
      
//       audioChunksRef.current = audioChunksRef.current.slice(1);
//     } else {
//       setIsPlaying(false);
//     }
//   };

//   // const handleUserInteraction = () => {
//   //   setHasInteracted(true);  // Mark user interaction
//   //   playNextChunk();  // Start playback after interaction
//   // };

//   return (
//     <div>
//       <h1>WebSocket Audio Player</h1>
//       {/* {!hasInteracted && (
//         <button onClick={handleUserInteraction}>Click to Start Audio</button>
//       )} */}
//       <p>Number of audio chunks: {audioChunksRef.current.length}</p>
//       <p>Is playing: {isPlaying ? 'Yes' : 'No'}</p>
//     </div>
//   );
// };

// export default ZoomBot;
