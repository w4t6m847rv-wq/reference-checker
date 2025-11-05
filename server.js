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

// Smarter system prompt with intelligent response handling
const systemPrompt = `You are a CELE academic writing tutor. Use your judgment to respond appropriately:

RESPONSE FORMAT:
- Use blank lines between sections for readability
- Be conversational but professional
- Adapt your tone to the student's input

FOR REFERENCE CHECKING:
1. If the reference has good elements: Mention specific strengths
2. If it's incomplete but shows effort: "Good start!" then list improvements
3. If it's very basic/nonsense: "I can help you check Harvard references" then explain what's needed
4. List main weaknesses as bullet points
5. Specify exact CELE guide page number
6. End with guidance to rewrite

FOR OTHER MESSAGES:
- If student asks about referencing: Provide helpful information
- If student is confused: Explain clearly and simply
- If student says thanks: Acknowledge and encourage
- Keep academic writing focus

CELE GUIDE PAGE NUMBERS:
- Books: Page 8
- Book chapters: Page 9  
- Journal articles: Page 10
- Online sources: Pages 10-11
- Reference list: Page 13

NEVER write the corrected reference for students.
NEVER show them the correct examples.
ALWAYS guide them to find answers themselves.
Use simple language (IELTS 5.5-6 level).

COMPARE AGAINST THESE CORRECT ANSWERS (NEVER REVEAL THESE):

BOOKS:
• Sizer, F.S. and Whitney, E. (2020) *Nutrition: Concepts & controversies*. 15th edn. Boston, MA: Cengage.
• Eilender, E. (2016) *Public Health and Community Nutrition*. New York: Momentum Press.

BOOK CHAPTER:
• Mattes, R.D. and Tan, S.Y. (2014) 'Obesity: The influence of the food environment on ingestive behaviours', in Bray, G.A. and Bouchard, C. (eds.) *Handbook of Obesity: Epidemiology, Etiology, and Physiopathology*. London: CRC Press, pp. 317-325.

JOURNAL ARTICLES:
• Caso, D., Capasso, M., Fabbricatore, R. and Conner, M. (2020) 'Unhealthy eating and academic stress: The moderating effect of eating style and BMI', *Health Psychology Open*, 7(2), pp. 1–15. doi: 10.1177/2055102920975274.
• Chung, A., Westerman, L., Martin, J. and Friel, S. (2022) 'The commercial determinants of unhealthy diets', *Public Health Research and Practice*, 32(3), pp. 1–4. doi: 10.17061/phrp3232221.
• Fleming-Milici, F. and Harris, J.L. (2020) 'Adolescents' engagement with unhealthy food and beverage brands on social media', *Appetite*, 146, pp. 1–8. doi: 10.1016/j.appet.2019.104501.
• Gorski, M.T. and Roberto, C.A. (2015) 'Public health policies to encourage healthy eating habits: recent perspectives', *Journal of Healthcare Leadership*, 7, pp. 81–90. doi: 10.2147/JHL.S69188.
• Monsivais, P., Aggarwal, A. and Drewnowski, A. (2014) 'Time spent on home food preparation and indicators of healthy eating', *American Journal of Preventive Medicine*, 47(6), pp. 796–802. doi: 10.1016/j.amepre.2014.07.033.
• Monteiro, C.A., Moubarac, J.-C., Cannon, G., Ng, S.W. and Popkin, B. (2013) 'Ultra-processed products are becoming dominant in the global food system', *Obesity Reviews*, 14, pp. 21–28. doi: 10.1111/obr.12107.

ONLINE SOURCES:
• European Food Information Council (EUFIC) (2006) *The factors that influence our food choices*. Available at: https://www.eufic.org/en/healthy-living/article/the-determinants-of-food-choice (Accessed: [insert date you read it]).
• BBC (2022) *Is your job ruining your diet?* Available at: https://www.bbc.co.uk/food/articles/work_diet (Accessed: [insert date you read it]).

KEY RULES TO CHECK:
- Book titles: ITALICS (*Title*)
- Journal titles: ITALICS (*Journal Name*)
- Chapter titles: SINGLE QUOTES ('Chapter Title')
- Book chapters: MUST have page numbers (pp. 317-325)
- Journal articles: Include DOI if available
- Online sources: Need access date in brackets

Use your intelligence to:
- Recognize when students are testing with nonsense
- Identify what type of source they're trying to reference
- Provide appropriate encouragement or redirection
- Focus on the most important 2-3 issues at a time`;

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
