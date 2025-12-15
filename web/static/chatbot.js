// AI Chatbot Assistant
const chatbotKnowledge = {
    greetings: ['hi', 'hello', 'hey', 'good morning', 'good afternoon'],
    diseases: {
        'apple scab': 'Apple Scab is a fungal disease. Treatment: Apply fungicides, remove infected leaves, ensure good air circulation.',
        'black rot': 'Black Rot affects apples and grapes. Treatment: Prune infected areas, apply copper-based fungicides, maintain tree health.',
        'early blight': 'Early Blight affects tomatoes and potatoes. Treatment: Remove infected leaves, apply fungicides, rotate crops.',
        'late blight': 'Late Blight is serious for tomatoes and potatoes. Treatment: Apply fungicides immediately, remove infected plants, improve drainage.',
        'powdery mildew': 'Powdery Mildew appears as white powder. Treatment: Apply sulfur-based fungicides, improve air circulation, avoid overhead watering.'
    },
    fruits: ['apple', 'tomato', 'potato', 'grape', 'strawberry', 'banana', 'orange', 'mango'],
    help: 'I can help you with:\n• Disease identification\n• Treatment recommendations\n• Fruit information\n• Using the app\n• General farming tips'
};

class Chatbot {
    constructor() {
        this.isOpen = false;
        this.init();
    }
    
    init() {
        const chatHTML = `
            <div id="chatbot-widget">
                <button id="chat-toggle" class="chat-toggle">💬</button>
                <div id="chat-window" class="chat-window" style="display: none;">
                    <div class="chat-header">
                        <span>🤖 FreshGuard Assistant</span>
                        <button id="chat-close">✕</button>
                    </div>
                    <div id="chat-messages" class="chat-messages">
                        <div class="bot-message">Hi! I'm your FreshGuard AI assistant. Ask me about diseases, treatments, or how to use the app! 🌱</div>
                    </div>
                    <div class="chat-input-container">
                        <input type="text" id="chat-input" placeholder="Ask me anything..." />
                        <button id="chat-send">Send</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatHTML);
        this.attachEvents();
    }
    
    attachEvents() {
        document.getElementById('chat-toggle').onclick = () => this.toggle();
        document.getElementById('chat-close').onclick = () => this.toggle();
        document.getElementById('chat-send').onclick = () => this.sendMessage();
        document.getElementById('chat-input').onkeypress = (e) => {
            if (e.key === 'Enter') this.sendMessage();
        };
    }
    
    toggle() {
        this.isOpen = !this.isOpen;
        document.getElementById('chat-window').style.display = this.isOpen ? 'flex' : 'none';
        document.getElementById('chat-toggle').style.display = this.isOpen ? 'none' : 'flex';
    }
    
    sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;
        
        this.addMessage(message, 'user');
        input.value = '';
        
        setTimeout(() => {
            const response = this.getResponse(message.toLowerCase());
            this.addMessage(response, 'bot');
        }, 500);
    }
    
    addMessage(text, type) {
        const messagesDiv = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = type === 'user' ? 'user-message' : 'bot-message';
        msgDiv.textContent = text;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    getResponse(message) {
        // Greetings
        if (chatbotKnowledge.greetings.some(g => message.includes(g))) {
            return 'Hello! How can I help you today? 😊';
        }
        
        // Help
        if (message.includes('help')) {
            return chatbotKnowledge.help;
        }
        
        // Diseases
        for (const [disease, info] of Object.entries(chatbotKnowledge.diseases)) {
            if (message.includes(disease)) {
                return info;
            }
        }
        
        // Fruits
        const fruit = chatbotKnowledge.fruits.find(f => message.includes(f));
        if (fruit) {
            return `${fruit.charAt(0).toUpperCase() + fruit.slice(1)} is supported! Upload an image to analyze it for diseases. 🍎`;
        }
        
        // How to use
        if (message.includes('how') || message.includes('use')) {
            return 'To use FreshGuard:\n1. Go to Analyze page\n2. Upload a fruit/vegetable image\n3. Click Analyze\n4. Get instant disease detection! 📸';
        }
        
        // Default
        return "I'm not sure about that. Try asking about diseases, treatments, or how to use the app. Type 'help' for more options! 🤔";
    }
}

// Initialize chatbot
document.addEventListener('DOMContentLoaded', () => new Chatbot());
