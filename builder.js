// Check authentication
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = 'index.html';
}

// Initialize
let chats = JSON.parse(localStorage.getItem('chats') || '[]');
let currentChatId = localStorage.getItem('currentChatId');
let currentContextMenuChatId = null;

// Load chats on startup
window.addEventListener('load', () => {
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
        createdAt: Date.now()
    };

    chats.unshift(newChat);
    saveChats();
    loadChats();
    switchChat(chatId);

    // Clear chat area and show welcome
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <h2>Build Your Polymarket Trading Bot</h2>
            <p>Describe your trading strategy in plain English. I'll generate the code for you.</p>
            <div class="example-prompts">
                <button class="example-prompt" onclick="useExample(this)">Create an arbitrage bot that monitors similar markets</button>
                <button class="example-prompt" onclick="useExample(this)">Build a market maker with 2% spread</button>
                <button class="example-prompt" onclick="useExample(this)">Make a news-driven bot for election markets</button>
            </div>
        </div>
    `;

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
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <h2>Build Your Polymarket Trading Bot</h2>
                <p>Describe your trading strategy in plain English. I'll generate the code for you.</p>
                <div class="example-prompts">
                    <button class="example-prompt" onclick="useExample(this)">Create an arbitrage bot that monitors similar markets</button>
                    <button class="example-prompt" onclick="useExample(this)">Build a market maker with 2% spread</button>
                    <button class="example-prompt" onclick="useExample(this)">Make a news-driven bot for election markets</button>
                </div>
            </div>
        `;
    } else {
        chatMessages.innerHTML = '';
        chat.messages.forEach(msg => {
            addMessageToDOM(msg.text, msg.type);
        });
    }

    // Load code if exists
    if (chat.code) {
        showCode(chat.code);
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

    // Show generating status
    updateStatus('Generating code...', true);

    // Simulate AI response
    setTimeout(() => {
        const response = generateResponse(message);
        chat.messages.push({ type: 'assistant', text: response });
        addMessageToDOM(response, 'assistant');

        const code = generateBotCode(message);
        chat.code = code;
        showCode(code);

        saveChats();
        updateStatus('Ready', false);
    }, 2000);
}

function addMessageToDOM(text, type) {
    const messagesContainer = document.getElementById('chatMessages');

    // Remove welcome message if exists
    const welcome = messagesContainer.querySelector('.welcome-message');
    if (welcome) welcome.remove();

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

function updateStatus(text, isGenerating) {
    const statusText = document.querySelector('.status-text');
    const statusIndicator = document.querySelector('.status-indicator');

    statusText.textContent = text;

    if (isGenerating) {
        statusIndicator.classList.add('generating');
    } else {
        statusIndicator.classList.remove('generating');
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

// Initialize recommendations on load
window.addEventListener('load', () => {
    setTimeout(updateRecommendedMessages, 500);
});
