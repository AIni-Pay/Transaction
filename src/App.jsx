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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
      <div className="max-w-5xl mx-auto px-6 py-8">
        
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 tracking-wide drop-shadow-2xl shadow-black/50">
          🌟 Celestia Token Sender Assistant
        </h1>
        <p className="text-lg md:text-xl text-white text-center max-w-2xl mx-auto leading-relaxed mb-8 font-light drop-shadow-lg">
          Chatbot inteligente para enviar tokens TIA usando{' '}
          <span className="text-cyan-300 font-semibold drop-shadow-md">
            lenguaje natural
          </span>
        </p>
        <div>
          <ChatInterface 
          onSendTransaction={handleChatTransaction}
          walletInfo={walletInfo}
          isConnected={walletInfo.isConnected}
        />
        </div>
        

        {/* Status minimal en la parte inferior */}
        {walletInfo.isConnected && (
          <div className="fixed bottom-6 left-6 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span>👛 {walletInfo.address?.substring(0, 10)}...{walletInfo.address?.substring(walletInfo.address.length - 6)}</span>
              <span>🌐 {walletInfo.chain}</span>
              {balance && <span>💰 {formatBalance(balance)}</span>}
            </div>
          </div>
        )}

        {/* Error display if needed */}
        {walletError && (
          <div className="fixed top-6 right-6 max-w-sm bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="text-red-800">
              <strong className="text-red-900">{walletError.title}:</strong> {walletError.message}
              {walletError.type === 'KEPLR_NOT_INSTALLED' && (
                <a 
                  href={KEPLR_INSTALLATION_GUIDE.downloadUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                >
                  Instalar Keplr
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;