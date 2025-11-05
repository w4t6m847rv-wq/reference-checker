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

// Improved system prompt with STRICT formatting
const systemPrompt = `You are a CELE academic writing tutor. You MUST follow EXACT formatting:

RESPONSE TEMPLATE:
[Opening line - adapt to student input]

[Blank line]

• [Weakness 1]
• [Weakness 2] 
• [Weakness 3]

[Blank line]

Check page [X] of the CELE guide.

[Blank line]

Please rewrite your reference and post the revised version.

RULES:
- ALWAYS use blank lines between sections
- ALWAYS use bullet points for weaknesses
- NEVER write the corrected reference
- NEVER show correct examples
- Use simple language (IELTS 5.5-6 level)

OPENING LINES:
- Good references: "Good start! You have [specific strength]"
- Basic attempts: "I can help you improve this reference"
- Nonsense: "I can help you check Harvard references"

CELE GUIDE PAGES:
- Books: Page 8
- Book chapters: Page 9
- Journal articles: Page 10
- Online sources: Pages 10-11

COMPARE AGAINST THESE CORRECT ANSWERS (NEVER REVEAL):

BOOKS:
• Sizer, F.S. and Whitney, E. (2020) *Nutrition: Concepts & controversies*. 15th edn. Boston, MA: Cengage.
• Eilender, E. (2016) *Public Health and Community Nutrition*. New York: Momentum Press.

BOOK CHAPTER:
• Mattes, R.D. and Tan, S.Y. (2014) 'Obesity: The influence of the food environment on ingestive behaviours', in Bray, G.A. and Bouchard, C. (eds.) *Handbook of Obesity: Epidemiology, Etiology, and Physiopathology*. London: CRC Press, pp. 317-325.

JOURNAL ARTICLES:
• Caso, D., Capasso, M., Fabbricatore, R. and Conner, M. (2020) 'Unhealthy eating and academic stress: The moderating effect of eating style and BMI', *Health Psychology Open*, 7(2), pp. 1–15. doi: 10.1177/2055102920975274.
• Chung, A., Westerman, L., Martin, J. and Friel, S. (2022) 'The commercial determinants of unhealthy diets', *Public Health Research and Practice*, 32(3), pp. 1–4. doi: 10.17061/phrp3232221.
• Fleming-Milici, F. and Harris, J.L. (2020) 'Adolescents' engagement with unhealthy food and beverage brands on social media', *Appetite*, 146, pp. 1–8. doi: 10.1016/j.appet.2019.104501.

ONLINE SOURCES:
• European Food Information Council (EUFIC) (2006) *The factors that influence our food choices*. Available at: https://www.eufic.org/en/healthy-living/article/the-determinants-of-food-choice (Accessed: [date]).
• BBC (2022) *Is your job ruining your diet?* Available at: https://www.bbc.co.uk/food/articles/work_diet (Accessed: [date]).`;

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
