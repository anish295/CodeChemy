import { GoogleGenAI } from '@google/genai';

let _ai = null;
function getAI() {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
}

// gemini-3.5-flash: 1,500 req/day and 15 req/min free tier (Unblocks the 429 error)
const MODEL = 'gemini-3.5-flash';

function isQuotaError(e) {
  return e.status === 429 || (e.message && e.message.includes('429')) || (e.message && e.message.includes('RESOURCE_EXHAUSTED'));
}

// ─── Code Review ───

export async function generateCodeReview(code, language = 'python') {
  const prompt = `You are an expert code reviewer. Analyze the following ${language} code and provide:

1. The SAME code with inline comments added directly at problematic lines (prefixed with "# REVIEW:" for Python or "// REVIEW:" for other languages). Do NOT rewrite the code — only add review comments inline.
2. A summary section after the code covering:
   - **Correctness**: Does the code produce correct results?
   - **Time Complexity**: What is the time complexity?
   - **Space Complexity**: What is the space complexity?
   - **Key Takeaway**: One most important improvement suggestion.

Format your response as:
\`\`\`${language}
[code with inline review comments]
\`\`\`

**Summary**
- **Correctness:** [analysis]
- **Time Complexity:** [O(...)]
- **Space Complexity:** [O(...)]
- **Key Takeaway:** [one key improvement]

Here is the code to review:

\`\`\`${language}
${code}
\`\`\``;

  const response = await getAI().models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text;
}

// ─── Hint Generator (updated system prompt per spec 5c) ───

export async function generateHint(code, language = 'python', followUp = null, previousHint = null) {
  let prompt;

  if (followUp && previousHint) {
    // Follow-up prompt — maintain context
    prompt = `You are an expert competitive programming coach. The user has submitted the following ${language} code for a LeetCode problem and is stuck. Your role is to guide them without solving it for them.

Rules you must follow:
1. Give ONLY conceptual hints — never write corrected code or reveal the full algorithm
2. Reference specific lines or variable names from their actual submitted code
3. Ask one guiding question at the end to push their thinking forward
4. If the code has a clear logical error, point to the general area (e.g. "look at how you're handling the base case in your recursive function") without fixing it
5. Keep the hint under 150 words

Their code:
\`\`\`${language}
${code}
\`\`\`

Your previous hint:
${previousHint}

Their follow-up question: ${followUp}

Respond with a follow-up hint that builds on the previous hint and the user's question. Keep it under 150 words.`;
  } else {
    // Initial hint
    prompt = `You are an expert competitive programming coach. The user has submitted the following code for a LeetCode problem and is stuck. Your role is to guide them without solving it for them.

Rules you must follow:
1. Give ONLY conceptual hints — never write corrected code or reveal the full algorithm
2. Reference specific lines or variable names from their actual submitted code
3. Ask one guiding question at the end to push their thinking forward
4. If the code has a clear logical error, point to the general area (e.g. "look at how you're handling the base case in your recursive function") without fixing it
5. Keep the hint under 150 words

Their code:
\`\`\`${language}
${code}
\`\`\`

Respond with ONLY the hint, no preamble or labels.`;
  }

  const response = await getAI().models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text;
}

// ─── Optimal Solution Generator ───

export async function generateOptimalSolution(problemTitle, userCode, language = 'python') {
  const prompt = `You are an expert competitive programmer. The problem is "${problemTitle}". 

A user submitted this solution:
\`\`\`${language}
${userCode}
\`\`\`

Provide the OPTIMAL solution for this problem in ${language} with:
1. Clean, well-commented code
2. Time and space complexity analysis

Format your response EXACTLY as:
\`\`\`${language}
[optimal solution code]
\`\`\`
**Time Complexity:** O(...)
**Space Complexity:** O(...)`;

  const response = await getAI().models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text;
}

// ─── AI Coach — Optimisation Hints (for Dashboard, no user code needed) ───

export async function generateOptimisationHints(problemTitle, language = 'python') {
  const prompt = `You are an expert competitive programming coach. The user recently solved the LeetCode problem: "${problemTitle}".

Provide a JSON object with exactly these fields:
{
  "hint": "One specific optimisation tip for this problem (2-3 sentences, reference specific algorithmic concepts like two-pointer, sliding window, etc.)",
  "currentComplexity": "Most common naive approach complexity e.g. O(n²) time, O(1) space",
  "suggestedComplexity": "Best known optimal complexity e.g. O(n) time, O(1) space",
  "approachName": "Name of the optimal approach e.g. Two Pointers, Dynamic Programming, etc."
}

Respond with ONLY valid JSON. No markdown fences, no extra text.`;

  const response = await getAI().models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  try {
    // Strip any accidental markdown fences
    const text = response.text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    return {
      hint: response.text,
      currentComplexity: 'N/A',
      suggestedComplexity: 'N/A',
      approachName: 'Optimal Approach',
    };
  }
}

// ─── AI Coach — Optimal Solution for last submission (public, no session) ───

export async function generateOptimalSolutionPublic(problemTitle, language = 'python') {
  const prompt = `You are an expert competitive programmer. Provide the optimal solution for the LeetCode problem: "${problemTitle}".

Requirements:
1. Clean, well-commented code in ${language}
2. The most efficient known algorithm

Format your response EXACTLY as:
\`\`\`${language}
[optimal solution code]
\`\`\`
**Time Complexity:** O(...)
**Space Complexity:** O(...)`;

  const response = await getAI().models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const text = response.text;
  const codeMatch = text.match(/```[\w]*\n([\s\S]*?)```/);
  const timeMatch = text.match(/\*\*Time Complexity:\*\*\s*(O\([^)]+\))/);
  const spaceMatch = text.match(/\*\*Space Complexity:\*\*\s*(O\([^)]+\))/);

  return {
    code: codeMatch ? codeMatch[1].trim() : text,
    time: timeMatch ? timeMatch[1] : 'N/A',
    space: spaceMatch ? spaceMatch[1] : 'N/A',
  };
}

// ─── AI Coach Insight (legacy, kept for fallback) ───

export async function generateCoachInsight(topicBreakdown, recentActivity) {
  const weakTopics = topicBreakdown
    .filter(t => t.solved < 10)
    .map(t => `${t.topic} (${t.solved} solved)`)
    .slice(0, 5);

  const strongTopics = topicBreakdown
    .filter(t => t.solved >= 20)
    .map(t => `${t.topic} (${t.solved} solved)`)
    .slice(0, 5);

  const prompt = `You are an AI coding coach. Based on a student's LeetCode analytics:

Weak areas: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None identified yet'}
Strong areas: ${strongTopics.length > 0 ? strongTopics.join(', ') : 'None identified yet'}
Recent activity: ${recentActivity || 'General practice'}

Provide a specific, actionable coaching insight in 2-3 sentences. Reference a specific algorithmic concept (like adjacency matrices vs adjacency lists, or two-pointer vs sliding window) to make it concrete. Do NOT use generic advice like "keep practicing."

Respond with ONLY the coaching insight, no preamble.`;

  const response = await getAI().models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text;
}