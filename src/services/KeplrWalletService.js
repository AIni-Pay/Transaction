import { SigningStargateClient } from '@cosmjs/stargate';
import { coins } from '@cosmjs/proto-signing';

export class KeplrWalletService {
  constructor() {
    this.chainConfigs = {
      celestia: {
        chainId: 'celestia',
        chainName: 'Celestia',
        rpc: 'https://celestia-mainnet-rpc.itrocket.net:443',
        rest: 'https://celestia-mainnet-api.itrocket.net:443',
        bip44: { coinType: 118 },
        bech32Config: {
          bech32PrefixAccAddr: 'celestia',
          bech32PrefixAccPub: 'celestiapub',
          bech32PrefixValAddr: 'celestiavaloper',
          bech32PrefixValPub: 'celestiavaloperpub',
          bech32PrefixConsAddr: 'celestiavalcons',
          bech32PrefixConsPub: 'celestiavalconspub',
        },
        currencies: [{
          coinDenom: 'TIA',
          coinMinimalDenom: 'utia',
          coinDecimals: 6,
        }],
        feeCurrencies: [{
          coinDenom: 'TIA',
          coinMinimalDenom: 'utia',
          coinDecimals: 6,
          gasPriceStep: { low: 0.01, average: 0.025, high: 0.04 },
        }],
        stakeCurrency: {
          coinDenom: 'TIA',
          coinMinimalDenom: 'utia',
          coinDecimals: 6,
        },
      },
      mocha: {
        chainId: 'mocha-4',
        chainName: 'Celestia Mocha Testnet',
        rpc: 'https://celestia-testnet-rpc.itrocket.net:443',
        rest: 'https://celestia-testnet-api.itrocket.net:443',
        bip44: { coinType: 118 },
        bech32Config: {
          bech32PrefixAccAddr: 'celestia',
          bech32PrefixAccPub: 'celestiapub',
          bech32PrefixValAddr: 'celestiavaloper',
          bech32PrefixValPub: 'celestiavaloperpub',
          bech32PrefixConsAddr: 'celestiavalcons',
          bech32PrefixConsPub: 'celestiavalconspub',
        },
        currencies: [{
          coinDenom: 'TIA',
          coinMinimalDenom: 'utia',
          coinDecimals: 6,
        }],
        feeCurrencies: [{
          coinDenom: 'TIA',
          coinMinimalDenom: 'utia',
          coinDecimals: 6,
          gasPriceStep: { low: 0.1, average: 0.25, high: 0.4 },
        }],
        stakeCurrency: {
          coinDenom: 'TIA',
          coinMinimalDenom: 'utia',
          coinDecimals: 6,
        },
      }
    };
    
    this.isConnected = false;
    this.currentChain = null;
    this.address = null;
    this.signingClient = null;
  }

  async isKeplrAvailable() {
    return typeof window !== 'undefined' && !!window.keplr;
  }

  async connectWallet(chainName = 'celestia') {
    if (!await this.isKeplrAvailable()) {
      throw new Error('Keplr wallet no está instalado. Por favor instala Keplr desde https://wallet.keplr.app/');
    }

    const chainConfig = this.chainConfigs[chainName];
    if (!chainConfig) {
      throw new Error(`Chain ${chainName} no soportada`);
    }

    try {
      // First try to suggest the chain to Keplr
      try {
        await window.keplr.experimentalSuggestChain(chainConfig);
      } catch (suggestError) {
        console.log('Chain suggestion failed, continuing with connection...');
        // Continue even if suggest fails, it might already be added
      }
      
      // Enable the chain
      await window.keplr.enable(chainConfig.chainId);
      
      // Get the offline signer
      const offlineSigner = await window.keplr.getOfflineSigner(chainConfig.chainId);
      
      // Get accounts
      const accounts = await offlineSigner.getAccounts();
      
      if (accounts.length === 0) {
        throw new Error('No se encontraron cuentas en Keplr');
      }

      this.address = accounts[0].address;
      this.currentChain = chainName;
      this.isConnected = true;

      // Create signing client with multiple endpoint fallbacks
      const endpoints = this.getEndpointFallbacks(chainName);
      let signingClient = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Intentando conectar a: ${endpoint}`);
          signingClient = await SigningStargateClient.connectWithSigner(
            endpoint,
            offlineSigner,
            {
              gasPrice: `0.025${chainConfig.currencies[0].coinMinimalDenom}`,
            }
          );
          console.log(`✅ Conectado exitosamente a: ${endpoint}`);
          break;
        } catch (error) {
          console.log(`❌ Falló conexión a ${endpoint}:`, error.message);
          lastError = error;
          continue;
        }
      }

      if (!signingClient) {
        throw new Error(`No se pudo conectar a ningún endpoint. Último error: ${lastError?.message}`);
      }

      this.signingClient = signingClient;

      return {
        address: this.address,
        chain: this.currentChain,
        isConnected: this.isConnected
      };

    } catch (error) {
      console.error('Error connecting to Keplr:', error);
      throw new Error(`Error conectando a Keplr: ${error.message}`);
    }
  }

  getEndpointFallbacks(chainName) {
    if (chainName === 'celestia') {
      return [
        'https://celestia-mainnet-rpc.itrocket.net:443',
        'https://celestia-rpc.chainode.tech:33373',
        'https://celestia.rpc.kjnodes.com',
        'https://public-celestia-rpc.numia.xyz',
        'https://rpc.celestia.pops.one'
      ];
    } else if (chainName === 'mocha') {
      return [
        'https://celestia-testnet-rpc.itrocket.net:443',
        'https://testnet-celestia-rpc.lavenderfive.com:443',
        'https://rpc-celestia-mocha-4.mesa.newmetric.xyz',
        'https://rpc.celestia-mocha-4.com',
        'https://rpc-mocha.pops.one'
      ];
    }
    return [];
  }

  async getBalance(denom = 'utia') {
    if (!this.isConnected || !this.signingClient || !this.address) {
      throw new Error('Wallet no conectado');
    }

    try {
      const balance = await this.signingClient.getBalance(this.address, denom);
      return balance;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error(`Error obteniendo balance: ${error.message}`);
    }
  }

  async sendTokens(toAddress, amount, denom = 'utia', memo = '') {
    if (!this.isConnected || !this.signingClient || !this.address) {
      throw new Error('Wallet no conectado');
    }

    try {
      console.log('💸 Sending tokens:', { 
        from: this.address, 
        to: toAddress, 
        amount, 
        denom, 
        memo 
      });

      // Convert amount to proper format
      const sendAmount = this.formatAmount(amount, denom);
      console.log('💸 Formatted send amount:', sendAmount);
      
      // Create the send message with more appropriate fees
      const fee = {
        amount: coins(1000, 'utia'), // 0.001 TIA fee
        gas: '100000', // Reduced gas limit
      };

      console.log('💸 Using fee:', fee);
      console.log('💸 Executing sendTokens with:', {
        from: this.address,
        to: toAddress,
        amount: [sendAmount],
        fee,
        memo
      });

      const result = await this.signingClient.sendTokens(
        this.address,
        toAddress,
        [sendAmount],
        fee,
        memo
      );

      console.log('✅ Transaction result:', result);

      return {
        success: true,
        transactionHash: result.transactionHash,
        height: result.height,
        gasUsed: result.gasUsed,
        gasWanted: result.gasWanted
      };

    } catch (error) {
      console.error('Error sending tokens:', error);
      throw new Error(`Error enviando tokens: ${error.message}`);
    }
  }

  formatAmount(amount, unit) {
    console.log('🔢 Formatting amount:', { amount, unit });
    
    // Convert different units to the base unit (utia)
    let baseAmount;
    
    if (unit.toLowerCase() === 'tia' || unit.toLowerCase() === 'mocha') {
      // Convert TIA/Mocha to utia (1 TIA = 1,000,000 utia)
      // Note: Mocha is also denominated in TIA, so same conversion
      baseAmount = Math.floor(amount * 1000000);
      console.log('🔢 Converted TIA/Mocha to utia:', baseAmount);
    } else if (unit.toLowerCase() === 'utia') {
      baseAmount = Math.floor(amount);
      console.log('🔢 Using utia directly:', baseAmount);
    } else {
      // Default to treating as TIA for safety
      baseAmount = Math.floor(amount * 1000000);
      console.log('🔢 Unknown unit, defaulting to TIA conversion:', baseAmount);
    }

    const result = {
      denom: 'utia',
      amount: baseAmount.toString()
    };
    
    console.log('🔢 Final formatted amount:', result);
    return result;
  }

  async switchChain(chainName) {
    if (!this.isConnected) {
      throw new Error('Wallet no conectado');
    }

    try {
      await this.connectWallet(chainName);
      return {
        address: this.address,
        chain: this.currentChain,
        isConnected: this.isConnected
      };
    } catch (error) {
      throw new Error(`Error cambiando cadena: ${error.message}`);
    }
  }

  disconnect() {
    this.isConnected = false;
    this.currentChain = null;
    this.address = null;
    this.signingClient = null;
  }

  getWalletInfo() {
    return {
      isConnected: this.isConnected,
      address: this.address,
      chain: this.currentChain
    };
  }

  // Validate if an address matches the current chain
  validateAddressForChain(address, chainName) {
    const chainConfig = this.chainConfigs[chainName];
    if (!chainConfig) return false;

    const prefix = chainConfig.bech32Config.bech32PrefixAccAddr;
    return address.startsWith(prefix + '1');
  }
}