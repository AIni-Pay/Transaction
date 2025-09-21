import React, { useState, useEffect } from 'react';
import { TokenInstructionParser } from './utils/TokenInstructionParser';
import { DeepSeekService } from './services/DeepSeekService';
import { KeplrWalletService } from './services/KeplrWalletService';
import { formatErrorMessage, KEPLR_INSTALLATION_GUIDE } from './utils/errorHelpers';
import ChatInterface from './components/ChatInterface';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [parseResult, setParseResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState({ isConnected: false, address: null, chain: null });
  const [balance, setBalance] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const [transactionResult, setTransactionResult] = useState(null);
  const [useAI, setUseAI] = useState(true);

  // Initialize services
  const parser = new TokenInstructionParser();
  const deepSeekService = new DeepSeekService();
  const walletService = new KeplrWalletService();

  useEffect(() => {
    // Check if wallet is already connected on load
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    const info = walletService.getWalletInfo();
    setWalletInfo(info);
    
    if (info.isConnected) {
      try {
        const bal = await walletService.getBalance();
        setBalance(bal);
      } catch (error) {
        console.error('Error getting balance:', error);
      }
    }
  };

  const connectWallet = async (chainName = 'celestia') => {
    try {
      setConnectionStatus('connecting');
      setWalletError(null);
      setIsLoading(true);
      
      const result = await walletService.connectWallet(chainName);
      setWalletInfo(result);
      setConnectionStatus('connected');
      
      // Get balance
      const bal = await walletService.getBalance();
      setBalance(bal);
      
    } catch (error) {
      console.error('Connect wallet error:', error);
      const errorInfo = formatErrorMessage(error);
      setWalletError(errorInfo);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    walletService.disconnect();
    setWalletInfo({ isConnected: false, address: null, chain: null });
    setBalance(null);
    setWalletError(null);
    setConnectionStatus('disconnected');
  };

  const parseInstruction = async () => {
    if (!inputText.trim()) {
      alert('Por favor ingresa una instrucción');
      return;
    }

    setIsLoading(true);
    setParseResult(null);
    setTransactionResult(null);

    try {
      let result;
      
      if (useAI && deepSeekService.apiKey) {
        // Use AI-enhanced parsing
        const localResult = parser.parseInstruction(inputText);
        result = await deepSeekService.enhanceParsingWithAI(localResult, inputText);
      } else {
        // Use local parsing only
        result = parser.parseInstruction(inputText);
      }

      setParseResult(result);
    } catch (error) {
      console.error('Error parsing instruction:', error);
      setParseResult({
        raw_text: inputText,
        address: "",
        address_valid: false,
        chain: "unknown",
        amount: { original: "", numeric: null, unit: null },
        need_clarification: true,
        clarifying_questions: ["Error procesando la instrucción"],
        intent: "other",
        confidence: 0.1,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTransaction = async () => {
    if (!parseResult || !walletInfo.isConnected) {
      alert('Necesitas conectar tu wallet y tener una instrucción parseada');
      return;
    }

    if (parseResult.need_clarification || parseResult.intent !== 'send') {
      alert('La instrucción necesita clarificación o no es para enviar tokens');
      return;
    }

    // Validate chain compatibility
    if (parseResult.chain !== 'unknown' && parseResult.chain !== walletInfo.chain) {
      const switchChain = confirm(`¿Quieres cambiar a la red ${parseResult.chain}?`);
      if (switchChain) {
        try {
          await walletService.switchChain(parseResult.chain);
          setWalletInfo(walletService.getWalletInfo());
        } catch (error) {
          alert(`Error cambiando red: ${error.message}`);
          return;
        }
      } else {
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await walletService.sendTokens(
        parseResult.address,
        parseResult.amount.numeric,
        parseResult.amount.unit || 'TIA',
        `Sent via dApp: ${parseResult.raw_text.substring(0, 100)}`
      );

      setTransactionResult(result);
      
      // Refresh balance
      const newBalance = await walletService.getBalance();
      setBalance(newBalance);
      
    } catch (error) {
      alert(`Error enviando transacción: ${error.message}`);
      setTransactionResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para que el chat ejecute transacciones
  const handleChatTransaction = async (toAddress, amount, unit) => {
    try {
      console.log('🚀 Chat transaction initiated:', { toAddress, amount, unit });
      
      // Determinar la red basada en la unidad
      const chainName = unit.toLowerCase() === 'mocha' ? 'mocha' : 'celestia';
      
      // Auto-conectar si no está conectado o está en red incorrecta
      if (!walletInfo.isConnected || walletInfo.chain !== chainName) {
        console.log(`🔗 Auto-connecting to ${chainName}...`);
        await connectWallet(chainName);
        
        // Verificar que la conexión fue exitosa
        if (!walletService.getWalletInfo().isConnected) {
          throw new Error('Falló la conexión automática del wallet');
        }
      }
      
      // Ejecutar transacción
      console.log('💸 Executing transaction...');
      const result = await walletService.sendTokens(
        toAddress,
        amount,
        unit,
        `Sent via Celestia Chatbot Assistant`
      );
      
      // Actualizar balance
      const newBalance = await walletService.getBalance();
      setBalance(newBalance);
      
      console.log('✅ Transaction completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Chat transaction error:', error);
      throw error;
    }
  };

  const formatBalance = (balance) => {
    if (!balance) return '0';
    const amount = parseInt(balance.amount) / 1000000; // Convert utia to TIA
    return `${amount.toFixed(6)} TIA`;
  };

  return (
    <div className="container">
        
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent text-center mb-4 tracking-wide drop-shadow-lg">
        🌟 Celestia Token Sender Assistant
      </h1>
      <p className="text-lg md:text-xl text-gray-300 text-center max-w-2xl mx-auto leading-relaxed mb-8 font-light">
        Chatbot inteligente para enviar tokens TIA usando{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-semibold">
          lenguaje natural
        </span>
      </p>
      
      <ChatInterface 
        onSendTransaction={handleChatTransaction}
        walletInfo={walletInfo}
        isConnected={walletInfo.isConnected}
      />

      {/* Status minimal en la parte inferior */}
      {walletInfo.isConnected && (
        <div className="wallet-status-mini">
          <span>👛 {walletInfo.address?.substring(0, 10)}...{walletInfo.address?.substring(walletInfo.address.length - 6)}</span>
          <span>🌐 {walletInfo.chain}</span>
          {balance && <span>💰 {formatBalance(balance)}</span>}
        </div>
      )}

      {/* Error display if needed */}
      {walletError && (
        <div className="error-message-mini">
          <strong>{walletError.title}:</strong> {walletError.message}
          {walletError.type === 'KEPLR_NOT_INSTALLED' && (
            <a 
              href={KEPLR_INSTALLATION_GUIDE.downloadUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="button small"
            >
              Instalar Keplr
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default App;