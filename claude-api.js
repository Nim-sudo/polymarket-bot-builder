// Claude Opus 4.5 API Integration

class ClaudeAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.anthropic.com/v1/messages';
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
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 4096,
                    messages: messages,
                    system: this.getSystemPrompt()
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
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

Important guidelines:
- Never use emojis in your responses
- Keep responses professional and to the point
- When asking for numbers, provide inline input fields
- When presenting choices, provide inline dropdowns
- Generate complete, working code that users can deploy immediately
- Include proper error handling and rate limiting in generated code
- Follow best practices for the Polymarket CLOB API

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

// API Key management
function getAPIKey() {
    return localStorage.getItem('claude_api_key') || null;
}

function setAPIKey(apiKey) {
    localStorage.setItem('claude_api_key', apiKey);
}

function hasAPIKey() {
    return !!getAPIKey();
}

// Make globally available for browser
window.ClaudeAPI = ClaudeAPI;
window.getAPIKey = getAPIKey;
window.setAPIKey = setAPIKey;
window.hasAPIKey = hasAPIKey;
