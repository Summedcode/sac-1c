/**
 * 🚀 PROJETO: SAC-1C (Student Activity Control)
 * 👤 AUTOR: Rafael Magalhães
 * 📅 VERSÃO: 1.0.0
 * 🛠️ DESCRIÇÃO: Inicialização e Configuração do Banco de Dados SQLite
 */

/**
 * Inicialização e Configuração do SQLite
 * Ponto único de entrada para o banco de dados
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const { executarMigrations } = require('./migrations')

// Garante que a pasta /data existe para persistência no Railway
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const DB_PATH = path.join(dataDir, 'database.sqlite')

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

    // Popula a Memória Mestra (Grade Horária)
    popularDadosFixos(db)

    console.log('✅ Banco de dados inicializado com sucesso!\n')

    return db
  } catch (erro) {
    console.error('❌ Erro ao inicializar banco:', erro)
    throw erro
  }
}

/**
 * Insere a grade horária oficial se não existir na memória contextual
 * @param {Database} db 
 */
function popularDadosFixos(db) {
  const grade1C = {
    siglas: "ITIN/ITI: Itinerário | SOC: Sociologia | MAT: Matemática | PORT: Português | QUIM: Química | FÍS: Física | ART: Artes | ING: Inglês | GEO: Geografia | HIST: História | ESP: Espanhol | ED. FIS: Educação Física | BIO: Biologia | FIL: Filosofia | PV: Projeto de Vida",
    horarios: "1ª: 07:10, 2ª: 08:00, 3ª: 08:50, 4ª: 09:40, INTERVALO: 10:30, 5ª: 10:50, 6ª: 11:40",
    segunda: "1ª SOC, 2ª MAT, 3ª MAT, 4ª PORT, 5ª QUIM, 6ª FÍS",
    terca: "1ª ITIN, 2ª PV, 3ª ITIN, 4ª ITIN, 5ª ITIN, 6ª ITIN",
    quarta: "1ª PORT, 2ª ART, 3ª ING, 4ª GEO, 5ª PORT, 6ª HIST",
    quinta: "1ª GEO, 2ª ESP, 3ª HIST, 4ª MAT, 5ª ED. FIS, 6ª QUIM",
    sexta: "1ª BIO, 2ª BIO, 3ª FIL, 4ª PORT, 5ª FÍS, 6ª MAT"
  };

  const info = `GRADE HORÁRIA OFICIAL 1C:\n${JSON.stringify(grade1C, null, 2)}`;
  db.prepare("INSERT INTO memoria_contextual (informacao) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM memoria_contextual WHERE informacao LIKE '%GRADE HORÁRIA OFICIAL%')").run(info);
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
