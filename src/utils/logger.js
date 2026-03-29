/**
 * 🚀 PROJETO: SAC-1C (Student Activity Control)
 * 👤 AUTOR: Rafael Magalhães
 * 📅 VERSÃO: 1.0.0
 * 🛠️ DESCRIÇÃO: Sistema de Auditoria e Logging (Ações e Erros)
 */

const fs = require('fs')
const path = require('path')

const LOG_DIR = path.join(__dirname, '../../logs')
const LOG_FILE = path.join(LOG_DIR, 'acoes.log')

// Garante que o diretório de logs existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

/**
 * Registra uma ação no arquivo de log
 * @param {string} usuario - ID/número do usuário
 * @param {string} acao - Tipo de ação (add, delete, list, etc)
 * @param {string} detalhes - Detalhes adicionais
 * @param {boolean} sucesso - Se a ação foi bem-sucedida
 */
function registrarAcao(usuario, acao, detalhes, sucesso = true) {
  const timestamp = new Date().toISOString()
  const status = sucesso ? '✅' : '❌'
  const log = `${status} [${timestamp}] ${usuario} - ${acao} - ${detalhes}\n`

  try {
    fs.appendFileSync(LOG_FILE, log)
  } catch (erro) {
    console.error('❌ Erro ao escrever no log:', erro)
  }
}

/**
 * Registra um erro
 * @param {string} contexto - Onde o erro ocorreu
 * @param {Error} erro - O objeto de erro
 */
function registrarErro(contexto, erro) {
  const timestamp = new Date().toISOString()
  const log = `⚠️ [${timestamp}] ERRO em ${contexto}\n   Mensagem: ${erro.message}\n   Stack: ${erro.stack}\n\n`

  try {
    fs.appendFileSync(LOG_FILE, log)
    console.error(`⚠️ Erro em ${contexto}:`, erro.message)
  } catch (e) {
    console.error('❌ Erro ao registrar erro:', e)
  }
}

module.exports = {
  registrarAcao,
  registrarErro
}
