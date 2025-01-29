const API_URL = 'https://olla-seek-chat-local.vercel.app/api/chat'; // Replace with your API URL
// const API_KEY = '1234567890'; // API Key if required

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const aiTypingIndicator = document.getElementById('ai-typing-indicator');

// Load chat history when the page loads
document.addEventListener("DOMContentLoaded", loadChatHistory);

// Function to add a message to the chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'ai-message');
    
    if (isUser) {
        messageDiv.textContent = content;
    } else {
        messageDiv.innerHTML = marked.parse(content);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Save Message to Local Storage
    saveChatHistory();
}

// Function to save chat history
function saveChatHistory() {
    const messages = [...chatMessages.children].map(msg => ({
        sender: msg.classList.contains("user-message") ? "user" : "ai",
        text: msg.innerHTML
    }));
    localStorage.setItem("chatHistory", JSON.stringify(messages));
}

// Function to load chat history
function loadChatHistory() {
    const savedMessages = JSON.parse(localStorage.getItem("chatHistory")) || [];
    savedMessages.forEach(({ sender, text }) => {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender === "user" ? "user-message" : "ai-message");
        messageDiv.innerHTML = text;
        chatMessages.appendChild(messageDiv);
    });

    // Scroll to the latest message
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to send message to API
async function sendToAI(message) {
    try {
        // Show typing indicator while waiting for AI response
        aiTypingIndicator.style.display = 'block';
        aiTypingIndicator.style.opacity = 1;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization header if required
                // 'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-r1:1.5b', // Replace with your AI model if necessary
                prompt: message,
                stream: false,
                options: {
                    temperature: 0.7 // Adjust temperature for response variation
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('API Response:', errorData);
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data.response;
    } catch (error) {
        console.error('Detailed error:', error);
        return `⚠️Sorry, I encountered an error: ${error.message}. Please try again.`;
    } finally {
        // Hide typing indicator once AI response is ready
        aiTypingIndicator.style.display = 'none';
    }
}

// Handle send button click
async function handleSend() {
    const message = userInput.value.trim();
    if (message === '') return;

    // Add user message to chat
    addMessage(message, true);
    userInput.value = '';

    // Get AI response
    const aiResponse = await sendToAI(message);

    // Add AI response to chat
    addMessage(aiResponse, false);
}

// Event listeners
sendButton.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
}); 

// Optional: Clear chat history
document.getElementById("clear-chat-button")?.addEventListener("click", () => {
    localStorage.removeItem("chatHistory");
    chatMessages.innerHTML = ""; // Clear UI
});
