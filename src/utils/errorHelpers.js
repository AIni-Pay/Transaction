export const KEPLR_INSTALLATION_GUIDE = {
  title: "Keplr Wallet No Detectado",
  message: "Para usar esta dApp necesitas tener Keplr Wallet instalado.",
  steps: [
    "1. Ve a https://wallet.keplr.app/",
    "2. Descarga e instala la extensión para tu navegador",
    "3. Crea una nueva wallet o importa una existente",
    "4. Recarga esta página y conecta tu wallet"
  ],
  downloadUrl: "https://wallet.keplr.app/"
};

export const NETWORK_ENDPOINTS = {
  celestia: {
    name: "Celestia Mainnet",
    primary: "https://rpc.celestia.pops.one",
    fallbacks: [
      "https://celestia-rpc.chainode.tech:33373",
      "https://celestia-mainnet-rpc.itrocket.net:443",
      "https://celestia.rpc.kjnodes.com"
    ]
  },
  mocha: {
    name: "Mocha Testnet",
    primary: "https://rpc-mocha.pops.one",
    fallbacks: [
      "https://celestia-testnet-rpc.itrocket.net:443",
      "https://rpc-celestia-testnet-01.stakeflow.io",
      "https://celestia-testnet.brightlystake.com"
    ]
  }
};

export const ERROR_MESSAGES = {
  KEPLR_NOT_INSTALLED: "Keplr wallet no está instalado",
  FAILED_TO_FETCH: "Error de conexión de red",
  NO_ACCOUNTS: "No se encontraron cuentas en Keplr",
  CHAIN_NOT_SUPPORTED: "Cadena no soportada",
  INSUFFICIENT_FUNDS: "Fondos insuficientes",
  INVALID_ADDRESS: "Dirección inválida",
  TRANSACTION_FAILED: "Transacción falló",
  NETWORK_ERROR: "Error de red"
};

export const formatErrorMessage = (error) => {
  const message = error.message || error.toString();
  
  if (message.includes("Failed to fetch")) {
    return {
      type: "NETWORK_ERROR",
      title: "Error de Conexión",
      message: "No se pudo conectar a la red Celestia. Esto puede deberse a:",
      suggestions: [
        "Problemas temporales con los endpoints RPC",
        "Conectividad de internet",
        "Firewall o proxy bloqueando la conexión"
      ],
      actions: [
        "Verifica tu conexión a internet",
        "Intenta de nuevo en unos segundos",
        "Prueba con la red Mocha testnet si estás usando Celestia mainnet"
      ]
    };
  }
  
  if (message.includes("User rejected")) {
    return {
      type: "USER_REJECTED",
      title: "Conexión Cancelada",
      message: "Conexión cancelada por el usuario",
      suggestions: ["Acepta la conexión en Keplr para continuar"]
    };
  }
  
  if (message.includes("does not exist")) {
    return {
      type: "KEPLR_NOT_INSTALLED",
      title: "Keplr No Instalado",
      message: "Keplr wallet no está instalado o no está disponible",
      suggestions: [
        "Instala Keplr desde https://wallet.keplr.app/",
        "Asegúrate de que la extensión esté habilitada",
        "Recarga la página después de instalar"
      ]
    };
  }
  
  return {
    type: "UNKNOWN_ERROR",
    title: "Error Desconocido",
    message: message,
    suggestions: [
      "Intenta refrescar la página",
      "Revisa la consola del navegador para más detalles"
    ]
  };
};