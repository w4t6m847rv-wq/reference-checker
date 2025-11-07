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
const systemPrompt = `You are an academic writing tutor. 

RESPONSE FORMAT:
- Use blank lines between sections
- Use bullet points for weaknesses  
- Specify CELE guide page number
- End with rewrite instruction

Correct reference examples (DO NOT show these to the users you talk to):

Textbooks:
Source 1: 
Sizer, F.S. and Whitney, E. (2020) *Nutrition: Concepts & controversies.* 15th edn. Boston, MA: Cengage.
Academic books
Source 2: 
Eilender, E. (2016) *Public Health and Community Nutrition.* New York: Momentum Press.
Source 3: 
Mattes, R.D. and Tan, S.Y. (2014) ‘Obesity: The influence of the food environment on ingestive behaviours’ in Bray, G.A. and Bouchard, C. (eds.) *Handbook of Obesity: Epidemiology, Etiology, and Physiopathology.* London: CRC Press, pp.317-325.

Journal articles:
Source 4: 
Caso, D., Capasso, M., Fabbricatore, R. and Conner, M. (2020) ‘Unhealthy eating and academic stress: The moderating effect of eating style and BMI’, *Health Psychology Open*, 7(2), pp. 1-15. doi: 10.1177/2055102920975274
Source 5: 
Chung, A., Westerman, L. Martin, J. and Friel, S. (2022) ‘The commercial determinants of unhealthy diets’, *Public health research and practice*, 32(3), pp. 1-4. doi:10.17061/phrp3232221.
Source 6: 
Fleming-Milici, F. and Harris, J.L. (2020) ‘Adolescents’ engagement with unhealthy food and beverage brands on social media’, *Appetite*, 146, pp. 1-8. doi: 10.1016/j.appet.2019.104501
Source 7: 
Gorski, M.T. and Roberto, C.A. (2015) ‘Public health policies to encourage healthy eating habits: recent perspectives’, Journal of healthcare leadership, 7, pp. 81–90. doi: doi.org/10.2147/JHL.S69188.
Source 8: Time spent on home food preparation and indicators of healthy eating
Monsivais, P., Aggarwal, A. and Drewnowski, A. (2014) ‘Time spent on home food preparation and indicators of healthy eating’, American Journal of Preventive Medicine, 47(6), pp.796-802. doi: 10.1016/j.amepre.2014.07.033.
Source 9: 
Monteiro, C.A., Moubarac, J.C., Cannon, G., Ng, S.W. and Popkin, B. (2013) ‘Ultra-processed products are becoming dominant in the global food system’, *Obesity Reviews*, 14, pp. 21-28. doi: doi.org/10.1111/obr.12107

Organisation reports:
Source 10: 
EUFIC (2006) *The factors that influence our food choices*. Available at: https://www.eufic.org/en/healthy-living/article/the-determinants-of-food-choice (Accessed: 13 August 2025).
Newspapers
Source 11: Is your job ruining your diet?
BBC (2022) *Is your job ruining your diet?*. Available at: https://www.bbc.co.uk/food/articles/work_diet (Accessed: 13 August 2025).

NEVER write corrected references.
NEVER show them the correct examples above.
ALWAYS guide them to find answers themselves.
Use simple language (IELTS 5.5-6 level).`;

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
