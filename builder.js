// Check authentication
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = 'index.html';
}

// Chat functionality
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    input.value = '';

    // Show generating status
    updateStatus('Generating code...', true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
        generateBotCode(message);
        addAssistantResponse(message);
        updateStatus('Ready', false);
    }, 2000);
}

function addMessage(text, type) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `<p>${escapeHtml(text)}</p>`;

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addAssistantResponse(userMessage) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Generate contextual response
    let response = `<p>I've started building your bot based on your requirements.</p>`;

    if (userMessage.toLowerCase().includes('arbitrage')) {
        response += `<p>I've created an arbitrage bot that will:</p>
        <ul>
            <li>Monitor multiple similar markets</li>
            <li>Calculate price differences automatically</li>
            <li>Execute trades when profitable opportunities appear</li>
        </ul>
        <p>Check the code panel on the right. You can modify the spread threshold, markets to monitor, and other parameters.</p>`;
    } else if (userMessage.toLowerCase().includes('market maker') || userMessage.toLowerCase().includes('spread')) {
        response += `<p>I've created a market making bot with:</p>
        <ul>
            <li>Configurable bid-ask spread</li>
            <li>Inventory management</li>
            <li>Automatic quote adjustment</li>
        </ul>
        <p>The code is ready to review in the right panel.</p>`;
    } else if (userMessage.toLowerCase().includes('news')) {
        response += `<p>I've created a news-driven trading bot that:</p>
        <ul>
            <li>Monitors news feeds in real-time</li>
            <li>Analyzes sentiment automatically</li>
            <li>Places orders based on news signals</li>
        </ul>
        <p>Review the code and you can customize the news sources and keywords.</p>`;
    } else {
        response += `<p>The generated code includes:</p>
        <ul>
            <li>Polymarket API integration</li>
            <li>Rate limiting and safety features</li>
            <li>Error handling and logging</li>
        </ul>
        <p>You can modify any part of the code to match your exact needs.</p>`;
    }

    contentDiv.innerHTML = response;
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateBotCode(userMessage) {
    const codeBlock = document.getElementById('codeBlock');

    // Generate appropriate code based on message
    let code = '';

    if (userMessage.toLowerCase().includes('arbitrage')) {
        code = `<span class="keyword">import</span> { ClobClient } <span class="keyword">from</span> <span class="string">'@polymarket/clob-client'</span>;
<span class="keyword">import</span> { platformData } <span class="keyword">from</span> <span class="string">'./data/platform'</span>;

<span class="keyword">class</span> <span class="class-name">ArbitrageBot</span> {
  <span class="keyword">private</span> client: ClobClient;
  <span class="keyword">private</span> minSpread: <span class="class-name">number</span> = <span class="number">0.02</span>; <span class="comment">// 2% minimum spread</span>

  <span class="keyword">constructor</span>() {
    <span class="keyword">this</span>.client = <span class="keyword">new</span> <span class="class-name">ClobClient</span>({
      apiKey: process.env.POLYMARKET_API_KEY,
      secret: process.env.POLYMARKET_SECRET,
      passphrase: process.env.POLYMARKET_PASSPHRASE
    });
  }

  <span class="keyword">async</span> <span class="function">run</span>() {
    console.log(<span class="string">'Arbitrage bot started...'</span>);

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
    <span class="comment">// Implementation here</span>
    <span class="keyword">return</span> [];
  }

  <span class="keyword">async</span> <span class="function">calculateSpread</span>(pair: <span class="class-name">any</span>) {
    <span class="comment">// Calculate price difference</span>
    <span class="keyword">return</span> <span class="number">0</span>;
  }

  <span class="keyword">async</span> <span class="function">executeArbitrage</span>(pair: <span class="class-name">any</span>, spread: <span class="class-name">number</span>) {
    console.log(<span class="string">\`Executing arbitrage with spread: \${spread}\`</span>);
    <span class="comment">// Place orders</span>
  }
}

<span class="keyword">const</span> bot = <span class="keyword">new</span> <span class="class-name">ArbitrageBot</span>();
bot.<span class="function">run</span>();`;
    } else {
        code = `<span class="keyword">import</span> { ClobClient } <span class="keyword">from</span> <span class="string">'@polymarket/clob-client'</span>;
<span class="keyword">import</span> { platformData } <span class="keyword">from</span> <span class="string">'./data/platform'</span>;

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
    console.log(<span class="string">'Trading bot started...'</span>);

    <span class="comment">// Get market data</span>
    <span class="keyword">const</span> market = <span class="keyword">await</span> <span class="keyword">this</span>.client.<span class="function">getMarket</span>(marketId);

    <span class="comment">// Implement your strategy here</span>
    <span class="keyword">await</span> <span class="keyword">this</span>.<span class="function">executeStrategy</span>(market);
  }

  <span class="keyword">async</span> <span class="function">executeStrategy</span>(market: <span class="class-name">any</span>) {
    <span class="comment">// Your trading logic</span>
  }
}

<span class="keyword">const</span> bot = <span class="keyword">new</span> <span class="class-name">TradingBot</span>();
bot.<span class="function">run</span>();`;
    }

    codeBlock.innerHTML = code;
}

function handleChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
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
    alert('Bot draft saved! (Feature coming soon)');
}

function exportBot() {
    const botName = document.getElementById('botName').value || 'Untitled Bot';
    alert(`Exporting "${botName}"...\n\nYour bot will be downloaded as a complete TypeScript project with:\n- Full source code\n- Environment template\n- README with setup instructions\n- Docker configuration\n\n(Feature coming soon)`);
}

function showMenu() {
    document.getElementById('menuOverlay').classList.add('active');
}

function hideMenu() {
    document.getElementById('menuOverlay').classList.remove('active');
}

function newBot() {
    if (confirm('Start a new bot? Any unsaved changes will be lost.')) {
        location.reload();
    }
}

function showTemplates() {
    alert('Template library coming soon!\n\nYou\'ll be able to choose from:\n- Arbitrage bots\n- Market makers\n- News-driven traders\n- Limit order strategies\n- And more...');
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

// Code panel functions
function switchTab(tab) {
    const tabs = document.querySelectorAll('.header-tabs .tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'preview' || tab === 'config') {
        alert(`${tab.charAt(0).toUpperCase() + tab.slice(1)} tab coming soon!`);
    }
}

function copyCode() {
    const code = document.getElementById('codeBlock').textContent;
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
}

function changeLanguage(lang) {
    alert(`${lang === 'python' ? 'Python' : 'TypeScript'} export coming soon!`);
}
