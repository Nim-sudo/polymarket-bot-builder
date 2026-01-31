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
When gathering requirements, ask a maximum of 10 questions (fewer is better). Format questions as JSON:

{
  "questions": [
    {
      "question": "What market do you want to trade?",
      "type": "text",
      "placeholder": "Enter market name or Polymarket link"
    },
    {
      "question": "What's your primary trading strategy?",
      "type": "single",
      "options": [
        {"label": "Arbitrage", "description": "Find price differences between markets"},
        {"label": "Market Making", "description": "Provide liquidity with bid/ask spreads"},
        {"label": "Trend Following", "description": "Follow market momentum"},
        {"label": "Custom", "description": "Build a custom strategy"}
      ]
    },
    {
      "question": "Select your risk controls:",
      "type": "multiple",
      "options": [
        {"label": "Daily loss limit", "description": "Cap maximum daily losses"},
        {"label": "Position sizing", "description": "Limit per-trade exposure"},
        {"label": "Stop loss", "description": "Automatic exit on losses"}
      ]
    }
  ]
}

Question types:
- "text": Free text input
- "number": Numeric input
- "single": Radio buttons (one choice)
- "multiple": Checkboxes (multiple choices)

Keep questions focused and strategic. After collecting answers, generate complete TypeScript code.

CRITICAL RULES:
- NEVER use emojis
- Ask 5-8 questions maximum (10 absolute max)
- Keep questions clear and concise
- Generate production-ready code with error handling
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
