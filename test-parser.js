// Test rápido para verificar el parsing
import { ChatbotService } from './src/services/ChatbotService.js';

const chatbot = new ChatbotService();

// Simular el mensaje del usuario
const userMessage = "Hola quiero enviar 0.01 a celestia1uaclygpvytqwdvmrtjskyq0087az3v5wdedn7k el tipo de moneda es MOCHA";

console.log('🧪 Testing user message:', userMessage);

// Simular el procesamiento
setTimeout(() => {
  const result = chatbot.processMessage(userMessage);
  console.log('📊 Chatbot response:', result);
}, 1000);