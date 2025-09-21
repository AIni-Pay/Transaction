import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class TransactionService {
  /**
   * Guarda una transacción en la base de datos
   * @param {Object} transactionData - Datos de la transacción
   * @param {string} transactionData.walletEmisor - Dirección del emisor
   * @param {string} transactionData.walletReceptor - Dirección del receptor
   * @param {string} transactionData.estado - Estado de la transacción ('pendiente', 'progreso', 'completado')
   * @param {number} transactionData.monto - Monto de la transferencia
   * @param {string} transactionData.linkVerificacion - Link al explorador de blockchain
   * @returns {Promise<Object>} Resultado de la operación
   */
  async saveTransaction(transactionData) {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .insert([{
          wallet_emisor: transactionData.walletEmisor,
          wallet_receptor: transactionData.walletReceptor,
          estado: transactionData.estado,
          monto: transactionData.monto,
          fecha: new Date().toISOString(),
          link_verificacion: transactionData.linkVerificacion
        }])
        .select();

      if (error) {
        throw new Error(`Error guardando transacción: ${error.message}`);
      }

      console.log('✅ Transacción guardada en BD:', data[0]);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('❌ Error guardando transacción:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene todas las transacciones de una wallet específica
   * @param {string} walletAddress - Dirección de la wallet
   * @returns {Promise<Array>} Lista de transacciones
   */
  async getTransactionsByWallet(walletAddress) {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .or(`wallet_emisor.eq.${walletAddress},wallet_receptor.eq.${walletAddress}`)
        .order('fecha', { ascending: false });

      if (error) {
        throw new Error(`Error obteniendo transacciones: ${error.message}`);
      }

      console.log(`📋 Transacciones obtenidas para ${walletAddress}:`, data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error obteniendo transacciones:', error);
      return [];
    }
  }

  /**
   * Actualiza el estado de una transacción
   * @param {string} transactionId - ID de la transacción
   * @param {string} estado - Nuevo estado
   * @param {string} linkVerificacion - Link de verificación (opcional)
   * @returns {Promise<Object>} Resultado de la operación
   */
  async updateTransactionStatus(transactionId, estado, linkVerificacion = null) {
    try {
      const updateData = { estado };
      if (linkVerificacion) {
        updateData.link_verificacion = linkVerificacion;
      }

      const { data, error } = await supabase
        .from('transacciones')
        .update(updateData)
        .eq('id', transactionId)
        .select();

      if (error) {
        throw new Error(`Error actualizando transacción: ${error.message}`);
      }

      console.log('✅ Transacción actualizada:', data[0]);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('❌ Error actualizando transacción:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene una transacción por ID
   * @param {string} transactionId - ID de la transacción
   * @returns {Promise<Object|null>} Datos de la transacción
   */
  async getTransactionById(transactionId) {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) {
        throw new Error(`Error obteniendo transacción: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error obteniendo transacción por ID:', error);
      return null;
    }
  }

  /**
   * Formatea una dirección para mostrar
   * @param {string} address - Dirección completa
   * @returns {string} Dirección formateada
   */
  formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 10)}...${address.substring(address.length - 6)}`;
  }

  /**
   * Formatea un monto para mostrar
   * @param {number} amount - Monto
   * @returns {string} Monto formateado
   */
  formatAmount(amount) {
    return Number(amount).toFixed(6);
  }

  /**
   * Formatea una fecha para mostrar
   * @param {string} fecha - Fecha en formato ISO
   * @returns {string} Fecha formateada
   */
  formatDate(fecha) {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}