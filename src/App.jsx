import React, { useState, useEffect } from 'react';
import { TokenInstructionParser } from './utils/TokenInstructionParser';
import { DeepSeekService } from './services/DeepSeekService';
import { KeplrWalletService } from './services/KeplrWalletService';
import { TransactionService } from './services/TransactionService';
import { formatErrorMessage, KEPLR_INSTALLATION_GUIDE } from './utils/errorHelpers';
import ChatInterface from './components/ChatInterface';
import img1 from './assets/logo letras IA.png';
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
  const [transactions, setTransactions] = useState([]);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [historyUpdateNotification, setHistoryUpdateNotification] = useState(false);

  // Initialize services
  const parser = new TokenInstructionParser();
  const deepSeekService = new DeepSeekService();
  const walletService = new KeplrWalletService();
  const transactionService = new TransactionService();

  useEffect(() => {
    // Check if wallet is already connected on load
    checkWalletConnection();
  }, []);

  useEffect(() => {
    // Load transactions when wallet is connected
    if (walletInfo.isConnected && walletInfo.address) {
      loadTransactionHistory();
    }
  }, [walletInfo.isConnected, walletInfo.address]);

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

  const loadTransactionHistory = async () => {
    if (!walletInfo.address) return;
    
    setLoadingTransactions(true);
    try {
      console.log('🔄 Actualizando historial de transacciones...');
      const transactions = await transactionService.getTransactionsByWallet(walletInfo.address);
      setTransactions(transactions);
      console.log('✅ Historial actualizado:', transactions.length, 'transacciones');
    } catch (error) {
      console.error('❌ Error loading transaction history:', error);
    } finally {
      setLoadingTransactions(false);
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
    let transactionId = null;
    
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

      // Guardar transacción como pendiente en BD
      const saveResult = await transactionService.saveTransaction({
        walletEmisor: walletService.getWalletInfo().address,
        walletReceptor: toAddress,
        estado: 'pendiente',
        monto: amount,
        linkVerificacion: null
      });

      if (saveResult.success) {
        transactionId = saveResult.data.id;
        console.log('💾 Transacción guardada en BD con ID:', transactionId);
      }
      
      // Actualizar estado a 'progreso'
      if (transactionId) {
        await transactionService.updateTransactionStatus(transactionId, 'progreso');
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

      // Actualizar estado a 'completado' con link de verificación
      if (transactionId && result.success) {
        const linkVerificacion = result.txHash ? 
          `https://testnet.mintscan.io/celestia-testnet/txs/${result.txHash}` : 
          null;
        
        await transactionService.updateTransactionStatus(
          transactionId, 
          'completado', 
          linkVerificacion
        );
      }

      // Recargar historial de transacciones y mostrar notificación
      await loadTransactionHistory();
      
      // Abrir automáticamente el historial y mostrar notificación
      setShowTransactionHistory(true);
      setHistoryUpdateNotification(true);
      setTimeout(() => setHistoryUpdateNotification(false), 3000);
      
      console.log('✅ Transaction completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Chat transaction error:', error);
      
      // Marcar transacción como fallida si existe
      if (transactionId) {
        await transactionService.updateTransactionStatus(transactionId, 'pendiente');
      }
      
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
      {/* Logo pequeño en la esquina superior izquierda */}
      
      
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="fixed top-1 left-7 z-50">
        <img 
          src={img1} 
          alt="Logo" 
          className="w-70 h-70 object-contain opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
        />
      </div>
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

        {/* Historial de Transacciones */}
        {walletInfo.isConnected && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                📋 Historial de Transacciones
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadTransactionHistory}
                  disabled={loadingTransactions}
                  className={`px-3 py-2 rounded-lg transition-colors backdrop-blur-sm border flex items-center gap-2 text-sm ${
                    loadingTransactions 
                      ? 'bg-gray-500/20 border-gray-500/30 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30'
                  }`}
                  title="Actualizar historial"
                >
                  {loadingTransactions ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      🔄 Actualizar
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowTransactionHistory(!showTransactionHistory)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm border border-white/20"
                >
                  {showTransactionHistory ? 'Ocultar' : 'Mostrar'} ({transactions.length})
                </button>
              </div>
            </div>

            {showTransactionHistory && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-xl">
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/70 text-lg">
                      🚀 No hay transacciones aún. ¡Realiza tu primera transacción!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {transactions.map((tx) => (
                      <div 
                        key={tx.id} 
                        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                tx.estado === 'completado' ? 'bg-green-500/20 text-green-300' :
                                tx.estado === 'progreso' ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}>
                                {tx.estado === 'completado' ? '✅' : tx.estado === 'progreso' ? '⏳' : '⏸️'} {tx.estado}
                              </span>
                              <span className="text-white/70 text-sm">
                                {transactionService.formatDate(tx.fecha)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-white/50">Enviado:</span>
                                <span className="text-white ml-2 font-mono">
                                  {transactionService.formatAmount(tx.monto)} TIA
                                </span>
                              </div>
                              
                              <div>
                                <span className="text-white/50">A:</span>
                                <span className="text-cyan-300 ml-2 font-mono">
                                  {transactionService.formatAddress(tx.wallet_receptor)}
                                </span>
                              </div>
                              
                              <div>
                                <span className="text-white/50">Desde:</span>
                                <span className="text-purple-300 ml-2 font-mono">
                                  {transactionService.formatAddress(tx.wallet_emisor)}
                                </span>
                              </div>
                              
                              {tx.link_verificacion && (
                                <div>
                                  <a 
                                    href={tx.link_verificacion} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-300 hover:text-blue-200 underline text-sm flex items-center gap-1"
                                  >
                                    🔗 Ver en Explorer
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        

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

        {/* Notificación de historial actualizado */}
        {historyUpdateNotification && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-500/90 backdrop-blur-sm border border-green-400 rounded-lg px-6 py-3 shadow-lg animate-bounce">
            <div className="text-white flex items-center gap-2">
              <span className="text-xl">✅</span>
              <span className="font-semibold">¡Historial actualizado automáticamente!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;