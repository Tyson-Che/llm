// Client-side (React) streaming handling
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Input = ({ addChat, chat }) => {
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamRef = useRef(null);

  const prevChat = chat.flatMap((c) => [
    { role: "user", content: c.prompt },
    { role: "assistant", content: c.response }
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsStreaming(true);

    try {
      const response = await axios.post('http://localhost:3000/generate', {
        model,
        messages: [...prevChat, { role: "user", content: prompt }]
      }, {
        responseType: 'text',
        onDownloadProgress: progressEvent => {
          const dataChunk = progressEvent.event.target.responseText;
          const lines = dataChunk.split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsStreaming(false);
              } else {
                const message = JSON.parse(data);
                streamRef.current += message.response;
                // Update UI with streamed content
                addChat({
                  model,
                  prompt,
                  response: streamRef.current
                });
              }
            }
          }
        }
      });

      setModel('');
      setPrompt('');
    } catch (error) {
      console.error('Error generating response:', error);
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    streamRef.current = '';
  }, [prompt]);

  return (
    <form onSubmit={handleSubmit}>
      <input
        type='text'
        placeholder='llama3.1:latest'
        value={model}
        onChange={(e) => setModel(e.target.value)}
        required
      />
      <input
        type='text'
        placeholder='Who r u?'
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        required
      />
      <button type='submit' disabled={isStreaming}>
        {isStreaming ? 'Streaming...' : 'Submit'}
      </button>
    </form>
  );
};

// ChatHistory component to display the chat history
const ChatHistory = ({ chat }) => {
  return (
    <div>
      {chat.map((c, i) => (
        <div key={i}>
          <p>User: {c.prompt}</p>
          <p>{c.model}: {c.response}</p>
        </div>
      ))}
    </div>
  );
};

// Main App component
const App = () => {
  // State to store chat history
  const [chat, setChat] = useState([]);

  // Function to add a new chat entry
  const addChat = (newChat) => {
    setChat((prevChat) => [...prevChat, newChat]);
  };

  return (
    <div>
      <h1>My LLMs</h1>
      <Input addChat={addChat} chat={chat} />
      <ChatHistory chat={chat} />
    </div>
  );
};

export default App;

