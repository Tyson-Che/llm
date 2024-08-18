import React, { useState } from 'react';
import axios from 'axios';

// Input component for user to enter model and prompt
const Input = ({ addChat, chat }) => {
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState('');

  // Map each item of the chat to the correct format for the API
  const prevChat = chat.flatMap((c) => [
    {
      role: "user",
      content: c.prompt
    },
    {
      role: "assistant",
      content: c.response
    }
  ]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // POST request to localhost:11434/api/generate using axios
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: model,
        messages: [
          ...prevChat,
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false
      });

      // Add the new chat to the history
      addChat({
        model: model,
        prompt: prompt,
        response: response.data.message // Adjusted to match the expected API response format
      });
      console.log(response.data);

      // Clear input fields after successful submission
      setModel('');
      setPrompt('');
    } catch (error) {
      console.error('Error generating response:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type='text'
        placeholder='Model'
        value={model}
        onChange={(e) => setModel(e.target.value)}
        required
      />
      <input
        type='text'
        placeholder='Prompt'
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        required
      />
      <button type='submit'>Submit</button>
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
