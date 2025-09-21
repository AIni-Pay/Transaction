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

  const sendQuickMessage = (message) => {
    // Agregar mensaje del usuario inmediatamente
    addUserMessage(message);
    
    // Procesar con el chatbot
    if (chatbot) {
      chatbot.processMessage(message).then(response => {
        setTimeout(() => {
          addBotMessages(response.botMessages, 500);
          
          // Manejar acciones especiales
          if (response.needsAction === 'execute_transaction') {
            handleTransactionExecution(response.transactionData);
          }
        }, 800);
      }).catch(error => {
        console.error('Error processing quick message:', error);
        setTimeout(() => {
          addBotMessages([
            "❌ Ocurrió un error procesando tu mensaje.",
            "¿Puedes intentar de nuevo?"
          ], 500);
        }, 800);
      });
    }
  };

  const shouldShowConfirmButtons = (botMessages) => {
    return botMessages.some(message => 
      message.toLowerCase().includes('escribe confirmo para proceder')
    );
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
    <div className="max-w-4xl mx-auto bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            🤖
          </div>
          <div>
            <h3 className="text-white text-lg font-semibold">Celestia Assistant</h3>
            <span className="text-sm">
              {isConnected ? (
                <span className="text-green-400 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Wallet conectado
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  Wallet desconectado
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-800/20">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'bot' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                  : 'bg-gradient-to-r from-green-500 to-blue-500'
              }`}>
                {message.type === 'bot' ? '🤖' : '👤'}
              </div>
              <div className="flex flex-col">
                <div className={`px-4 py-3 rounded-2xl shadow-lg ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-700/80 text-gray-100 border border-gray-600/50'
                }`}>
                  {message.content.map((line, lineIndex) => (
                    <div key={lineIndex} className="mb-1 last:mb-0">
                      {line}
                    </div>
                  ))}
                </div>
                
                {/* Botones de confirmación si el bot pide confirmación */}
                {message.type === 'bot' && shouldShowConfirmButtons(message.content) && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => sendQuickMessage('confirmo')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md flex items-center gap-2"
                    >
                      ✅ Confirmar
                    </button>
                    <button
                      onClick={() => sendQuickMessage('reset')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md flex items-center gap-2"
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1 px-2">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                🤖
              </div>
              <div className="px-4 py-3 rounded-2xl bg-gray-700/80 border border-gray-600/50 shadow-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-gray-700/50 bg-gray-800/30">
        <div className="flex items-end space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje aquí..."
            rows={1}
            className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            📤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;