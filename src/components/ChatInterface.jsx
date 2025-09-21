import React, { useState, useEffect, useRef } from 'react';

const ChatInterface = ({ onSendTransaction, walletInfo, isConnected }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatbot, setChatbot] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Importar el chatbot service dinámicamente
    import('../services/ChatbotService.js').then(module => {
      const service = new module.ChatbotService();
      setChatbot(service);
      
      // Mensaje inicial del bot
      addBotMessages([
        "¡Hola amigo! 👋 ¿Qué tal? Te puedo ayudar a realizar una transacción.",
        "Para enviar tokens necesito algunos datos:",
        "🪙 El tipo de moneda y monto (ej: '5 TIA' o '0.001 mocha')",
        "📍 La dirección del destinatario",
        "¿Con qué te gustaría empezar?"
      ]);
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addBotMessages = (botMessages, delay = 1000) => {
    setIsTyping(true);
    
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          type: 'bot',
          content: botMessages,
          timestamp: new Date()
        }
      ]);
      setIsTyping(false);
    }, delay);
  };

  const addUserMessage = (message) => {
    setMessages(prev => [
      ...prev,
      {
        type: 'user',
        content: [message],
        timestamp: new Date()
      }
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatbot) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');
    
    // Agregar mensaje del usuario
    addUserMessage(userMsg);
    
    // Procesar con el chatbot (ahora es async)
    try {
      const response = await chatbot.processMessage(userMsg);
      
      // Agregar respuesta del bot
      setTimeout(() => {
        addBotMessages(response.botMessages, 500);
        
        // Manejar acciones especiales
        if (response.needsAction === 'execute_transaction') {
          handleTransactionExecution(response.transactionData);
        }
      }, 800);
    } catch (error) {
      console.error('Error processing message:', error);
      setTimeout(() => {
        addBotMessages([
          "❌ Ocurrió un error procesando tu mensaje.",
          "¿Puedes intentar de nuevo?"
        ], 500);
      }, 800);
    }
  };

  const handleTransactionExecution = async (transactionData) => {
    try {
      // Mostrar mensaje de procesamiento
      addBotMessages([
        "🚀 Iniciando transacción...",
        "Conectando wallet automáticamente..."
      ], 100);
      
      console.log('📋 Transaction data received:', transactionData);
      
      // Determinar la unidad basada en la red para la conexión del wallet
      let networkUnit = 'TIA'; // default para mainnet
      if (transactionData.network === 'Celestia Mocha Testnet') {
        networkUnit = 'mocha'; // para que detecte la red mocha
      }
      
      // Ejecutar transacción (la función onSendTransaction maneja la auto-conexión)
      const result = await onSendTransaction(
        transactionData.address,
        parseFloat(transactionData.amount),
        networkUnit
      );
      
      if (result.success) {
        // El chatbot no tiene handleTransactionSuccess, crear respuesta directamente
        setTimeout(() => {
          addBotMessages([
            "✅ ¡Transacción exitosa!",
            `🔗 Hash: ${result.transactionHash}`,
            "💰 Los tokens han sido enviados correctamente",
            "",
            "¿Te gustaría realizar otra transacción?"
          ], 1000);
        }, 2000);
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
      
    } catch (error) {
      console.error('Transaction execution error:', error);
      setTimeout(() => {
        addBotMessages([
          "❌ Error en la transacción",
          `🚨 ${error.message}`,
          "",
          "Por favor verifica tu conexión e intenta de nuevo",
          "Escribe 'reset' para empezar otra transacción"
        ], 1000);
      }, 2000);
    }
  };

  const autoConnectWallet = async (chain) => {
    try {
      console.log(`Auto-connecting to ${chain}...`);
      
      // Agregar mensaje informativo
      addBotMessages([
        "🔄 Conectando automáticamente tu wallet...",
        "Un momento por favor..."
      ], 100);
      
      // Verificar si ya está conectado a la red correcta
      if (isConnected && walletInfo.chain === chain) {
        return; // Ya está conectado a la red correcta
      }
      
      // Trigger de conexión desde el componente padre
      // Esto se hará a través de la función onSendTransaction que maneja la conexión
      
    } catch (error) {
      console.error('Auto-connect error:', error);
      addBotMessages([
        "❌ Error conectando el wallet.",
        "Por favor conecta manualmente tu wallet Keplr."
      ], 500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="bot-avatar">🤖</div>
        <div className="bot-info">
          <h3>Celestia Assistant</h3>
          <span className="status">
            {isConnected ? '🟢 Wallet conectado' : '🔴 Wallet desconectado'}
          </span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'bot' ? '🤖' : '👤'}
            </div>
            <div className="message-content">
              <div className="message-bubble">
                {message.content.map((line, lineIndex) => (
                  <div key={lineIndex} className="message-line">
                    {line}
                  </div>
                ))}
              </div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="message-bubble typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje aquí..."
            rows={1}
            className="message-input"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="send-button"
          >
            📤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;