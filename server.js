const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Memory storage (in production, use Redis)
const sessions = new Map();

// Your DeepSeek API Key
const API_KEY = 'sk-947a8e13b3fe49908f7c4de74f220fad';

// System prompt with conversation awareness
const systemPrompt = `You are a CELE academic writing tutor with conversation memory.

CONVERSATION CONTEXT:
- Student's original reference: [ORIGINAL_REFERENCE]
- Your previous feedback: [PREVIOUS_FEEDBACK]

RESPONSE RULES:
1. If student corrects your feedback: Acknowledge and re-evaluate
2. If student provides new reference: Check it normally  
3. If student asks follow-up: Use conversation context
4. Always maintain professional, helpful tone

RESPONSE TEMPLATE:
[Context-aware opening]

[Blank line]

• [Specific issue 1]
• [Specific issue 2]

[Blank line]

Check page [X] of CELE guide.

[Blank line]

Please rewrite and repost.

NEVER write corrected references. Use simple language.

CELE PAGES:
- Books: Page 8 | Book chapters: Page 9 | Journals: Page 10 | Online: Pages 10-11

CORRECT EXAMPLES (NEVER REVEAL):
[Your complete correct references list here...]`;

// Handle POST requests
app.post('/check-reference', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // Get or create session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        history: [],
        originalReference: null,
        previousFeedback: null
      });
    }
    
    const session = sessions.get(sessionId);
    
    // Detect message type and update context
    const messageType = analyzeMessage(message, session);
    let contextPrompt = systemPrompt;
    
    if (session.originalReference) {
      contextPrompt = systemPrompt
        .replace('[ORIGINAL_REFERENCE]', session.originalReference)
        .replace('[PREVIOUS_FEEDBACK]', session.previousFeedback || 'None');
    }
    
    // Store user message
    session.history.push({ role: 'user', content: message });
    
    // If this looks like a reference, store it as original
    if (isReference(message) && !session.originalReference) {
      session.originalReference = message;
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
          ...session.history.slice(-6) // Last 3 exchanges
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Store AI response
      session.history.push({ role: 'assistant', content: aiResponse });
      session.previousFeedback = aiResponse;
      
      res.json({ 
        success: true, 
        response: aiResponse 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'DeepSeek API error' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Helper functions
function isReference(message) {
  const refPatterns = [/\(\d{4}\)/, /pp\.\s*\d/, /http/, /Available at/, /doi:/];
  return refPatterns.some(pattern => pattern.test(message));
}

function analyzeMessage(message, session) {
  const corrections = ['it has', 'it already', 'you said', 'but the', 'actually'];
  if (corrections.some(word => message.toLowerCase().includes(word))) {
    return 'correction';
  }
  if (isReference(message)) return 'reference';
  return 'general';
}

// Keep your existing GET routes
app.get('/check-reference', (req, res) => {
  res.json({ message: 'Use POST method', example: 'POST { "message": "reference" }' });
});

app.get('/', (req, res) => {
  res.json({ message: 'CELE Reference Checker with Memory is running!' });
});

app.listen(PORT, () => {
  console.log(`Server with memory running on port ${PORT}`);
});
