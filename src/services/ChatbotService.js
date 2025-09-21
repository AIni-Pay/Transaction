import { CELESTIA_NETWORKS, isValidCelestiaAddress } from "../config/networks.js";

export class ChatbotService {
  constructor() {
    this.state = "greeting";
    this.transactionData = { amount: null, currency: "TIA", address: null, network: null };
  }

  async processMessage(userMessage) {
    console.log("🤖 Current state:", this.state, "| Message:", userMessage);
    
    if (userMessage.toLowerCase().includes("reset")) return this.reset();
    
    switch (this.state) {
      case "greeting": return this.handleGreeting(userMessage);
      case "waiting_network": return this.handleNetworkSelection(userMessage);
      case "confirming": return this.handleConfirmation(userMessage);
      default: return this.getHelpResponse();
    }
  }

  handleGreeting(userMessage) {
    const parsed = this.parseMessage(userMessage);
    if (parsed.hasTransaction) return this.processTransaction(parsed);
    
    return {
      botMessages: ["¡Hola! 👋 Ejemplos: 'Enviar 0.01 TIA a celestia1... en mainnet' o 'Enviar 0.1 Mocha a celestia1...' (actualizado)"],
      state: this.state,
      needsAction: null
    };
  }

  processTransaction(parsed) {
    if (parsed.amount && parsed.address && parsed.network) {
      // ✅ ACTUALIZAR EL ESTADO AQUÍ
      this.state = "confirming";
      
      const json = { address: parsed.address, network: parsed.network, currency: "TIA", amount: parsed.amount.toString() };
      // ✅ GUARDAR EN TRANSACTIONDATA PARA USAR EN CONFIRMACIÓN
      this.transactionData = json;
      
      return {
        botMessages: ["✅ Transaccion detectada:", "💰 Monto: " + parsed.amount + " TIA", "🌐 Red: " + parsed.network, "📍 Destino: " + parsed.address.substring(0, 12) + "...", "", "📋 JSON generado:", "```json", JSON.stringify(json, null, 2), "```", "", "Escribe confirmo para proceder"],
        state: this.state,
        needsAction: null,
        transactionData: json
      };
    }
    
    if (parsed.amount && parsed.address) {
      // ✅ ACTUALIZAR EL ESTADO AQUÍ  
      this.state = "waiting_network";
      this.transactionData.amount = parsed.amount;
      this.transactionData.address = parsed.address;
      
      return {
        botMessages: ["✅ Datos recibidos:", "💰 Monto: " + parsed.amount + " TIA", "📍 Direccion: " + parsed.address.substring(0, 12) + "...", "", "🌐 ¿En que red?", "1️⃣ Celestia Mainnet Beta", "2️⃣ Celestia Mocha Testnet", "", "Responde 1 o 2"],
        state: this.state,
        needsAction: null
      };
    }
    
    return { botMessages: ["❌ Datos incompletos. Ejemplos: 'Enviar 0.01 TIA a celestia1... en mainnet' o 'Enviar 0.01 Mocha a celestia1...'"], state: this.state, needsAction: null };
  }

  handleNetworkSelection(userMessage) {
    let network = null;
    if (userMessage.trim() === "1" || userMessage.toLowerCase().includes("mainnet")) network = "Celestia Mainnet Beta";
    else if (userMessage.trim() === "2" || userMessage.toLowerCase().includes("mocha")) network = "Celestia Mocha Testnet";
    
    if (network) {
      // ✅ ACTUALIZAR EL ESTADO AQUÍ
      this.state = "confirming";
      
      const json = { address: this.transactionData.address, network: network, currency: "TIA", amount: this.transactionData.amount.toString() };
      // ✅ GUARDAR EN TRANSACTIONDATA PARA USAR EN CONFIRMACIÓN
      this.transactionData = json;
      
      return {
        botMessages: ["✅ Transaccion completa:", "💰 Monto: " + this.transactionData.amount + " TIA", "🌐 Red: " + network, "📍 Destino: " + this.transactionData.address.substring(0, 12) + "...", "", "📋 JSON final:", "```json", JSON.stringify(json, null, 2), "```", "", "Escribe confirmo para proceder"],
        state: this.state,
        needsAction: null,
        transactionData: json
      };
    }
    
    return { botMessages: ["❌ Responde 1 para Mainnet o 2 para Mocha Testnet"], state: this.state, needsAction: null };
  }

  handleConfirmation(userMessage) {
    if (userMessage.toLowerCase().includes("confirmo")) {
      this.state = "completed";
      return { 
        botMessages: ["🚀 ¡Transaccion confirmada y lista para enviar!", "✅ Conectando con Keplr wallet..."], 
        state: this.state, 
        needsAction: "execute_transaction",
        transactionData: this.transactionData
      };
    }
    return { 
      botMessages: ["Escribe 'confirmo' para proceder o 'reset' para cancelar"], 
      state: this.state, 
      needsAction: null 
    };
  }

  parseMessage(text) {
    console.log("🔍 Parsing text:", text);
    const result = { hasTransaction: false, amount: null, address: null, network: null };
    const sendKeywords = ["enviar", "send", "quiero enviar", "mandar"];
    
    const hasKeyword = sendKeywords.some(k => text.toLowerCase().includes(k));
    console.log("🔍 Has keyword:", hasKeyword);
    
    if (!hasKeyword) return result;
    result.hasTransaction = true;
    
    // Detectar monto y moneda - ahora reconoce TIA y Mocha
    const amountTiaMatch = text.match(/(\d+(?:\.\d+)?)\s*TIA/i);
    const amountMochaMatch = text.match(/(\d+(?:\.\d+)?)\s*Mocha/i);
    
    console.log("🔍 TIA match:", amountTiaMatch);
    console.log("🔍 Mocha match:", amountMochaMatch);
    
    if (amountTiaMatch) {
      result.amount = parseFloat(amountTiaMatch[1]);
    } else if (amountMochaMatch) {
      result.amount = parseFloat(amountMochaMatch[1]);
      // Si usa "Mocha" como moneda, automáticamente es Mocha Testnet
      if (!result.network) result.network = "Celestia Mocha Testnet";
    }
    
    const addressMatch = text.match(/(celestia1[a-z0-9]{38,58})/i);
    console.log("🔍 Address match:", addressMatch);
    
    if (addressMatch && isValidCelestiaAddress(addressMatch[0])) result.address = addressMatch[0];
    
    // Detectar red por palabras clave (solo si no se detectó por moneda)
    if (!result.network) {
      if (text.toLowerCase().includes("mainnet") || text.toLowerCase().includes("main")) {
        result.network = "Celestia Mainnet Beta";
      } else if (text.toLowerCase().includes("mocha") || text.toLowerCase().includes("testnet")) {
        result.network = "Celestia Mocha Testnet";
      }
    }
    
    console.log("🔍 Parsed result:", result);
    return result;
  }

  reset() {
    this.state = "greeting";
    this.transactionData = { amount: null, currency: "TIA", address: null, network: null };
    return { botMessages: [" Empecemos de nuevo. ¡Hola!"], state: this.state, needsAction: null };
  }

  getHelpResponse() {
    return { botMessages: ["❌ No entendí. Ejemplos: 'Enviar 0.01 TIA a celestia1... en mainnet' o 'Enviar 0.01 Mocha a celestia1...'"], state: this.state, needsAction: null };
  }
}