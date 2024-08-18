import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Handle GET request to the root path
app.get('/', (req, res) => {
  res.send('LLM Streaming Server is running. Use POST /generate to interact with the LLM.');
});

app.post('/generate', async (req, res) => {
  const { model, messages } = req.body;
  
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model,
      messages,
      stream: true
    }, {
      responseType: 'stream'
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        const message = JSON.parse(line);
        if (message.done) {
          res.write(`data: [DONE]\n\n`);
          res.end();
        } else {
          res.write(`data: ${JSON.stringify(message)}\n\n`);
        }
      }
    });

    response.data.on('end', () => {
      res.end();
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
