# 🔧 Solución de Problemas - Celestia Token Sender

## ❌ Error: "Failed to fetch" al conectar wallet

Este error es común y tiene varias posibles causiones. Aquí te explico cómo solucionarlo:

### 🔍 Causas Comunes

1. **Endpoints RPC temporalmente no disponibles**
2. **Problemas de conectividad a internet**
3. **Firewall o proxy bloqueando conexiones**
4. **Keplr no configurado correctamente**

### ✅ Soluciones Paso a Paso

#### 1. Verifica Keplr
- ✅ Keplr debe estar instalado: https://wallet.keplr.app/
- ✅ La extensión debe estar habilitada en tu navegador
- ✅ Debes tener al menos una cuenta creada

#### 2. Prueba con Mocha Testnet Primero
- 🌟 **Recomendación**: Empieza probando con Mocha testnet
- Es más estable para pruebas
- Puedes obtener tokens gratis desde: https://celenium.io/faucet

#### 3. Verifica tu Conexión
```bash
# Prueba estos comandos en tu terminal:
ping google.com
curl -I https://rpc.celestia.pops.one/status
```

#### 4. Limpia Cache del Navegador
- Ctrl + Shift + R (recarga sin cache)
- O ve a Configuración > Privacidad > Limpiar datos

#### 5. Revisa la Consola del Navegador
- F12 → Consola
- Busca mensajes de error específicos
- Los endpoints se prueban automáticamente y aparecen como ✅ o ❌

### 🌐 Endpoints Utilizados

#### Celestia Mainnet
- Primary: `https://rpc.celestia.pops.one`
- Fallback: `https://celestia-mainnet-rpc.itrocket.net:443`

#### Mocha Testnet
- Primary: `https://rpc-mocha.pops.one`
- Fallback: `https://celestia-testnet-rpc.itrocket.net:443`

### 🆘 Si Nada Funciona

1. **Intenta en una ventana de incógnito**
2. **Desactiva temporalmente extensions del navegador**
3. **Prueba en otro navegador (Chrome/Firefox)**
4. **Verifica que no tengas VPN activa**

### 📞 Obtener Ayuda

Si sigues teniendo problemas:
- Abre la consola del navegador (F12)
- Toma screenshot de los errores
- Reporta el issue con detalles específicos

### 🎯 Prueba Rápida

1. Ve a: https://celenium.io/faucet
2. Obtén tokens de testnet
3. Usa una dirección que empiece con `celestia1...`
4. Prueba la dApp con esos tokens

¡Recuerda que los tokens de testnet no tienen valor real y son solo para pruebas! 🧪