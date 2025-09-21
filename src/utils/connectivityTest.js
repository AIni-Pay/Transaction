// Test básico para verificar conectividad
const testEndpoints = async () => {
  const endpoints = [
    'https://rpc.celestia.pops.one',
    'https://rpc-mocha.pops.one',
    'https://celestia-mainnet-rpc.itrocket.net:443',
    'https://celestia-testnet-rpc.itrocket.net:443'
  ];

  console.log('🧪 Probando endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        console.log(`✅ ${endpoint} - OK`);
      } else {
        console.log(`❌ ${endpoint} - Error: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
};

const testKeplrAvailability = () => {
  console.log('🧪 Probando disponibilidad de Keplr...');
  
  if (typeof window !== 'undefined') {
    if (window.keplr) {
      console.log('✅ Keplr está disponible');
      console.log('Versión:', window.keplr.version || 'No disponible');
      return true;
    } else {
      console.log('❌ Keplr no está disponible');
      console.log('Por favor instala Keplr desde: https://wallet.keplr.app/');
      return false;
    }
  } else {
    console.log('❓ Ejecutándose fuera del navegador');
    return false;
  }
};

// Ejecutar tests si estamos en el navegador
if (typeof window !== 'undefined') {
  // Esperar a que el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando tests de conectividad...');
    testKeplrAvailability();
    testEndpoints();
  });
}

export { testEndpoints, testKeplrAvailability };