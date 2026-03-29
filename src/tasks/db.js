/**
 * 🚨 DESCONTINUADO - Use src/database/index.js
 * 
 * Este arquivo é mantido por compatibilidade.
 * Todas as novas integrações devem usar a estrutura profissional em src/database/
 */

// ⚠️  LEGACY - Mantém compatibilidade com código antigo
const { obterBanco } = require('../database')

// Inicializa o banco se não estiver já
const db = obterBanco()

console.log('⚠️  [DEPRECATED] Use require("../database").obterBanco() diretamente')

// Exporta a instância para compatibilidade
module.exports = db

