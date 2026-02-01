// Check authentication
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = 'index.html';
}

// Initialize
let chats = JSON.parse(localStorage.getItem('chats') || '[]');
let currentChatId = localStorage.getItem('currentChatId');
let currentContextMenuChatId = null;
let claudeAPI = null;

// Initialize Claude API (no key needed - handled by backend)
function initializeClaudeAPI() {
    claudeAPI = new ClaudeAPI();
    return true;
}

// No need to check for API key - it's on the server
function ensureAPIKey() {
    return true;
}

// Load chats on startup
window.addEventListener('load', () => {
    // Initialize Claude API
    initializeClaudeAPI();

    loadChats();
    if (currentChatId) {
        loadChat(currentChatId);
    }
});

// Sidebar functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('expanded');
}

function searchChats() {
    alert('Search feature coming soon! You\'ll be able to search through all your chat history.');
}

function openSettings() {
    window.location.href = 'settings.html';
}

function newChat() {
    const chatId = Date.now().toString();
    const newChat = {
        id: chatId,
        title: 'New Chat',
        messages: [],
        pinned: false,
        createdAt: Date.now(),
        planMode: false,
        planAnswers: 0
    };

    chats.unshift(newChat);
    saveChats();
    loadChats();
    switchChat(chatId);

    // Show welcome screen, hide chat messages
    showWelcomeScreen();

    // Clear input areas
    document.getElementById('chatInput').value = '';
    document.getElementById('welcomeInput').value = '';

    // Clear code
    document.getElementById('codeContent').innerHTML = `
        <div class="code-placeholder">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 24 16 30"/>
                <polyline points="32 18 26 24 32 30"/>
            </svg>
            <p>Your bot code will appear here</p>
            <span>Start by describing your strategy in the chat</span>
        </div>
    `;
}

function loadChats() {
    const chatList = document.getElementById('chatList');

    // Sort: pinned first, then by date
    const sortedChats = [...chats].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
    });

    chatList.innerHTML = sortedChats.map(chat => {
        const preview = chat.messages.length > 0
            ? chat.messages[chat.messages.length - 1].text.substring(0, 40) + '...'
            : 'No messages yet';

        return `
            <div class="chat-item ${chat.id === currentChatId ? 'active' : ''} ${chat.pinned ? 'pinned' : ''}"
                 onclick="switchChat('${chat.id}')">
                <div class="chat-item-content">
                    <div class="chat-item-title">${escapeHtml(chat.title)}</div>
                    <div class="chat-item-preview">${escapeHtml(preview)}</div>
                </div>
                <div class="chat-item-actions">
                    <button class="chat-item-menu-btn" onclick="showContextMenu(event, '${chat.id}')">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor">
                            <circle cx="7" cy="3" r="1" fill="currentColor"/>
                            <circle cx="7" cy="7" r="1" fill="currentColor"/>
                            <circle cx="7" cy="11" r="1" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function switchChat(chatId) {
    currentChatId = chatId;
    localStorage.setItem('currentChatId', chatId);
    loadChats();
    loadChat(chatId);
}

function loadChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    // Update bot name
    document.getElementById('botName').value = chat.title;

    // Load messages
    const chatMessages = document.getElementById('chatMessages');
    if (chat.messages.length === 0) {
        // Show welcome screen for empty chats
        showWelcomeScreen();
        chatMessages.innerHTML = '';
    } else {
        // Hide welcome screen and show messages
        hideWelcomeScreen();
        chatMessages.innerHTML = '';
        chat.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.type}`;
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = formatMessage(msg.text);
            messageDiv.appendChild(contentDiv);
            chatMessages.appendChild(messageDiv);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Load code if exists
    if (chat.code) {
        showCode(chat.code);
    }

    // Set plan mode visual state
    const strategyPane = document.querySelector('.strategy-pane');
    if (chat.planMode) {
        strategyPane?.classList.add('plan-mode');
    } else {
        strategyPane?.classList.remove('plan-mode');
    }
}

function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats));
    lastSaveTime = Date.now();
    updateAutosaveStatus();
}

function getCurrentChat() {
    return chats.find(c => c.id === currentChatId);
}

// Context menu
function showContextMenu(event, chatId) {
    event.stopPropagation();
    currentContextMenuChatId = chatId;

    const menu = document.getElementById('contextMenu');
    menu.classList.add('active');
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
}

function hideContextMenu() {
    document.getElementById('contextMenu').classList.remove('active');
}

function renameChat() {
    const chat = chats.find(c => c.id === currentContextMenuChatId);
    if (!chat) return;

    const newName = prompt('Enter new name:', chat.title);
    if (newName && newName.trim()) {
        chat.title = newName.trim();
        saveChats();
        loadChats();
    }
    hideContextMenu();
}

function pinChat() {
    const chat = chats.find(c => c.id === currentContextMenuChatId);
    if (!chat) return;

    chat.pinned = !chat.pinned;
    saveChats();
    loadChats();
    hideContextMenu();
}

function deleteChat() {
    if (!confirm('Delete this chat?')) return;

    chats = chats.filter(c => c.id !== currentContextMenuChatId);
    saveChats();

    if (currentChatId === currentContextMenuChatId) {
        currentChatId = chats[0]?.id || null;
        localStorage.setItem('currentChatId', currentChatId);
        if (currentChatId) {
            loadChat(currentChatId);
        }
    }

    loadChats();
    hideContextMenu();
}

// Close context menu when clicking elsewhere
document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu')) {
        hideContextMenu();
    }
});

// Chat functionality
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Create chat if doesn't exist
    if (!currentChatId) {
        newChat();
    }

    const chat = getCurrentChat();
    if (!chat) return;

    // Add user message
    chat.messages.push({ type: 'user', text: message });
    addMessageToDOM(message, 'user');
    input.value = '';
    input.style.height = 'auto';

    // Update chat title if first message
    if (chat.messages.length === 1) {
        chat.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
        document.getElementById('botName').value = chat.title;
    }

    saveChats();
    loadChats();

    // Enter plan mode on first message
    if (chat.messages.length === 1) {
        chat.planMode = true;
        chat.planAnswers = 0;
        // Hide right pane during plan mode
        document.querySelector('.strategy-pane')?.classList.add('plan-mode');
        document.querySelector('.builder-container')?.classList.add('plan-mode');
    }

    // Show scroll button
    showScrollButton();

    // Show animated generating status
    if (chat.planMode) {
        updateStatusAnimated(['Thinking', 'Strategizing', 'Calculating', 'Pondering', 'Analyzing', 'Planning']);
    } else {
        updateStatusAnimated(['Building', 'Coding', 'Generating', 'Crafting', 'Compiling', 'Creating']);
    }

    // Check for API key
    if (!ensureAPIKey()) {
        stopStatusAnimation();
        updateStatus('API key required', false);
        return;
    }

    // Generate AI response
    generateAIResponse(chat, message).then(response => {
        // If response is null, modal was shown instead
        if (response === null) {
            stopStatusAnimation();
            updateStatus('Waiting for your answers...', false);
            return;
        }

        // Track plan progress
        if (chat.planMode && chat.planAnswers < 4) {
            chat.planAnswers++;
        } else if (chat.planMode && chat.planAnswers >= 4) {
            // Exit plan mode and generate code
            chat.planMode = false;
            chat.planAnswers++;
            // Restore right pane
            document.querySelector('.strategy-pane')?.classList.remove('plan-mode');
            document.querySelector('.builder-container')?.classList.remove('plan-mode');
            // Hide market search if still visible
            hideMarketSearch();

            const code = generateBotCode(message);
            chat.code = code;
            showCode(code);
        } else if (!chat.planMode) {
            // Normal mode (if user starts new message after plan mode)
            const code = generateBotCode(message);
            chat.code = code;
            showCode(code);
        }

        chat.messages.push({ type: 'assistant', text: response });
        addMessageToDOM(response, 'assistant');

        saveChats();
        stopStatusAnimation();
        updateStatus('Ready', false);
    }).catch(error => {
        console.error('Error generating response:', error);
        stopStatusAnimation();
        updateStatus('Error generating response', false);
        alert('Failed to generate response. Please check your API key and try again.');
    });
}

function addMessageToDOM(text, type) {
    // Hide welcome screen when first message is added
    hideWelcomeScreen();

    const messagesContainer = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formatMessage(text);

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatMessage(text) {
    // Simple formatting
    return text
        .replace(/\n/g, '<br>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// Helper function to create inline input fields
function createInlineInput(label, id, placeholder, type = 'text') {
    return `
        <div class="inline-input-group">
            <label class="inline-label">${label}</label>
            <input type="${type}" id="${id}" class="inline-input" placeholder="${placeholder}" />
        </div>
    `;
}

// Helper function to create inline dropdown
function createInlineDropdown(label, id, options) {
    const optionsHTML = options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
    return `
        <div class="inline-input-group">
            <label class="inline-label">${label}</label>
            <select id="${id}" class="inline-dropdown">
                <option value="">Select...</option>
                ${optionsHTML}
            </select>
        </div>
    `;
}

// Helper function to create submit button for inline forms
function createInlineSubmitButton(buttonText, onclickHandler) {
    return `<button class="inline-submit-btn" onclick="${onclickHandler}">${buttonText}</button>`;
}

// Helper function to create market search input with dropdown
function createMarketSearchInput() {
    return `
        <div class="inline-market-search">
            <input type="text" id="inlineMarketSearch" class="inline-input" placeholder="Search or paste a Polymarket link" oninput="searchInlineMarkets(this.value)" onkeydown="handleInlineMarketKeydown(event)" />
            <div class="inline-market-dropdown" id="inlineMarketDropdown"></div>
        </div>
    `;
}

async function generateAIResponse(chat, message) {
    // Try using Claude API if available
    if (claudeAPI) {
        try {
            // Build conversation history
            const history = chat.messages.map(msg => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));

            const response = await claudeAPI.generateResponse(message, history);

            // Check if response contains structured questions for modal
            if (chat.planMode) {
                const questions = parseQuestionsFromResponse(response);
                if (questions && questions.length > 0) {
                    // Show modal with questions instead of text response
                    showQuestionModal(questions);
                    return null; // Don't add message to chat yet
                }
            }

            return response;
        } catch (error) {
            console.error('Claude API failed, using fallback:', error);
            // Fall back to simulated response
            return generateFallbackResponse(chat, message);
        }
    } else {
        // Use simulated response
        return generateFallbackResponse(chat, message);
    }
}

function generateFallbackResponse(chat, message) {
    if (chat.planMode) {
        // In plan mode, ask clarifying questions with inline inputs
        if (chat.planAnswers === 0) {
            return `Great! I'll help you build that trading bot. First, I need to know:\n\n**What market do you want to trade?**\n${createMarketSearchInput()}`;
        } else if (chat.planAnswers === 1) {
            return `Excellent! Now let's configure your strategy:\n\n**Risk Management:**\n${createInlineInput('Maximum Position Size ($)', 'maxPosition', '1000', 'number')}${createInlineInput('Daily Loss Limit ($)', 'dailyLossLimit', '500', 'number')}${createInlineSubmitButton('Continue', 'submitRiskManagement()')}`;
        } else if (chat.planAnswers === 2) {
            return `Perfect! Next:\n\n**Trading Frequency:**\n${createInlineDropdown('Check frequency', 'tradingFrequency', [
                {value: '10', label: 'Every 10 seconds'},
                {value: '30', label: 'Every 30 seconds'},
                {value: '60', label: 'Every 1 minute'},
                {value: '300', label: 'Every 5 minutes'}
            ])}${createInlineSubmitButton('Continue', 'submitTradingFrequency()')}`;
        } else if (chat.planAnswers === 3) {
            return `Great! Final question:\n\n**Execution:**\n${createInlineDropdown('Order type', 'orderType', [
                {value: 'market', label: 'Market orders (execute immediately)'},
                {value: 'limit', label: 'Limit orders (wait for specific price)'},
                {value: 'threshold', label: 'Threshold-based (custom conditions)'}
            ])}${createInlineSubmitButton('Finish Setup', 'submitOrderType()')}`;
        } else {
            return `Excellent! I now have all the information I need. Let me generate your custom trading bot...\n\nMarket configured\nStrategy defined\nRisk parameters set\nTrading logic implemented\n\nYour bot code is ready! Check the Code tab on the right to review the implementation. You can export it when you're ready.`;
        }
    } else {
        return generateResponse(message);
    }
}

function generateResponse(userMessage) {
    if (userMessage.toLowerCase().includes('arbitrage')) {
        return `I've created an arbitrage bot that will monitor multiple similar markets and automatically identify profitable price differences.\n\nThe bot includes:\n- Multi-market monitoring\n- Automatic spread calculation\n- Configurable minimum profit threshold\n- Rate limiting and safety features\n\nCheck the code panel to review and customize the implementation.`;
    } else if (userMessage.toLowerCase().includes('market maker') || userMessage.toLowerCase().includes('spread')) {
        return `I've built a market making bot with automated bid-ask management.\n\nKey features:\n- Dynamic spread adjustment\n- Inventory risk management\n- Continuous quote updates\n- Position limit controls\n\nReview the generated code and adjust parameters as needed.`;
    } else if (userMessage.toLowerCase().includes('news')) {
        return `I've created a news-driven trading bot that monitors relevant news feeds and executes trades based on sentiment analysis.\n\nThe bot includes:\n- Real-time news monitoring\n- Automated sentiment scoring\n- Configurable trading signals\n- Free platform data integration\n\nCustomize the keywords and thresholds in the code panel.`;
    } else {
        return `I've generated a trading bot based on your requirements.\n\nThe code includes:\n- Polymarket API integration\n- Rate limiting and error handling\n- Configurable trading parameters\n- Safety features and logging\n\nYou can modify any part of the code to match your specific needs.`;
    }
}

function generateBotCode(userMessage) {
    if (userMessage.toLowerCase().includes('arbitrage')) {
        return `<span class="keyword">import</span> { ClobClient } <span class="keyword">from</span> <span class="string">'@polymarket/clob-client'</span>;

<span class="keyword">class</span> <span class="class-name">ArbitrageBot</span> {
  <span class="keyword">private</span> client: ClobClient;
  <span class="keyword">private</span> minSpread = <span class="number">0.02</span>; <span class="comment">// 2% minimum spread</span>

  <span class="keyword">constructor</span>() {
    <span class="keyword">this</span>.client = <span class="keyword">new</span> <span class="class-name">ClobClient</span>({
      apiKey: process.env.POLYMARKET_API_KEY,
      secret: process.env.POLYMARKET_SECRET,
      passphrase: process.env.POLYMARKET_PASSPHRASE
    });
  }

  <span class="keyword">async</span> <span class="function">run</span>() {
    console.log(<span class="string">'Arbitrage bot started'</span>);

    <span class="comment">// Monitor similar markets</span>
    <span class="keyword">const</span> markets = <span class="keyword">await</span> <span class="keyword">this</span>.<span class="function">getSimilarMarkets</span>();

    <span class="keyword">for</span> (<span class="keyword">const</span> pair <span class="keyword">of</span> markets) {
      <span class="keyword">const</span> spread = <span class="keyword">await</span> <span class="keyword">this</span>.<span class="function">calculateSpread</span>(pair);

      <span class="keyword">if</span> (spread > <span class="keyword">this</span>.minSpread) {
        <span class="keyword">await</span> <span class="keyword">this</span>.<span class="function">executeArbitrage</span>(pair, spread);
      }
    }
  }

  <span class="keyword">async</span> <span class="function">getSimilarMarkets</span>() {
    <span class="comment">// Implementation</span>
    <span class="keyword">return</span> [];
  }

  <span class="keyword">async</span> <span class="function">calculateSpread</span>(pair: <span class="class-name">any</span>) {
    <span class="comment">// Calculate price difference</span>
    <span class="keyword">return</span> <span class="number">0</span>;
  }

  <span class="keyword">async</span> <span class="function">executeArbitrage</span>(pair: <span class="class-name">any</span>, spread: <span class="class-name">number</span>) {
    console.log(<span class="string">\`Executing arbitrage: \${spread}\`</span>);
  }
}

<span class="keyword">const</span> bot = <span class="keyword">new</span> <span class="class-name">ArbitrageBot</span>();
bot.<span class="function">run</span>();`;
    } else {
        return `<span class="keyword">import</span> { ClobClient } <span class="keyword">from</span> <span class="string">'@polymarket/clob-client'</span>;

<span class="keyword">class</span> <span class="class-name">TradingBot</span> {
  <span class="keyword">private</span> client: ClobClient;

  <span class="keyword">constructor</span>() {
    <span class="keyword">this</span>.client = <span class="keyword">new</span> <span class="class-name">ClobClient</span>({
      apiKey: process.env.POLYMARKET_API_KEY,
      secret: process.env.POLYMARKET_SECRET,
      passphrase: process.env.POLYMARKET_PASSPHRASE
    });
  }

  <span class="keyword">async</span> <span class="function">run</span>() {
    console.log(<span class="string">'Trading bot started'</span>);

    <span class="comment">// Implement your strategy</span>
    <span class="keyword">const</span> market = <span class="keyword">await</span> <span class="keyword">this</span>.client.<span class="function">getMarket</span>(marketId);
    <span class="keyword">await</span> <span class="keyword">this</span>.<span class="function">executeStrategy</span>(market);
  }

  <span class="keyword">async</span> <span class="function">executeStrategy</span>(market: <span class="class-name">any</span>) {
    <span class="comment">// Your trading logic</span>
  }
}

<span class="keyword">const</span> bot = <span class="keyword">new</span> <span class="class-name">TradingBot</span>();
bot.<span class="function">run</span>();`;
    }
}

function showCode(codeHTML) {
    const codeContent = document.getElementById('codeContent');
    codeContent.innerHTML = `
        <div class="code-editor">
            <pre><code id="codeBlock">${codeHTML}</code></pre>
        </div>
    `;
}

function useExample(button) {
    document.getElementById('chatInput').value = button.textContent;
    sendMessage();
}

function handleChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

let statusAnimationInterval = null;

function updateStatus(text, isGenerating) {
    const statusText = document.querySelector('.status-text');
    const statusIndicator = document.querySelector('.status-indicator');

    // Stop any existing animation
    if (statusAnimationInterval) {
        clearInterval(statusAnimationInterval);
        statusAnimationInterval = null;
    }

    statusText.classList.remove('animated');
    statusText.textContent = text;

    if (isGenerating) {
        statusIndicator.classList.add('generating');
    } else {
        statusIndicator.classList.remove('generating');
    }
}

function updateStatusAnimated(words) {
    const statusText = document.querySelector('.status-text');
    const statusIndicator = document.querySelector('.status-indicator');

    // Stop any existing animation
    if (statusAnimationInterval) {
        clearInterval(statusAnimationInterval);
    }

    statusText.classList.add('animated');
    statusIndicator.classList.add('generating');

    let currentIndex = 0;

    function showNextWord() {
        statusText.innerHTML = `<span class="status-word">${words[currentIndex]}</span>`;
        currentIndex = (currentIndex + 1) % words.length;
    }

    // Show first word immediately
    showNextWord();

    // Rotate through words every 2.5 seconds
    statusAnimationInterval = setInterval(showNextWord, 2500);
}

function stopStatusAnimation() {
    if (statusAnimationInterval) {
        clearInterval(statusAnimationInterval);
        statusAnimationInterval = null;
    }
    const statusText = document.querySelector('.status-text');
    if (statusText) {
        statusText.classList.remove('animated');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Top bar functions
function saveDraft() {
    saveChats();
    alert('Draft saved!');
}

function exportBot() {
    const chat = getCurrentChat();
    if (!chat || !chat.code) {
        alert('No bot code to export. Create a bot first!');
        return;
    }

    const botName = document.getElementById('botName').value || 'Untitled Bot';
    alert(`Exporting "${botName}"...\n\nYour bot will be downloaded as a complete project with:\n- TypeScript source code\n- Environment template\n- README and documentation\n- Docker configuration\n\n(Full export feature coming soon)`);
}

function openAccount() {
    window.location.href = 'account.html';
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

// Autosave functionality
let lastSaveTime = Date.now();
let autosaveInterval = null;

function startAutosave() {
    if (autosaveInterval) return;

    // Autosave every 90 seconds (1.5 minutes)
    autosaveInterval = setInterval(() => {
        if (currentChatId) {
            saveChats();
            lastSaveTime = Date.now();
            updateAutosaveStatus();
        }
    }, 90000);

    // Update status text every 30 seconds
    setInterval(updateAutosaveStatus, 30000);
}

function updateAutosaveStatus() {
    const statusEl = document.getElementById('autosaveStatus');
    if (!statusEl) return;

    const elapsed = Date.now() - lastSaveTime;
    const minutes = Math.floor(elapsed / 60000);

    if (minutes === 0) {
        statusEl.textContent = 'Last saved just now';
    } else if (minutes === 1) {
        statusEl.textContent = 'Last saved 1 min ago';
    } else {
        statusEl.textContent = `Last saved ${minutes} mins ago`;
    }
}

// Initialize autosave on load
startAutosave();

// Code panel functions
function switchTab(tab) {
    const tabs = document.querySelectorAll('.header-tabs .tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'preview') {
        alert('Preview tab coming soon! This will show a visual representation of your bot\'s strategy.');
    }
}

function copyCode() {
    const code = document.getElementById('codeBlock')?.textContent;
    if (!code) {
        alert('No code to copy yet!');
        return;
    }

    navigator.clipboard.writeText(code);

    // Visual feedback
    const btn = event.target.closest('.btn-icon');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l3 3 7-7"/></svg>';
    setTimeout(() => {
        btn.innerHTML = originalContent;
    }, 1500);
}

// Update bot name
document.getElementById('botName')?.addEventListener('blur', function() {
    const chat = getCurrentChat();
    if (chat && this.value.trim()) {
        chat.title = this.value.trim();
        saveChats();
        loadChats();
    }
});

// Right pane tab switching
function switchRightTab(tabName) {
    // Update toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-option');
    toggleButtons.forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Update tab content
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    if (tabName === 'summary') {
        document.getElementById('summaryTab').classList.add('active');
    } else if (tabName === 'market') {
        document.getElementById('marketTab').classList.add('active');
    } else if (tabName === 'code') {
        document.getElementById('codeTab').classList.add('active');
    }
}

// Recommended messages functionality
function updateRecommendedMessages() {
    const container = document.getElementById('recommendedMessages');
    if (!container) return;

    const chat = getCurrentChat();
    if (!chat || chat.messages.length === 0) {
        // Show initial recommendations
        const initialRecommendations = [
            "Create an arbitrage bot",
            "Build a market maker with 2% spread",
            "Make a news-driven bot",
            "Set up a momentum trading strategy"
        ];
        container.innerHTML = initialRecommendations.map(text => 
            `<span class="recommended-chip" onclick="useRecommendation('${text}')">${text}</span>`
        ).join('');
    } else {
        // Context-based recommendations
        const lastMessage = chat.messages[chat.messages.length - 1];
        if (lastMessage.type === 'assistant') {
            const contextualRecommendations = [
                "Adjust the risk parameters",
                "Add more entry rules",
                "Set up exit conditions",
                "Configure position sizing"
            ];
            container.innerHTML = contextualRecommendations.map(text => 
                `<span class="recommended-chip" onclick="useRecommendation('${text}')">${text}</span>`
            ).join('');
        }
    }
}

function useRecommendation(text) {
    document.getElementById('chatInput').value = text;
    document.getElementById('chatInput').focus();
}

// Update recommendations when chat changes
const originalSendMessage = sendMessage;
sendMessage = function() {
    originalSendMessage();
    setTimeout(updateRecommendedMessages, 100);
};

const originalSwitchChat = switchChat;
switchChat = function(chatId) {
    originalSwitchChat(chatId);
    updateRecommendedMessages();
};

// Welcome screen functions
function showWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const chatMessages = document.getElementById('chatMessages');
    const inputContainer = document.querySelector('.chat-input-container');
    const recommendedMessages = document.getElementById('recommendedMessages');
    const builderContainer = document.querySelector('.builder-container');
    const topbar = document.querySelector('.builder-topbar');

    if (welcomeScreen) welcomeScreen.classList.remove('hidden');
    if (chatMessages) chatMessages.style.display = 'none';
    if (inputContainer) inputContainer.style.display = 'none';
    if (recommendedMessages) recommendedMessages.style.display = 'none';
    if (builderContainer) builderContainer.classList.add('welcome-active');
    if (topbar) topbar.classList.add('welcome-active');
}

function hideWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const chatMessages = document.getElementById('chatMessages');
    const inputContainer = document.querySelector('.chat-input-container');
    const recommendedMessages = document.getElementById('recommendedMessages');
    const builderContainer = document.querySelector('.builder-container');
    const topbar = document.querySelector('.builder-topbar');

    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (chatMessages) chatMessages.style.display = 'flex';
    if (inputContainer) inputContainer.style.display = 'flex';
    if (recommendedMessages) recommendedMessages.style.display = 'flex';
    if (builderContainer) builderContainer.classList.remove('welcome-active');
    if (topbar) topbar.classList.remove('welcome-active');
}

function handleWelcomeKeydown(event) {
    const dropdown = document.getElementById('welcomeMarketDropdown');
    const isDropdownVisible = dropdown.classList.contains('visible');

    // Handle keyboard navigation when dropdown is visible
    if (isDropdownVisible && welcomeDropdownResults.length > 0) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            welcomeDropdownActiveIndex = Math.min(welcomeDropdownActiveIndex + 1, welcomeDropdownResults.length - 1);
            updateWelcomeDropdownHighlight();
            return;
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            welcomeDropdownActiveIndex = Math.max(welcomeDropdownActiveIndex - 1, -1);
            updateWelcomeDropdownHighlight();
            return;
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (welcomeDropdownActiveIndex >= 0) {
                // Select the highlighted item
                const selectedMarket = welcomeDropdownResults[welcomeDropdownActiveIndex];
                selectMarket(selectedMarket.question, selectedMarket.id);
            } else if (welcomeDropdownResults.length > 0) {
                // Select the first item if nothing is highlighted
                const firstMarket = welcomeDropdownResults[0];
                selectMarket(firstMarket.question, firstMarket.id);
            } else {
                sendFromWelcome();
            }
            return;
        } else if (event.key === 'Escape') {
            event.preventDefault();
            dropdown.classList.remove('visible');
            dropdown.innerHTML = '';
            welcomeDropdownResults = [];
            welcomeDropdownActiveIndex = -1;
            return;
        }
    }

    // Default behavior: send on Enter
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendFromWelcome();
    }
}

function updateWelcomeDropdownHighlight() {
    const dropdown = document.getElementById('welcomeMarketDropdown');
    const cards = dropdown.querySelectorAll('.market-search-card');

    cards.forEach((card, index) => {
        if (index === welcomeDropdownActiveIndex) {
            card.classList.add('keyboard-active');
            card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            card.classList.remove('keyboard-active');
        }
    });
}

function handleWelcomePaste(event) {
    // Get pasted text
    setTimeout(() => {
        const input = event.target;
        const pastedText = input.value;

        // Check if it's a Polymarket link
        if (pastedText.includes('polymarket.com') && pastedText.includes('event')) {
            // Extract slug and immediately search
            const slug = extractSlugFromUrl(pastedText);
            if (slug) {
                const dropdown = document.getElementById('welcomeMarketDropdown');
                dropdown.innerHTML = '<div class="market-search-loading">Loading market from link...</div>';
                dropdown.classList.add('visible');

                // Cancel any inflight requests
                if (searchAbortController) {
                    searchAbortController.abort();
                }
                searchAbortController = new AbortController();

                searchBySlug(slug, dropdown, searchAbortController.signal).catch(error => {
                    if (error.name !== 'AbortError') {
                        console.error('Error loading market from link:', error);
                        dropdown.innerHTML = '<div class="market-search-error">Invalid Polymarket link. Please check the URL and try again.</div>';
                    }
                });
            }
        }
    }, 10);
}

function handleWelcomeClickOutside(event) {
    const dropdown = document.getElementById('welcomeMarketDropdown');
    const input = document.getElementById('welcomeInput');
    const inputContainer = document.querySelector('.welcome-input-container');

    if (!dropdown || !input || !inputContainer) return;

    // Check if click is outside the input container
    if (!inputContainer.contains(event.target)) {
        dropdown.classList.remove('visible');
        welcomeDropdownActiveIndex = -1;
    }
}

function sendFromWelcome() {
    const input = document.getElementById('welcomeInput');
    const message = input.value.trim();

    if (!message) return;

    // Transfer message to main chat input and send
    document.getElementById('chatInput').value = message;
    input.value = '';

    sendMessage();
}

function useWelcomeExample(button) {
    const text = button.textContent;
    document.getElementById('welcomeInput').value = text;
    document.getElementById('welcomeInput').focus();
}

// Scroll to bottom functionality
function scrollChatToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
        hideScrollButton();
    }
}

function showScrollButton() {
    const scrollBtn = document.getElementById('scrollToBottom');
    if (scrollBtn) {
        scrollBtn.style.display = 'flex';
        setTimeout(() => scrollBtn.classList.add('visible'), 10);
    }
}

function hideScrollButton() {
    const scrollBtn = document.getElementById('scrollToBottom');
    if (scrollBtn) {
        scrollBtn.classList.remove('visible');
        setTimeout(() => scrollBtn.style.display = 'none', 200);
    }
}

// Check if user has scrolled up
document.getElementById('chatMessages')?.addEventListener('scroll', function() {
    const isAtBottom = this.scrollHeight - this.scrollTop <= this.clientHeight + 50;
    const scrollBtn = document.getElementById('scrollToBottom');

    if (isAtBottom) {
        if (scrollBtn) {
            scrollBtn.classList.remove('visible');
            setTimeout(() => scrollBtn.style.display = 'none', 200);
        }
    } else {
        if (scrollBtn) {
            scrollBtn.style.display = 'flex';
            setTimeout(() => scrollBtn.classList.add('visible'), 10);
        }
    }
});

// Run quick guide function
function runQuickGuide() {
    alert('Quick Guide:\n\n1. Describe your trading strategy\n2. Answer the setup questions\n3. Review generated code\n4. Export your bot\n5. Deploy and monitor\n\nNeed help? Check the documentation or contact support.');
}

// Trending market selection
function selectTrendingMarket(element) {
    const marketName = element.getAttribute('data-market');

    // Create new chat if needed
    let chat = getCurrentChat();
    if (!chat || chat.messages.length > 0) {
        newChat();
        chat = getCurrentChat();
    }

    // Hide welcome screen and show chat
    hideWelcomeScreen();

    // Add assistant message prompting for bot description
    const promptMessage = `Great! I see you're interested in "${marketName}". Now describe the type of bot you want to build for this market. Be as specific as possible about your strategy, goals, and any particular features you need.`;
    chat.messages.push({ type: 'assistant', text: promptMessage });
    addMessageToDOM(promptMessage, 'assistant');
    saveChats();

    // Focus on chat input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.focus();
    }
}

// Polymarket Gamma API Integration (via CORS proxy)
const GAMMA_API_PROXY = '/api/polymarket';
let searchTimeout = null;
let searchAbortController = null;
let welcomeDropdownActiveIndex = -1;
let welcomeDropdownResults = [];

async function searchWelcomeMarkets(query) {
    const dropdown = document.getElementById('welcomeMarketDropdown');

    if (!query || query.trim().length < 2) {
        dropdown.classList.remove('visible');
        dropdown.innerHTML = '';
        welcomeDropdownResults = [];
        welcomeDropdownActiveIndex = -1;
        return;
    }

    // Cancel any inflight requests
    if (searchAbortController) {
        searchAbortController.abort();
    }
    searchAbortController = new AbortController();

    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        try {
            // Show loading state
            dropdown.innerHTML = '<div class="market-search-loading">Searching markets...</div>';
            dropdown.classList.add('visible');

            // Check if it's a Polymarket link
            if (query.includes('polymarket.com')) {
                // Extract slug from URL and search for it
                const slug = extractSlugFromUrl(query);
                if (slug) {
                    await searchBySlug(slug, dropdown, searchAbortController.signal);
                    return;
                }
            }

            // Search by keyword
            await searchByKeyword(query, dropdown, searchAbortController.signal);
        } catch (error) {
            if (error.name === 'AbortError') {
                // Request was cancelled, ignore
                return;
            }
            console.error('Market search error:', error);
            dropdown.innerHTML = '<div class="market-search-error">Unable to fetch markets. Please try again.</div>';
            dropdown.classList.add('visible');
        }
    }, 250);
}

function extractSlugFromUrl(url) {
    const match = url.match(/polymarket\.com\/event\/([^/?]+)/);
    return match ? match[1] : null;
}

async function searchBySlug(slug, dropdown, signal) {
    const response = await fetch(`${GAMMA_API_PROXY}?path=/events&slug=${slug}`, { signal });
    const data = await response.json();

    if (data && data.length > 0) {
        displayMarketResults([data[0]], dropdown);
    } else {
        welcomeDropdownResults = [];
        dropdown.innerHTML = '<div class="market-search-empty">No market found with that link.</div>';
        dropdown.classList.add('visible');
    }
}

async function searchByKeyword(query, dropdown, signal) {
    // Search active markets
    const response = await fetch(`${GAMMA_API_PROXY}?path=/markets&limit=10&active=true&closed=false`, { signal });
    const data = await response.json();

    if (!data || data.length === 0) {
        welcomeDropdownResults = [];
        dropdown.innerHTML = '<div class="market-search-empty">No active markets found.</div>';
        dropdown.classList.add('visible');
        return;
    }

    // Filter by query
    const queryLower = query.toLowerCase();
    const filtered = data.filter(market =>
        market.question?.toLowerCase().includes(queryLower) ||
        market.description?.toLowerCase().includes(queryLower)
    ).slice(0, 8);

    if (filtered.length > 0) {
        displayMarketResults(filtered, dropdown);
    } else {
        welcomeDropdownResults = [];
        dropdown.innerHTML = '<div class="market-search-empty">No markets match your search.</div>';
        dropdown.classList.add('visible');
    }
}

function displayMarketResults(markets, dropdown) {
    welcomeDropdownResults = markets;
    welcomeDropdownActiveIndex = -1;
    let html = '';

    markets.forEach((market, index) => {
        const endDate = market.endDate ? new Date(market.endDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) : 'TBD';

        const volume = market.volume ? formatVolume(market.volume) : 'N/A';
        const liquidity = market.liquidity ? parseFloat(market.liquidity) > 1000 : false;
        const liquidityBadge = liquidity ? '<span class="market-liquidity-badge yes">High Liquidity</span>' : '<span class="market-liquidity-badge no">Low Liquidity</span>';

        const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : null;
        const priceDisplay = prices && prices.length > 0 ? `${(parseFloat(prices[0]) * 100).toFixed(0)}¢ Yes` : '';

        html += `
            <div class="market-search-card" data-index="${index}" onclick="selectMarket('${escapeHtml(market.question)}', '${market.id}')">
                <div class="market-card-header">
                    <div class="market-card-title">${escapeHtml(market.question)}</div>
                    ${priceDisplay ? `<div class="market-card-price">${priceDisplay}</div>` : ''}
                </div>
                <div class="market-card-meta">
                    <span class="market-card-date">Ends ${endDate}</span>
                    <span class="market-card-volume">${volume} vol</span>
                    ${liquidityBadge}
                </div>
                <button class="market-card-select" onclick="event.stopPropagation(); selectMarket('${escapeHtml(market.question)}', '${market.id}')">
                    Select Market
                </button>
            </div>
        `;
    });

    dropdown.innerHTML = html;
    dropdown.classList.add('visible');
}

function formatVolume(volume) {
    const num = parseFloat(volume);
    if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
        return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toFixed(0)}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function selectMarket(marketName, marketId) {
    const dropdown = document.getElementById('welcomeMarketDropdown');
    const welcomeInput = document.getElementById('welcomeInput');

    dropdown.classList.remove('visible');
    dropdown.innerHTML = '';
    welcomeDropdownResults = [];
    welcomeDropdownActiveIndex = -1;

    // Clear the welcome input
    if (welcomeInput) {
        welcomeInput.value = '';
    }

    // Create new chat if needed
    let chat = getCurrentChat();
    if (!chat || chat.messages.length > 0) {
        newChat();
        chat = getCurrentChat();
    }

    // Hide welcome screen and show chat
    hideWelcomeScreen();

    // Add assistant message prompting for bot description
    const promptMessage = `Perfect! I see you've selected "${marketName}". Now tell me about the bot you want to build for this market. Describe your strategy, trading approach, risk tolerance, and any specific features you'd like to include.`;
    chat.messages.push({ type: 'assistant', text: promptMessage });
    addMessageToDOM(promptMessage, 'assistant');
    saveChats();

    // Focus on chat input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.focus();
    }
}

// Trending Markets Carousel
let currentSlide = 0;
let carouselInterval = null;

function goToSlide(index) {
    const track = document.getElementById('trendingCarouselTrack');
    const dots = document.querySelectorAll('.carousel-dot');

    if (!track || !dots.length) return;

    currentSlide = index;
    // Slides are 84% width to show partial adjacent cards
    track.style.transform = `translateX(-${currentSlide * 84}%)`;

    dots.forEach((dot, i) => {
        if (i === currentSlide) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function nextSlide() {
    const totalSlides = 3;
    currentSlide = (currentSlide + 1) % totalSlides;
    goToSlide(currentSlide);
}

function prevSlide() {
    const totalSlides = 3;
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    goToSlide(currentSlide);
    restartCarousel();
}

function nextSlideManual() {
    nextSlide();
    restartCarousel();
}

function restartCarousel() {
    stopCarousel();
    startCarousel();
}

function startCarousel() {
    // Auto-advance every 4 seconds
    carouselInterval = setInterval(nextSlide, 4000);
}

function stopCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

// Initialize carousel on page load
window.addEventListener('load', () => {
    startCarousel();

    // Add paste detection for welcome input
    const welcomeInput = document.getElementById('welcomeInput');
    if (welcomeInput) {
        welcomeInput.addEventListener('paste', handleWelcomePaste);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', handleWelcomeClickOutside);
});

// Pause on hover, resume on mouse leave
document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.trending-carousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', stopCarousel);
        carousel.addEventListener('mouseleave', startCarousel);
    }
});

// Market search functionality
const mockMarkets = [
    { title: "Will Trump win 2024 election?", price: "0.54", volume: "$2.3M", liquidity: "High" },
    { title: "Bitcoin above $100K by March 2026?", price: "0.67", volume: "$890K", liquidity: "Medium" },
    { title: "Fed rate cut in February 2026?", price: "0.12", volume: "$456K", liquidity: "Medium" },
    { title: "S&P 500 new ATH this month?", price: "0.78", volume: "$623K", liquidity: "High" },
    { title: "Ethereum above $5K by April?", price: "0.43", volume: "$334K", liquidity: "Medium" },
    { title: "Tesla stock above $300 by June?", price: "0.38", volume: "$278K", liquidity: "Low" },
    { title: "Recession in 2026?", price: "0.23", volume: "$1.1M", liquidity: "High" },
    { title: "Apple releases AI product in Q1?", price: "0.65", volume: "$445K", liquidity: "Medium" }
];

function showMarketSearch() {
    const container = document.getElementById('marketSearchContainer');
    const recommendedMessages = document.getElementById('recommendedMessages');
    if (container) {
        container.style.display = 'block';
        // Don't show dropdown until user starts typing
    }
    if (recommendedMessages) {
        recommendedMessages.style.display = 'none';
    }
}

function hideMarketSearch() {
    const container = document.getElementById('marketSearchContainer');
    const recommendedMessages = document.getElementById('recommendedMessages');
    if (container) container.style.display = 'none';
    if (recommendedMessages) recommendedMessages.style.display = 'flex';
}

function searchMarkets(query) {
    const dropdown = document.getElementById('marketDropdown');
    if (!dropdown) return;

    // Only show dropdown if user has typed something
    if (query.trim() === '') {
        dropdown.classList.remove('visible');
        return;
    }

    const filtered = mockMarkets.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));

    if (filtered.length === 0) {
        dropdown.innerHTML = '<div class="market-dropdown-item" style="cursor: default;"><div class="market-item-title">No markets found</div></div>';
        dropdown.classList.add('visible');
        return;
    }

    dropdown.innerHTML = filtered.map(market => `
        <div class="market-dropdown-item" onclick="selectMarket('${market.title.replace(/'/g, "\\'")}', '${market.price}', '${market.volume}')">
            <div class="market-item-title">${market.title}</div>
            <div class="market-item-stats">
                <span class="market-item-price">${market.price}</span>
                <span>Vol: ${market.volume}</span>
                <span>Liq: ${market.liquidity}</span>
            </div>
        </div>
    `).join('');

    dropdown.classList.add('visible');
}

function selectMarket(title, price, volume) {
    const input = document.getElementById('marketSearchInput');
    const chatInput = document.getElementById('chatInput');

    if (input) input.value = title;
    if (chatInput) chatInput.value = title;

    // Hide dropdown
    const dropdown = document.getElementById('marketDropdown');
    if (dropdown) dropdown.classList.remove('visible');

    // Hide market search and send message
    hideMarketSearch();
    setTimeout(() => sendMessage(), 100);
}

// Inline market search handlers
function searchInlineMarkets(query) {
    const dropdown = document.getElementById('inlineMarketDropdown');
    if (!dropdown) return;

    // Only show dropdown if user has typed something
    if (query.trim() === '') {
        dropdown.classList.remove('visible');
        dropdown.innerHTML = '';
        return;
    }

    const filtered = mockMarkets.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));

    if (filtered.length === 0) {
        dropdown.innerHTML = '<div class="inline-market-item" style="cursor: default;"><div class="market-item-title">No markets found</div></div>';
        dropdown.classList.add('visible');
        return;
    }

    dropdown.innerHTML = filtered.map(market => `
        <div class="inline-market-item" onclick="selectInlineMarket('${market.title.replace(/'/g, "\\'")}')">
            <div class="market-item-title">${market.title}</div>
            <div class="market-item-stats">
                <span class="market-item-price">${market.price}</span>
                <span>Vol: ${market.volume}</span>
                <span>Liq: ${market.liquidity}</span>
            </div>
        </div>
    `).join('');

    dropdown.classList.add('visible');
}

function selectInlineMarket(title) {
    const input = document.getElementById('inlineMarketSearch');
    if (input) input.value = title;

    const dropdown = document.getElementById('inlineMarketDropdown');
    if (dropdown) {
        dropdown.classList.remove('visible');
        dropdown.innerHTML = '';
    }

    // Auto-submit after selection
    document.getElementById('chatInput').value = title;
    sendMessage();
}

function submitMarketSearch() {
    const input = document.getElementById('inlineMarketSearch');
    if (!input || !input.value.trim()) {
        return;
    }

    document.getElementById('chatInput').value = input.value;
    sendMessage();
}

function handleInlineMarketKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        submitMarketSearch();
    }
}

// Inline form submission handlers
function submitMarketConfirm() {
    const select = document.getElementById('marketConfirm');
    if (!select || !select.value) {
        alert('Please select an option');
        return;
    }
    const value = select.value === 'yes' ? 'Yes, use this market' : 'No, search for another';
    document.getElementById('chatInput').value = value;
    sendMessage();
}

function submitRiskManagement() {
    const maxPosition = document.getElementById('maxPosition');
    const dailyLoss = document.getElementById('dailyLossLimit');

    if (!maxPosition?.value || !dailyLoss?.value) {
        alert('Please fill in all fields');
        return;
    }

    const message = `Max position: $${maxPosition.value}, Daily loss limit: $${dailyLoss.value}`;
    document.getElementById('chatInput').value = message;
    sendMessage();
}

function submitTradingFrequency() {
    const select = document.getElementById('tradingFrequency');
    if (!select || !select.value) {
        alert('Please select a frequency');
        return;
    }

    const frequencies = {
        '10': 'Every 10 seconds',
        '30': 'Every 30 seconds',
        '60': 'Every 1 minute',
        '300': 'Every 5 minutes'
    };

    const message = frequencies[select.value] || select.value;
    document.getElementById('chatInput').value = message;
    sendMessage();
}

function submitOrderType() {
    const select = document.getElementById('orderType');
    if (!select || !select.value) {
        alert('Please select an order type');
        return;
    }

    const types = {
        'market': 'Market orders',
        'limit': 'Limit orders',
        'threshold': 'Threshold-based execution'
    };

    const message = types[select.value] || select.value;
    document.getElementById('chatInput').value = message;
    sendMessage();
}

// Initialize recommendations on load
window.addEventListener('load', () => {
    setTimeout(updateRecommendedMessages, 500);

    // Show welcome screen if chat is empty
    const chat = getCurrentChat();
    if (!chat || chat.messages.length === 0) {
        showWelcomeScreen();
    } else {
        hideWelcomeScreen();
    }
});

// Question Modal State
let currentQuestions = [];
let currentQuestionIndex = 0;
let questionAnswers = {};

function showQuestionModal(questions) {
    currentQuestions = questions;
    currentQuestionIndex = 0;
    questionAnswers = {};
    
    const overlay = document.getElementById('questionModalOverlay');
    overlay.classList.add('active');
    
    renderQuestion();
    updateProgress();
}

function hideQuestionModal() {
    const overlay = document.getElementById('questionModalOverlay');
    overlay.classList.remove('active');
}

function renderQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    const body = document.getElementById('questionModalBody');

    let html = `<div class="question-title">${escapeHtml(question.question)}</div>`;

    if (question.type === 'single') {
        // Radio buttons
        question.options.forEach((option, idx) => {
            const checked = questionAnswers[currentQuestionIndex] === option.label ? 'checked' : '';
            const selected = checked ? 'selected' : '';
            html += `
                <label class="question-option ${selected}" data-question-idx="${currentQuestionIndex}" data-option-value="${escapeHtml(option.label)}" data-question-type="single">
                    <input type="radio" name="q${currentQuestionIndex}" value="${escapeHtml(option.label)}" ${checked}>
                    <div class="question-option-content">
                        <span class="question-option-label">${escapeHtml(option.label)}</span>
                        <span class="question-option-description">${escapeHtml(option.description)}</span>
                    </div>
                </label>
            `;
        });
    } else if (question.type === 'multiple') {
        // Checkboxes
        const answers = questionAnswers[currentQuestionIndex] || [];
        question.options.forEach((option, idx) => {
            const checked = answers.includes(option.label) ? 'checked' : '';
            const selected = checked ? 'selected' : '';
            html += `
                <label class="question-option ${selected}" data-question-idx="${currentQuestionIndex}" data-option-value="${escapeHtml(option.label)}" data-question-type="multiple">
                    <input type="checkbox" value="${escapeHtml(option.label)}" ${checked}>
                    <div class="question-option-content">
                        <span class="question-option-label">${escapeHtml(option.label)}</span>
                        <span class="question-option-description">${escapeHtml(option.description)}</span>
                    </div>
                </label>
            `;
        });
    } else if (question.type === 'text' || question.type === 'number') {
        // Text input
        const value = questionAnswers[currentQuestionIndex] || '';
        html += `
            <input
                type="${question.type}"
                class="question-text-input"
                id="textInput${currentQuestionIndex}"
                placeholder="${question.placeholder || 'Enter your answer'}"
                value="${escapeHtml(value)}"
                oninput="updateTextAnswer(${currentQuestionIndex}, this.value)"
            />
        `;
    }

    body.innerHTML = html;

    // Attach change event listeners to the actual input elements
    const radioInputs = body.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
        input.addEventListener('change', function() {
            const questionIdx = currentQuestionIndex;
            const value = this.value;
            questionAnswers[questionIdx] = value;
            renderQuestion();
        });
    });

    const checkboxInputs = body.querySelectorAll('input[type="checkbox"]');
    checkboxInputs.forEach(input => {
        input.addEventListener('change', function() {
            const questionIdx = currentQuestionIndex;
            const value = this.value;
            if (!questionAnswers[questionIdx]) {
                questionAnswers[questionIdx] = [];
            }
            const answers = questionAnswers[questionIdx];
            if (this.checked) {
                if (!answers.includes(value)) {
                    answers.push(value);
                }
            } else {
                const idx = answers.indexOf(value);
                if (idx > -1) {
                    answers.splice(idx, 1);
                }
            }
            renderQuestion();
        });
    });

    // Also add click listeners to labels to make the whole card clickable
    const options = body.querySelectorAll('.question-option');
    options.forEach(option => {
        option.addEventListener('click', function(e) {
            // Only handle clicks on the label itself, not on the input
            if (e.target.tagName === 'INPUT') {
                return; // Let the input handle it
            }

            // Find the input inside this label and trigger it
            const input = this.querySelector('input');
            if (input) {
                input.click();
            }
        });
    });

    updateProgress();
    updateButtons();
}

function selectOption(questionIdx, value, type) {
    questionAnswers[questionIdx] = value;
    // Re-render to update selected state
    renderQuestion();
}

function toggleOption(questionIdx, value) {
    if (!questionAnswers[questionIdx]) {
        questionAnswers[questionIdx] = [];
    }
    const answers = questionAnswers[questionIdx];
    const idx = answers.indexOf(value);
    if (idx > -1) {
        answers.splice(idx, 1);
    } else {
        answers.push(value);
    }
    renderQuestion();
}

function updateTextAnswer(questionIdx, value) {
    questionAnswers[questionIdx] = value;
    updateButtons();
}

function updateProgress() {
    const progressContainer = document.getElementById('questionProgress');
    let html = '';
    for (let i = 0; i < currentQuestions.length; i++) {
        let className = 'progress-dot';
        if (i < currentQuestionIndex) className += ' completed';
        if (i === currentQuestionIndex) className += ' active';
        html += `<div class="${className}"></div>`;
    }
    progressContainer.innerHTML = html;
}

function updateButtons() {
    const backBtn = document.getElementById('modalBackBtn');
    const nextBtn = document.getElementById('modalNextBtn');
    
    // Disable back on first question
    backBtn.disabled = currentQuestionIndex === 0;
    
    // Check if current question is answered
    const hasAnswer = questionAnswers[currentQuestionIndex] !== undefined && 
                     questionAnswers[currentQuestionIndex] !== '' &&
                     (Array.isArray(questionAnswers[currentQuestionIndex]) ? 
                      questionAnswers[currentQuestionIndex].length > 0 : true);
    
    nextBtn.disabled = !hasAnswer;
    
    // Change button text on last question
    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.textContent = 'Finish';
    } else {
        nextBtn.textContent = 'Next';
    }
}

function handleModalBack() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function handleModalNext() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        // Finished all questions
        finishQuestions();
    }
}

function finishQuestions() {
    hideQuestionModal();
    
    // Format answers and send to AI
    let answerText = 'Here are my answers:\n\n';
    currentQuestions.forEach((q, idx) => {
        const answer = questionAnswers[idx];
        let answerStr = answer;
        if (Array.isArray(answer)) {
            answerStr = answer.join(', ');
        }
        answerText += `${q.question}\nAnswer: ${answerStr}\n\n`;
    });
    
    // Send answers back to continue bot building
    const chat = getCurrentChat();
    if (chat) {
        chat.messages.push({ type: 'user', text: answerText });
        addMessageToDOM(answerText, 'user');
        saveChats();
        
        // Exit plan mode and generate code
        chat.planMode = false;
        document.querySelector('.strategy-pane')?.classList.remove('plan-mode');
        document.querySelector('.builder-container')?.classList.remove('plan-mode');

        // Show animated generating status
        updateStatusAnimated(['Building', 'Coding', 'Generating', 'Crafting', 'Compiling', 'Creating']);

        // Generate AI response to create the bot
        generateAIResponse(chat, 'Please generate the complete bot code based on my answers above.').then(response => {
            chat.messages.push({ type: 'assistant', text: response });
            addMessageToDOM(response, 'assistant');

            const code = generateBotCode(answerText);
            chat.code = code;
            showCode(code);

            saveChats();
            stopStatusAnimation();
            updateStatus('Ready', false);
        }).catch(error => {
            console.error('Error generating bot code:', error);
            stopStatusAnimation();
            updateStatus('Error generating code', false);
        });
    }
}

// Parse questions from AI response
function parseQuestionsFromResponse(response) {
    try {
        // Try to find JSON in the response
        const jsonMatch = response.match(/\{[\s\S]*"questions"[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return data.questions || [];
        }
    } catch (e) {
        console.error('Failed to parse questions:', e);
    }
    return null;
}
