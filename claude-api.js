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
        return `You are an expert AI assistant helping users build trading bots for Polymarket. Your role is to:

1. Ask clear, concise questions to gather requirements
2. Guide users through the bot configuration process
3. Generate clean, production-ready TypeScript code for their trading bots
4. Provide helpful explanations without being verbose

CRITICAL RULES:
- NEVER use emojis in any responses
- Keep responses professional and to the point
- When asking for numbers, provide inline input fields
- When presenting choices, provide inline dropdowns
- Generate complete, working code that users can deploy immediately
- Include proper error handling and rate limiting in generated code
- Follow best practices for the Polymarket CLOB API
- After user selects a market, do NOT confirm - proceed directly to the next question

Current step: Gathering requirements for a new trading bot.`;
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
