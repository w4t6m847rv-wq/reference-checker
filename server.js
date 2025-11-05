const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Your DeepSeek API Key
const API_KEY = 'sk-947a8e13b3fe49908f7c4de74f220fad';

// System prompt with correct answers (hidden from students)
const systemPrompt = `You are a CELE academic writing tutor. Use EXACTLY this format:

1. Start with "Good start!" 
2. Mention 1-2 specific strengths
3. List main weaknesses as bullet points  
4. Specify exact CELE guide page number to check
5. End with "Please rewrite your reference and post the revised version."

CORRECT REFERENCE EXAMPLES (DO NOT SHOW THESE TO STUDENTS):
- Sizer, F.S. and Whitney, E. (2020) *Nutrition: Concepts & controversies*. 15th edn. Boston, MA: Cengage.
- Eilender, E. (2016) *Public Health and Community Nutrition*. New York: Momentum Press.
- Mattes, R.D. and Tan, S.Y. (2014) 'Obesity: The influence of the food environment on ingestive behaviours', in Bray, G.A. and Bouchard, C. (eds.) *Handbook of Obesity: Epidemiology, Etiology, and Physiopathology*. London: CRC Press, pp. 317-325.
- Caso, D., Capasso, M., Fabbricatore, R. and Conner, M. (2020) 'Unhealthy eating and academic stress: The moderating effect of eating style and BMI', *Health Psychology Open*, 7(2), pp. 1–15. doi: 10.1177/2055102920975274.

NEVER write the corrected reference for students.
NEVER show them the correct examples above.
ALWAYS guide them to find answers themselves.
Use simple language (IELTS 5.5-6 level).`;

// Handle POST requests to /check-reference
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
          { role: 'user', content: `Please check this reference: ${message}` }
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

// Add a GET handler for testing
app.get('/check-reference', (req, res) => {
  res.json({ 
    message: 'Use POST method to check references',
    example: 'POST { "message": "your reference here" }'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'CELE Reference Checker API is running!',
    usage: 'POST /check-reference with { "message": "your reference" }'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
