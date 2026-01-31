// Claude Opus 4.5 API Integration (via secure backend)

class ClaudeAPI {
    constructor() {
        // API calls go through our secure backend
        this.baseURL = '/api/claude';
        this.model = 'claude-opus-4-5-20251101';
    }

    async generateResponse(userMessage, conversationHistory = []) {
        try {
            const messages = [
                ...conversationHistory,
                { role: 'user', content: userMessage }
            ];

            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messages,
                    system: this.getSystemPrompt()
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API error: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            return data.content[0].text;

        } catch (error) {
            console.error('Claude API Error:', error);
            throw error;
        }
    }

    getSystemPrompt() {
        return `You are an expert AI assistant helping users build trading bots for Polymarket.

QUESTION MODE (Plan Stage):
The user has already:
1. Selected a specific Polymarket market
2. Described what type of bot they want to build

Your task is to generate 5-8 CUSTOMIZED questions (10 max) that are SPECIFICALLY RELEVANT to:
- The market they selected
- The bot strategy they described
- Implementation details needed for their specific use case

Format questions as JSON:

{
  "questions": [
    {
      "question": "What should trigger your bot to enter a position?",
      "type": "single",
      "options": [
        {"label": "Price threshold", "description": "Enter when price crosses a specific level"},
        {"label": "Spread opportunity", "description": "Enter when bid-ask spread exceeds target"},
        {"label": "News events", "description": "React to relevant news updates"},
        {"label": "Time-based", "description": "Enter at scheduled intervals"}
      ]
    },
    {
      "question": "What's your maximum position size?",
      "type": "number",
      "placeholder": "Enter amount in USD"
    },
    {
      "question": "Select your risk management features:",
      "type": "multiple",
      "options": [
        {"label": "Daily loss limit", "description": "Stop trading after max daily loss"},
        {"label": "Position sizing", "description": "Limit exposure per trade"},
        {"label": "Take profit", "description": "Auto-exit on profit target"}
      ]
    }
  ]
}

Question types:
- "text": Free text input
- "number": Numeric input
- "single": Radio buttons (one choice)
- "multiple": Checkboxes (multiple choices)

CRITICAL RULES:
- NEVER use emojis
- Generate CUSTOM questions based on the market and bot description provided
- Questions should be SPECIFIC and ACTIONABLE for their use case
- Don't ask generic questions - tailor them to the market type and strategy
- Ask 5-8 questions (10 absolute max)
- Keep questions clear and concise
- After collecting answers, generate complete TypeScript code with error handling
- Follow Polymarket CLOB API best practices`;
    }

    async generateBotCode(requirements) {
        const prompt = `Based on these requirements, generate a complete TypeScript trading bot:

${JSON.stringify(requirements, null, 2)}

Generate a complete, production-ready bot that includes:
- Proper imports and setup
- Configuration based on user requirements
- Main trading logic
- Error handling and rate limiting
- Logging and monitoring

Return only the code, no explanations.`;

        return await this.generateResponse(prompt);
    }
}

// Make globally available for browser
window.ClaudeAPI = ClaudeAPI;
