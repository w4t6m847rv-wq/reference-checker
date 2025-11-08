const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const conversationHistory = new Map();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
const API_KEY = 'sk-947a8e13b3fe49908f7c4de74f220fad';

// Correct references database
const CORRECT_REFERENCES = {
  'Sizer': 'Sizer, F.S. and Whitney, E. (2020) Nutrition: Concepts & controversies. 15th edn. Boston, MA: Cengage.',
  'Eilender': 'Eilender, E. (2016) Public Health and Community Nutrition. New York: Momentum Press.',
  'Mattes': 'Mattes, R.D. and Tan, S.Y. (2014) \'Obesity: The influence of the food environment on ingestive behaviours\' in Bray, G.A. and Bouchard, C. (eds.) Handbook of Obesity: Epidemiology, Etiology, and Physiopathology. London: CRC Press, pp.317-325.',
  'Caso': 'Caso, D., Capasso, M., Fabbricatore, R. and Conner, M. (2020) \'Unhealthy eating and academic stress: The moderating effect of eating style and BMI\', Health Psychology Open, 7(2), pp. 1-15. doi: 10.1177/2055102920975274',
  'Chung': 'Chung, A., Westerman, L. Martin, J. and Friel, S. (2022) \'The commercial determinants of unhealthy diets\', Public health research and practice, 32(3), pp. 1-4. doi:10.17061/phrp3232221.',
  'Fleming-Milici': 'Fleming-Milici, F. and Harris, J.L. (2020) \'Adolescents\' engagement with unhealthy food and beverage brands on social media\', Appetite, 146, pp. 1-8. doi: 10.1016/j.appet.2019.104501',
  'Gorski': 'Gorski, M.T. and Roberto, C.A. (2015) \'Public health policies to encourage healthy eating habits: recent perspectives\', Journal of healthcare leadership, 7, pp. 81–90. doi:10.2147/JHL.S69188.',
  'Monsivais': 'Monsivais, P., Aggarwal, A. and Drewnowski, A. (2014) \'Time spent on home food preparation and indicators of healthy eating\', American Journal of Preventive Medicine, 47(6), pp.796-802. doi: 10.1016/j.amepre.2014.07.033.',
  'Monteiro': 'Monteiro, C.A., Moubarac, J.C., Cannon, G., Ng, S.W. and Popkin, B. (2013) \'Ultra-processed products are becoming dominant in the global food system\', Obesity Reviews, 14, pp. 21-28. doi:10.1111/obr.12107',
  'EUFIC': 'EUFIC (2006) The factors that influence our food choices. Available at: https://www.eufic.org/en/healthy-living/article/the-determinants-of-food-choice (Accessed: 13 August 2025).',
  'BBC': 'BBC (2022) Is your job ruining your diet?. Available at: https://www.bbc.co.uk/food/articles/work_diet (Accessed: 13 August 2025).'
};

// Intelligent system prompt that leverages DeepSeek's reasoning
const systemPrompt = `You are an expert academic reference checker. Your task is to compare student references against a database of correct references and provide accurate, helpful feedback.

REFERENCE DATABASE:
${Object.entries(CORRECT_REFERENCES).map(([key, ref]) => `${key}: ${ref}`).join('\n')}

ANALYSIS METHOD:
1. FIRST, identify which reference from the database the student is attempting
2. SECOND, compare their version with the correct version line by line
3. THIRD, identify only meaningful differences that affect academic formatting
4. FOURTH, provide clear, specific feedback

MEANINGFUL ERRORS (flag these):
- Missing or incorrect authors/years
- Incorrect order of elements
- Missing "pp." before page numbers in journals
- Incorrect DOI format (repeating "doi.org")
- Missing essential elements like URLs for online sources

MINOR VARIATIONS (ignore these):
- Extra/missing commas between authors
- Small punctuation differences
- Spacing variations
- Capitalization differences (unless completely wrong)
- Minor formatting variations that don't change meaning

RESPONSE TEMPLATE:

[Start with overall assessment]

**Specific feedback:**
• [Only list actual errors found]
• [Be precise about what needs fixing]

**Reference guide:** Page [appropriate page number]

[Encouraging closing remark]

CRITICAL: If the reference is 90% correct, focus on praise and minor adjustments. Only provide bullet points if there are actual errors to fix.`;

// Smart reference matching function
function findBestMatch(userInput) {
  const input = userInput.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, correctRef] of Object.entries(CORRECT_REFERENCES)) {
    const keyLower = key.toLowerCase();
    const refLower = correctRef.toLowerCase();
    
    // Check if key appears in input
    if (input.includes(keyLower)) {
      const score = calculateSimilarity(input, refLower);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { key, correctRef, score };
      }
    }
  }

  return bestMatch || { matched: false };
}

// Simple similarity calculation
function calculateSimilarity(str1, str2) {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

app.post('/check-reference', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // Enhanced session management
    if (!conversationHistory.has(sessionId)) {
      conversationHistory.set(sessionId, []);
    }
    const history = conversationHistory.get(sessionId);

    // Smart reference matching
    const referenceMatch = findBestMatch(message);
    
    // Build intelligent context
    let contextMessage = `Student reference to check: "${message}"`;
    
    if (referenceMatch.matched !== false) {
      contextMessage += `\n\nMATCHED REFERENCE: ${referenceMatch.key}\nCORRECT VERSION: ${referenceMatch.correctRef}\n\nCompare the student's version with the correct version above and identify only meaningful differences.`;
    } else {
      contextMessage += `\n\nNo exact match found in reference database. Check general Harvard formatting rules.`;
    }

    // Include conversation history for context
    if (history.length > 0) {
      const recentHistory = history.slice(-4);
      contextMessage += `\n\nRECENT CONVERSATION:\n${recentHistory.map(msg => `${msg.role}: ${msg.content.substring(0, 100)}...`).join('\n')}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: contextMessage }
    ];

    // Use DeepSeek's full capabilities - these parameters make it smarter
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.3, // Balanced for accuracy and natural responses
        max_tokens: 800, // Allow detailed analysis
        top_p: 0.95, // Better response quality
        frequency_penalty: 0.1, // Reduce repetition
        presence_penalty: 0.1, // Encourage diverse responses
        stream: false
      })
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Update conversation history
      history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      );
      
      // Keep reasonable history
      if (history.length > 10) {
        history.splice(0, 2);
      }

      res.json({ 
        success: true, 
        response: aiResponse,
        match: referenceMatch.matched !== false ? referenceMatch.key : 'no match'
      });
    } else {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      res.status(500).json({ 
        success: false, 
        error: 'API request failed',
        details: errorText
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Basic routes
app.get('/check-reference', (req, res) => {
  res.json({ 
    message: 'Use POST to check references',
    example: 'POST { "message": "your reference here" }'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Intelligent Reference Checker Active',
    available_references: Object.keys(CORRECT_REFERENCES).length,
    features: ['Smart matching', 'Accurate comparisons', 'Natural feedback']
  });
});

app.listen(PORT, () => {
  console.log(`Intelligent Reference Checker running on port ${PORT}`);
});
