const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple memory storage
const sessionData = new Map();

// Your DeepSeek API Key
const API_KEY = 'sk-947a8e13b3fe49908f7c4de74f220fad';

// System prompt with memory
const systemPrompt = `You are a CELE academic writing tutor. 

RESPONSE FORMAT:
- Use blank lines between sections
- Use bullet points for weaknesses
- Specify CELE guide page number
- End with rewrite instruction

NEVER write corrected references.

CELE PAGES:
- Books: Page 8 | Book chapters: Page 9 | Journals: Page 10 | Online: Pages 10-11`;

// Handle POST requests to /check-reference
app.post('/check-reference', async (req, res) => {
  console.log('=== NEW REQUEST ===');
  console.log('Body:', req.body);
  
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // Initialize or get session
    if (!sessionData.has(sessionId)) {
      sessionData.set(sessionId, {
        lastReference: null,
        messageCount: 0
      });
      console.log('New session created:', sessionId);
    }
    
    const session = sessionData.get(sessionId);
    session.messageCount++;
    
    console.log('Session data:', session);
    
    // Build context-aware prompt
    let contextPrompt = systemPrompt;
    if (session.lastReference) {
      contextPrompt += `\n\nPrevious reference context: ${session.lastReference}`;
    }
    
    // Store if this looks like a reference
    if (message.length > 20 && (message.includes('(') || message.includes('http'))) {
      session.lastReference = message;
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
          { role: 'system', content: contextPrompt },
          { role: 'user', content: `Please check this reference: ${message}` }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    console.log('DeepSeek API status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      console.log('AI Response:', aiResponse);
      
      res.json({ 
        success: true, 
        response: aiResponse 
      });
    } else {
      console.log('DeepSeek API error:', response.status);
      res.status(500).json({ 
        success: false, 
        error: 'DeepSeek API error: ' + response.status 
      });
    }
  } catch (error) {
    console.log('Server error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add a GET handler for testing
app.get('/check-reference', (req, res) => {
  res.json({ 
    message: 'Use POST method to check references',
    example: 'POST { "message": "your reference here" }'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'CELE Reference Checker with Memory is running!',
    sessions: sessionData.size
  });
});

app.listen(PORT, () => {
  console.log(`Server with debug logging running on port ${PORT}`);
});
