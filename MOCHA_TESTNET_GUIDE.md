# 🧪 Guía para Celestia Mocha Testnet

## 🎯 Problema: Transacciones no llegan a destino

Si las transacciones parecen procesarse pero no llegan a la billetera de destino en Celestia Mocha Testnet, estos son los puntos a verificar:

## ✅ Configuración Correcta para Mocha Testnet

### 🌐 Endpoints RPC Actualizados (2025)

Los siguientes endpoints están activos y verificados:

```javascript
Principales:
- https://rpc.celestia-mocha-4.com
- https://rpc-mocha.pops.one  
- https://celestia-testnet-rpc.itrocket.net:443

Alternativos:
- https://rpc-celestia-mocha-4.mesa.newmetric.xyz
- https://testnet-celestia-rpc.lavenderfive.com:443
```

### 🔗 Configuración de Red Mocha

```javascript
{
  chainId: 'mocha-4',
  chainName: 'Celestia Mocha Testnet',
  rpc: 'https://rpc.celestia-mocha-4.com',
  rest: 'https://api.celestia-mocha-4.com',
  bech32PrefixAccAddr: 'celestia',
  coinDenom: 'TIA',
  coinMinimalDenom: 'utia',
  coinDecimals: 6
}
```

## 🔍 Cómo Verificar que Todo Funciona

### 1. Verificar RPC Status
```bash
curl https://rpc.celestia-mocha-4.com/status
```

### 2. Verificar en Block Explorer
- **Mintscan**: https://mintscan.io/celestia-testnet
- **Celenium**: https://mocha-4.celenium.io/

### 3. Verificar Dirección de Destino
- Las direcciones deben empezar con `celestia1...`
- Usar validador bech32 para verificar formato

### 4. Verificar Tokens de Testnet
```bash
# Obtener tokens gratis desde:
https://faucet.celestia-mocha-4.com/
# O desde:
https://celenium.io/faucet
```

## 🚨 Problemas Comunes y Soluciones

### ❌ "Transacción exitosa pero no llega"

**Posibles causas:**
1. **RPC incorrecto** → Usar endpoints actualizados arriba
2. **Chain ID incorrecto** → Debe ser exactamente `mocha-4`
3. **Dirección inválida** → Verificar formato bech32
4. **Red incorrecta en Keplr** → Asegurar que Keplr esté en Mocha-4

**Solución:**
```javascript
// Verificar configuración en Keplr
await window.keplr.experimentalSuggestChain({
  chainId: 'mocha-4',
  chainName: 'Celestia Mocha Testnet',
  rpc: 'https://rpc.celestia-mocha-4.com',
  // ... resto de configuración
});
```

### ❌ "Failed to fetch" al conectar

**Solución:**
1. Verificar que los endpoints estén activos
2. Comprobar firewall/proxy
3. Usar endpoints de fallback automático

### ❌ "Gas estimation failed"

**Solución:**
```javascript
// Usar gas fijo para Mocha Testnet
const fee = {
  amount: coins(1000, 'utia'), // 0.001 TIA
  gas: '200000', // Gas más alto para testnet
};
```

## 📋 Checklist de Verificación

Antes de enviar transacciones, verificar:

- [ ] ✅ Keplr conectado a `mocha-4`
- [ ] ✅ RPC endpoint funcionando
- [ ] ✅ Dirección válida (celestia1...)
- [ ] ✅ Balance suficiente en testnet
- [ ] ✅ Gas price apropiado (0.1-0.4 utia)

## 🛠️ Comandos de Debug

### Verificar Status de Red
```bash
curl -s https://rpc.celestia-mocha-4.com/status | jq '.result.node_info.network'
```

### Verificar Balance
```bash
curl -s "https://api.celestia-mocha-4.com/cosmos/bank/v1beta1/balances/DIRECCION"
```

### Verificar Transacción
```bash
curl -s "https://api.celestia-mocha-4.com/cosmos/tx/v1beta1/txs/TX_HASH"
```

## 📖 Documentación Oficial

- **Celestia Docs**: https://docs.celestia.org/
- **Mocha Testnet**: https://docs.celestia.org/developers/mocha-testnet
- **Keplr Integration**: https://docs.keplr.app/

## 🔧 Configuración Recomendada en el Código

```javascript
// Usar en KeplrWalletService.js
const mochaConfig = {
  chainId: 'mocha-4',
  chainName: 'Celestia Mocha Testnet',
  rpc: 'https://rpc.celestia-mocha-4.com',
  rest: 'https://api.celestia-mocha-4.com',
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
};
```

## 🎯 Flujo de Testing Recomendado

1. **Obtener tokens**: Usar faucet de Mocha testnet
2. **Configurar Keplr**: Agregar red Mocha-4 manualmente si es necesario
3. **Verificar conexión**: Comprobar balance antes de enviar
4. **Transacción pequeña**: Probar con 0.001 TIA primero
5. **Verificar en explorer**: Confirmar que llegó al destino

---

**✅ Con esta configuración, las transacciones deberían llegar correctamente a la billetera de destino en Celestia Mocha Testnet.**