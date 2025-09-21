import { ChatbotService } from './src/services/ChatbotService.js';

// Crear instancia del chatbot
const chatbot = new ChatbotService();

console.log('=== PRUEBA DEL CHATBOT ===\n');

// Prueba 1: Comando completo con Mocha
console.log('1. Comando: "Quiero enviar 0.01 Mocha a celestia1uaclygpvytqwdvmrtjskyq0087az3v5wdedn7k"');
const response1 = await chatbot.processMessage("Quiero enviar 0.01 Mocha a celestia1uaclygpvytqwdvmrtjskyq0087az3v5wdedn7k");
console.log('Estado:', response1.state);
console.log('Datos de transacción:', response1.transactionData);
console.log('');

// Prueba 2: Confirmación
console.log('2. Comando: "confirmo"');
const response2 = await chatbot.processMessage("confirmo");
console.log('Estado:', response2.state);
console.log('Acción necesaria:', response2.needsAction);
console.log('Datos de transacción:', response2.transactionData);
console.log('');

console.log('✅ ¡Prueba completada!');