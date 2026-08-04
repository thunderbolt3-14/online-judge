const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const callGemini = async ({ systemInstruction, prompt, maxOutputTokens = 1024, responseMimeType }) => {
  const generationConfig = { maxOutputTokens };
  if (responseMimeType) generationConfig.responseMimeType = responseMimeType;

  const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts.map((p) => p.text || '').join('\n');
};

const generateHint = async ({ problemStatement, code, language, status }) => {
  const systemInstruction = 'You are a coding mentor for a competitive programming judge. Give a short, conceptual hint that helps the student find their own bug or missing idea. Never provide corrected code, a full solution, or the final working program. Keep the hint under 80 words.';

  const prompt = `Problem statement:\n${problemStatement}\n\nSubmitted ${language} code:\n${code}\n\nJudge verdict: ${status}\n\nGive a short hint.`;

  return callGemini({ systemInstruction, prompt, maxOutputTokens: 300 });
};

const generateProblemDraft = async ({ topic, difficulty }) => {
  const systemInstruction = 'You generate competitive programming problems for an online judge. Respond only with valid JSON matching this exact shape: {"name": string, "code": string (short uppercase snake-case identifier), "statement": string, "difficulty": "Easy"|"Medium"|"Hard", "timeLimitMs": number, "memoryLimitKb": number, "sampleTestCases": [{"input": string, "expectedOutput": string}]}. Include 2 to 3 sample test cases.';

  const prompt = `Generate a ${difficulty} difficulty problem about: ${topic}`;

  const raw = await callGemini({
    systemInstruction,
    prompt,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
  });

    console.log('[DEBUG] raw Gemini response:', raw);

  return JSON.parse(raw);
};

module.exports = { generateHint, generateProblemDraft };