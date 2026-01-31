// Authentication functions
function signIn(event) {
    event.preventDefault();
    // For now, simple fake authentication
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = 'dashboard.html';
}

function getStarted(event) {
    event.preventDefault();
    // For now, redirect to dashboard (will add proper signup later)
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = 'dashboard.html';
}

// FAQ toggle function
function toggleFaq(element) {
    element.classList.toggle('active');
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background on scroll
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        navbar.style.background = 'rgba(10, 14, 20, 0.95)';
    } else {
        navbar.style.background = 'rgba(10, 14, 20, 0.8)';
    }

    lastScroll = currentScroll;
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards, steps, and other elements (skip FAQ items since they have click handlers)
document.querySelectorAll('.feature-card, .step, .technical-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Interface preview demo - simulate typing
const demoMessages = [
    { type: 'user', text: 'Create a bot that monitors Trump election markets', delay: 1000 },
    { type: 'assistant', text: "I'll help you build that bot. Let me set up the market monitoring and trading logic...", delay: 2000 },
    { type: 'user', text: 'Add limit orders with 2% spread', delay: 1500 },
    { type: 'assistant', text: 'Generating code...', delay: 1000 }
];

let messageIndex = 0;
let demoRunning = false;

function addDemoMessage(message) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;

    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.type}`;
    messageEl.textContent = message.text;
    messageEl.style.opacity = '0';
    messageEl.style.transform = 'translateY(10px)';

    chatMessages.appendChild(messageEl);

    setTimeout(() => {
        messageEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        messageEl.style.opacity = '1';
        messageEl.style.transform = 'translateY(0)';
    }, 50);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function runInterfaceDemo() {
    if (demoRunning) return;
    demoRunning = true;

    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) {
        demoRunning = false;
        return;
    }

    // Clear existing messages
    chatMessages.innerHTML = '';
    messageIndex = 0;

    function addNextMessage() {
        if (messageIndex < demoMessages.length) {
            addDemoMessage(demoMessages[messageIndex]);
            messageIndex++;

            if (messageIndex < demoMessages.length) {
                setTimeout(addNextMessage, demoMessages[messageIndex].delay);
            } else {
                // Restart demo after a pause
                setTimeout(() => {
                    demoRunning = false;
                    runInterfaceDemo();
                }, 5000);
            }
        }
    }

    addNextMessage();
}

// Start demo when interface preview is in viewport
const interfacePreview = document.querySelector('.interface-preview');
if (interfacePreview) {
    const demoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !demoRunning) {
                runInterfaceDemo();
            }
        });
    }, { threshold: 0.5 });

    demoObserver.observe(interfacePreview);
}

// FAQ accordion is handled by toggleFaq() function in onclick handlers

// CTA button tracking (placeholder for analytics)
document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', function(e) {
        // Track button clicks
        console.log('CTA clicked:', this.textContent);

        // Add your analytics tracking here
        // e.g., gtag('event', 'click', { button: this.textContent });
    });
});

// Mobile menu toggle (if implementing mobile nav)
const createMobileMenu = () => {
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');

    if (window.innerWidth <= 768) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.innerHTML = '☰';
        menuBtn.style.cssText = `
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            font-size: 24px;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
        `;

        menuBtn.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });

        if (!document.querySelector('.mobile-menu-btn')) {
            document.querySelector('.nav-content').appendChild(menuBtn);
        }
    }
};

window.addEventListener('resize', createMobileMenu);
createMobileMenu();

// Form validation for email capture (when implemented)
const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Pricing calculator or trial counter (optional enhancement)
const calculateROI = (botsCreated, avgProfit) => {
    const monthlyCost = 30;
    const potentialProfit = botsCreated * avgProfit;
    const roi = ((potentialProfit - monthlyCost) / monthlyCost) * 100;
    return roi;
};

// Log when page is fully loaded
window.addEventListener('load', () => {
    console.log('PolyBot Builder landing page loaded');
    console.log('Environment:', window.location.hostname);
});

// Prevent default on demo buttons
document.querySelectorAll('.demo-export-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('This is a demo button. In the real platform, this would export your bot code!');
    });
});
