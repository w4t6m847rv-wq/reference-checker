const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Your DeepSeek API Key
const API_KEY = 'sk-947a8e13b3fe49908f7c4de74f220fad';

// Simple system prompt
const systemPrompt = `You are a CELE academic writing tutor. 

RESPONSE FORMAT:
- Use blank lines between sections
- Use bullet points for weaknesses  
- Specify CELE guide page number
- End with rewrite instruction

NEVER write corrected references.`;

app.post('/check-reference', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Check this reference: ${message}` }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (response.ok) {
      const data = await response.json();
      res.json({ 
        success: true, 
        response: data.choices[0].message.content 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'API error' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Keep your existing GET routes
app.get('/check-reference', (req, res) => {
  res.json({ message: 'Use POST method', example: 'POST { "message": "reference" }' });
});

app.get('/', (req, res) => {
  res.json({ message: 'CELE Reference Checker is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
