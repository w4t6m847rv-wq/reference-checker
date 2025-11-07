const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

// Add conversation memory here
const conversationHistory = new Map();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Your DeepSeek API Key
const API_KEY = 'sk-947a8e13b3fe49908f7c4de74f220fad';

// Academic Referencing Guide Key Pages
const guideContent = `
PAGE 8 - BOOKS:
Books require: Author(s), Year, Title (italics), Edition, Place: Publisher
Example: Bell, J. (2014) Doing your research project. Maidenhead: Open University Press.

PAGE 9 - E-BOOKS & BOOK CHAPTERS:
E-books: Include Available at: URL (Accessed: date) or DOI
Book chapters: Use 'chapter title' (single quotes) and in Editor (ed.) Book Title, pp. start-end
Example: Franklin, A.W. (2012) 'Management of the problem', in Smith, S. M. (ed.) The maltreatment of children. Lancaster: MTP, pp. 83-95.

PAGE 10 - JOURNAL ARTICLES:
Format: Author(s) (Year) 'Article title', Journal Title, Volume(Issue), pp. start-end. doi:XXX
Examples:
Shirazi, T. (2010) 'Successful teaching placements in secondary schools', European Journal of Teacher Education, 33(3), pp. 323-326. doi: 10.1080/02619761003602246.
Barke, M. and Mowl, G. (2016) 'Malaga – a failed resort?', Journal of Tourism History, 2(3), pp. 187-212. Available at: http://example.com (Accessed: 23 April 2018).

PAGE 10-11 - ONLINE SOURCES:
Web pages: Author (Year) Title. Available at: URL (Accessed: date)
Organisation sources: Use organisation name as author
Example: National Health Service (2018) Check your Symptoms. Available at: http://example.com (Accessed: 17 October 2018).

KEY RULES:
- Journal titles in italics, article titles in single quotes
- Use "pp." for page ranges in journals and book chapters
- Volume number comes before page numbers: Journal, Volume, pp. start-end
- DOI format: "doi:10.xxx" without repeating "doi.org"
- For 4+ authors, use "et al." in citations but list all in references
`;

// Updated system prompt with guide content
const systemPrompt = `You are an academic writing tutor with access to the official referencing guide.

REFERENCING GUIDE CONTENT:
${guideContent}

RESPONSE FORMAT:
- Use blank lines between sections (press Enter twice between each section)
- Use bullet points for weaknesses  
- Specify guide page number ACCURATELY
- End with rewrite instruction

EXAMPLE FORMAT:
Thank you for your reference. I can see some areas for improvement.

**Weaknesses in your reference:**
• First issue here
• Second issue here

**How to find the correct information:**
Instructions here...

**Guide Reference:**
Check page 10 for journal article formatting.

Please rewrite your reference with these corrections.

ACCURATE GUIDE PAGE NUMBERS:
- Journal articles: PAGE 10
- Books: PAGE 8  
- E-books: PAGE 9
- Book chapters: PAGE 9
- Web pages: PAGE 10-11

CORRECTION RULES:
- "pp." is CORRECT for page ranges in journal articles
- Volume number format "Journal, Volume, pp. start-end" is CORRECT (see page 10 examples)
- DOI should be "doi:10.xxx" without repeating "doi.org"
- Only flag errors that are actually wrong
- When you recognize a reference from the provided examples, compare against the correct version

Correct reference examples (DO NOT show these to the users you talk to):

Textbooks:
Source 1: 
Sizer, F.S. and Whitney, E. (2020) Nutrition: Concepts & controversies. 15th edn. Boston, MA: Cengage.
Academic books
Source 2: 
Eilender, E. (2016) Public Health and Community Nutrition. New York: Momentum Press.
Source 3: 
Mattes, R.D. and Tan, S.Y. (2014) 'Obesity: The influence of the food environment on ingestive behaviours' in Bray, G.A. and Bouchard, C. (eds.) Handbook of Obesity: Epidemiology, Etiology, and Physiopathology. London: CRC Press, pp.317-325.

Journal articles:
Source 4: 
Caso, D., Capasso, M., Fabbricatore, R. and Conner, M. (2020) 'Unhealthy eating and academic stress: The moderating effect of eating style and BMI', Health Psychology Open, 7(2), pp. 1-15. doi: 10.1177/2055102920975274
Source 5: 
Chung, A., Westerman, L. Martin, J. and Friel, S. (2022) 'The commercial determinants of unhealthy diets', Public health research and practice, 32(3), pp. 1-4. doi:10.17061/phrp3232221.
Source 6: 
Fleming-Milici, F. and Harris, J.L. (2020) 'Adolescents' engagement with unhealthy food and beverage brands on social media', Appetite, 146, pp. 1-8. doi: 10.1016/j.appet.2019.104501
Source 7: 
Gorski, M.T. and Roberto, C.A. (2015) 'Public health policies to encourage healthy eating habits: recent perspectives', Journal of healthcare leadership, 7, pp. 81–90. doi:10.2147/JHL.S69188.
Source 8: 
Monsivais, P., Aggarwal, A. and Drewnowski, A. (2014) 'Time spent on home food preparation and indicators of healthy eating', American Journal of Preventive Medicine, 47(6), pp.796-802. doi: 10.1016/j.amepre.2014.07.033.
Source 9: 
Monteiro, C.A., Moubarac, J.C., Cannon, G., Ng, S.W. and Popkin, B. (2013) 'Ultra-processed products are becoming dominant in the global food system', Obesity Reviews, 14, pp. 21-28. doi:10.1111/obr.12107

Organisation reports:
Source 10: 
EUFIC (2006) The factors that influence our food choices. Available at: https://www.eufic.org/en/healthy-living/article/the-determinants-of-food-choice (Accessed: 13 August 2025).
Newspapers
Source 11: 
BBC (2022) Is your job ruining your diet?. Available at: https://www.bbc.co.uk/food/articles/work_diet (Accessed: 13 August 2025).

NEVER write corrected references.
NEVER show them the correct examples above.
ALWAYS guide them to find answers themselves.
Use simple language (IELTS 5.5-6 level).`;

app.post('/check-reference', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // Get or create conversation history for this session
    if (!conversationHistory.has(sessionId)) {
      conversationHistory.set(sessionId, []);
    }
    const history = conversationHistory.get(sessionId);

    // Build messages with history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: `Check this reference: ${message}` }
    ];

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Update conversation history (keep last 6 messages to avoid token limits)
      history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      );
      
      // Limit history size
      if (history.length > 6) {
        history.splice(0, 2);
      }

      res.json({ 
        success: true, 
        response: aiResponse 
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
  res.json({ message: 'Reference Checker is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
