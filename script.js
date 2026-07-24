// Advanced Bot Detection & Security System
class BotDetector {
    constructor() {
        this.score = 0;
        this.flags = [];
        this.maxScore = 100;
        this.threshold = 60; // Score above this = likely bot
    }

    // Check for common bot patterns
    checkUserAgent() {
        const ua = navigator.userAgent.toLowerCase();
        const botPatterns = [
            'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
            'python', 'java/', 'libwww', 'httpclient', 'nutch',
            'phpcrawl', 'msnbot', 'slurp', 'yandexbot', 'baiduspider',
            'facebookexternalhit', 'twitterbot', 'rogerbot', 'linkedinbot',
            'embedly', 'quora link preview', 'showyoubot', 'outbrain',
            'pinterest', 'slack', 'vkshare', 'w3c_validator',
            'redditbot', 'applebot', 'whatsapp', 'flipboard',
            'tumblr', 'bitlybot', 'semrush', 'ahrefsbot', 'dotbot'
        ];

        if (/headless/.test(ua)) {
            this.score += 30;
            this.flags.push('headless_browser');
        }

        for (const pattern of botPatterns) {
            if (ua.includes(pattern)) {
                this.score += 25;
                this.flags.push(`bot_ua:${pattern}`);
                break;
            }
        }

        // Check for missing or generic user agents
        if (!ua || ua.length < 50) {
            this.score += 10;
            this.flags.push('suspicious_ua_length');
        }
    }

    // Check browser properties that bots often miss
    checkBrowserProperties() {
        const checks = {
            languages: navigator.languages && navigator.languages.length > 0,
            plugins: navigator.plugins && navigator.plugins.length > 0,
            mimeTypes: navigator.mimeTypes && navigator.mimeTypes.length > 0,
            webdriver: !navigator.webdriver,
            chrome: window.chrome !== undefined,
            notification: 'Notification' in window,
            permissions: navigator.permissions !== undefined,
            serviceWorker: 'serviceWorker' in navigator,
            webGL: this.checkWebGL(),
            canvas: this.checkCanvasFingerprint(),
            screenResolution: this.checkScreenResolution(),
            timezone: this.checkTimezone(),
            touchSupport: this.checkTouchSupport()
        };

        for (const [check, passed] of Object.entries(checks)) {
            if (!passed) {
                this.score += 5;
                this.flags.push(`missing_${check}`);
            }
        }
    }

    checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return false;
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (!debugInfo) return false;
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            return !/swiftshader|llvmpipe|google swiftangle/i.test(renderer);
        } catch {
            return false;
        }
    }

    checkCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 50;
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(0, 0, 100, 50);
            ctx.fillStyle = '#069';
            ctx.fillText('BotDetection', 2, 15);
            const data = canvas.toDataURL();
            return data.length > 1000; // Real browsers produce substantial data
        } catch {
            return false;
        }
    }

    checkScreenResolution() {
        return screen.width > 0 && screen.height > 0 && 
               screen.width !== screen.height && 
               screen.width > 200 && screen.height > 200;
    }

    checkTimezone() {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            return tz && tz.length > 0;
        } catch {
            return false;
        }
    }

    checkTouchSupport() {
        const hasTouchPoints = navigator.maxTouchPoints > 0;
        const hasTouchEvent = 'ontouchstart' in window;
        // Inconsistency could indicate spoofing
        return hasTouchPoints === hasTouchEvent || (!hasTouchPoints && !hasTouchEvent);
    }

    // Track mouse movements (bots typically don't move mouse naturally)
    trackMouseBehavior() {
        return new Promise((resolve) => {
            let mouseMoved = false;
            let movementData = [];
            const startTime = Date.now();

            const handleMouseMove = (e) => {
                mouseMoved = true;
                movementData.push({
                    x: e.clientX,
                    y: e.clientY,
                    time: Date.now() - startTime
                });

                if (movementData.length > 10) {
                    // Analyze movement patterns
                    const isRandom = this.analyzeMovement(movementData);
                    if (!isRandom) {
                        this.score += 15;
                        this.flags.push('linear_mouse_movement');
                    }
                }
            };

            const handleKeyPress = () => {
                this.score -= 5; // Reduce bot score for human-like behavior
            };

            window.addEventListener('mousemove', handleMouseMove, { once: false });
            window.addEventListener('keydown', handleKeyPress, { once: false });

            setTimeout(() => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('keydown', handleKeyPress);
                
                if (!mouseMoved) {
                    this.score += 20;
                    this.flags.push('no_mouse_movement');
                }
                resolve();
            }, 1500);
        });
    }

    analyzeMovement(movements) {
        // Check if movement is too linear/predictable (bot-like)
        let directionChanges = 0;
        let prevDirection = null;

        for (let i = 1; i < movements.length; i++) {
            const dx = movements[i].x - movements[i-1].x;
            const dy = movements[i].y - movements[i-1].y;
            const currentDirection = Math.atan2(dy, dx);
            
            if (prevDirection !== null) {
                const diff = Math.abs(currentDirection - prevDirection);
                if (diff > 0.1) directionChanges++;
            }
            prevDirection = currentDirection;
        }

        return directionChanges > 3; // Human movement has many direction changes
    }

    async detectBot() {
        this.checkUserAgent();
        this.checkBrowserProperties();
        
        // Track mouse behavior (give it time to gather data)
        await this.trackMouseBehavior();

        return {
            isBot: this.score >= this.threshold,
            score: this.score,
            flags: this.flags,
            confidence: (this.score / this.maxScore) * 100
        };
    }
}

// Rate Limiter
class RateLimiter {
    constructor() {
        this.storageKey = 'redirect_timestamps';
        this.maxRequests = 5;
        this.timeWindow = 60000; // 1 minute
    }

    checkRateLimit() {
        const now = Date.now();
        const timestamps = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        
        // Clean old timestamps
        const recentTimestamps = timestamps.filter(t => now - t < this.timeWindow);
        
        if (recentTimestamps.length >= this.maxRequests) {
            return false; // Rate limited
        }

        recentTimestamps.push(now);
        localStorage.setItem(this.storageKey, JSON.stringify(recentTimestamps));
        return true;
    }

    getTimeUntilReset() {
        const timestamps = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        if (timestamps.length === 0) return 0;
        const oldestTimestamp = Math.min(...timestamps);
        return Math.max(0, this.timeWindow - (Date.now() - oldestTimestamp));
    }
}

// Enhanced Security Handler
class SecurityHandler {
    constructor() {
        this.botDetector = new BotDetector();
        this.rateLimiter = new RateLimiter();
    }

    sanitizeUrl(url) {
        try {
            const urlObj = new URL(url);
            
            // Block dangerous protocols
            const blockedProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
            if (blockedProtocols.some(p => url.toLowerCase().startsWith(p))) {
                throw new Error('Blocked protocol');
            }

            // Block IP addresses (optional, remove if you need to allow them)
            const ipPattern = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
            if (ipPattern.test(url)) {
                console.warn('IP address URL detected, allowing anyway');
            }

            // Remove potential XSS vectors
            urlObj.search = ''; // Remove query parameters that might contain malicious code
            urlObj.hash = ''; // Remove fragments

            return urlObj.toString();
        } catch {
            return null;
        }
    }

    async handleRedirect(fullUrl) {
        // Sanitize URL
        const sanitizedUrl = this.sanitizeUrl(fullUrl);
        if (!sanitizedUrl) {
            return { error: 'Invalid or malicious URL detected' };
        }

        // Check rate limit
        if (!this.rateLimiter.checkRateLimit()) {
            const timeUntilReset = Math.ceil(this.rateLimiter.getTimeUntilReset() / 1000);
            return { 
                error: `Rate limit exceeded. Please wait ${timeUntilReset} seconds.` 
            };
        }

        // Run bot detection
        const botResult = await this.botDetector.detectBot();
        
        if (botResult.isBot) {
            console.warn('Bot detected:', botResult);
            // Log bot detection (you can send this to your server)
            this.logBotDetection(botResult);
            return { 
                error: 'Automated access detected', 
                isBot: true,
                requireCaptcha: true 
            };
        }

        return { success: true, url: sanitizedUrl };
    }

    logBotDetection(botResult) {
        // Send to your analytics endpoint
        const detectionData = {
            score: botResult.score,
            flags: botResult.flags,
            confidence: botResult.confidence,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        // Use sendBeacon for reliable logging
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(detectionData)], { type: 'application/json' });
            navigator.sendBeacon('/api/bot-detection', blob);
        }
    }
}

// Main Application
async function initApp() {
    // Initialize Particles.js
    if (typeof particlesJS !== 'undefined') {
        particlesJS("particles-js", {
            particles: {
                number: { 
                    value: 130, 
                    density: { enable: true, value_area: 800 } 
                },
                color: { value: "#ff8000" },
                shape: { type: "circle" },
                opacity: {
                    value: 0.5,
                    random: true,
                    anim: { 
                        enable: true, 
                        speed: 1, 
                        opacity_min: 0.1, 
                        sync: false 
                    }
                },
                size: {
                    value: 3,
                    random: true,
                    anim: { enable: false }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#ff8000",
                    opacity: 0.2,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: "none",
                    random: false,
                    straight: false,
                    out_mode: "out",
                    bounce: false,
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { 
                        enable: true, 
                        mode: "grab" 
                    },
                    onclick: { 
                        enable: true, 
                        mode: "push" 
                    },
                    resize: true
                },
                modes: {
                    grab: { 
                        distance: 140, 
                        line_linked: { opacity: 1 } 
                    },
                    push: { particles_nb: 4 }
                }
            },
            retina_detect: true
        });
    }

    // Handle URL with security
    const securityHandler = new SecurityHandler();
    const params = new URLSearchParams(window.location.search);
    const fullUrl = params.get('url');
    const span = document.querySelector('.shortenedurl');
    const countdownEl = document.getElementById('countdown') || createCountdownElement();

    if (fullUrl) {
        try {
            const urlObj = new URL(fullUrl);
            span.textContent = urlObj.hostname;

            // Show security check message
            span.parentElement.querySelector('.status')?.remove();
            const statusEl = document.createElement('div');
            statusEl.className = 'status';
            statusEl.textContent = 'Verifying security...';
            span.parentElement.appendChild(statusEl);

            // Perform security checks
            const securityCheck = await securityHandler.handleRedirect(fullUrl);

            if (securityCheck.error) {
                span.textContent = securityCheck.error;
                statusEl.textContent = securityCheck.requireCaptcha ? 
                    'Please complete captcha to continue' : 'Access blocked';
                return;
            }

            // Start countdown
            let countdown = 3;
            const updateCountdown = () => {
                if (countdown > 0) {
                    countdownEl.textContent = `Redirecting in ${countdown}...`;
                    countdown--;
                    setTimeout(updateCountdown, 1000);
                } else {
                    countdownEl.textContent = 'Redirecting...';
                    window.location.href = securityCheck.url;
                }
            };

            statusEl.textContent = 'Security check passed';
            updateCountdown();

        } catch (error) {
            span.textContent = "Invalid Link";
            console.error('URL processing error:', error);
        }
    } else {
        span.textContent = "No URL Found";
    }
}

function createCountdownElement() {
    const el = document.createElement('div');
    el.id = 'countdown';
    document.querySelector('.shortenedurl').parentElement.appendChild(el);
    return el;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Add CSS for the status and countdown elements
const style = document.createElement('style');
style.textContent = `
    .status {
        margin-top: 10px;
        font-size: 14px;
        color: #666;
    }
    #countdown {
        margin-top: 5px;
        font-size: 16px;
        font-weight: bold;
        color: #ff8000;
    }
`;
document.head.appendChild(style);
