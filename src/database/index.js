/**
 * Inicialização e Configuração do SQLite
 * Ponto único de entrada para o banco de dados
 */

const Database = require('better-sqlite3')
const path = require('path')
const { executarMigrations } = require('./migrations')

// Caminho do banco
const DB_PATH = path.join(__dirname, '../../data/database.sqlite')

let db = null

/**
 * Inicializa a conexão com o banco de dados
 * @returns {Database} Instância do banco
 */
function inicializarBanco() {
  try {
    console.log('📦 Inicializando banco de dados...')
    console.log(`   📍 Localização: ${DB_PATH}`)

    // Conecta (cria arquivo se não existir)
    db = new Database(DB_PATH)

    // Ativa modo WAL (melhor performance)
    db.pragma('journal_mode = WAL')

    // Ativa constraints externas
    db.pragma('foreign_keys = ON')

    console.log('✅ Conexão estabelecida')

    // Executa migrations
    executarMigrations(db)

    console.log('✅ Banco de dados inicializado com sucesso!\n')

    return db
  } catch (erro) {
    console.error('❌ Erro ao inicializar banco:', erro)
    throw erro
  }
}

/**
 * Retorna a instância do banco
 * Se não estiver inicializado, inicializa
 * @returns {Database}
 */
function obterBanco() {
  if (!db) {
    console.warn('⚠️  Banco não estava inicializado. Inicializando agora...')
    return inicializarBanco()
  }
  return db
}

/**
 * Fecha a conexão com o banco
 */
function fecharBanco() {
  if (db) {
    console.log('🔒 Fechando conexão com banco...')
    db.close()
    db = null
    console.log('✅ Banco fechado')
  }
}

/**
 * Status do banco de dados
 * @returns {Object} Informações do banco
 */
function statusBanco() {
  const banco = obterBanco()

  try {
    const tarefas = banco.prepare('SELECT COUNT(*) as count FROM tarefas').get()
    const lembretes = banco.prepare('SELECT COUNT(*) as count FROM lembretes').get()
    const versao = banco.prepare('SELECT versao FROM schema_version ORDER BY versao DESC LIMIT 1').get()

    return {
      conectado: true,
      versao: versao?.versao || 0,
      tarefas: tarefas.count,
      lembretes: lembretes.count,
      localização: DB_PATH
    }
  } catch (erro) {
    return {
      conectado: false,
      erro: erro.message
    }
  }
}

module.exports = {
  inicializarBanco,
  obterBanco,
  fecharBanco,
  statusBanco
}
