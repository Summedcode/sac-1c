/**
 * 🚀 PROJETO: SAC-1C (Student Activity Control)
 * 👤 AUTOR: Rafael Magalhães
 * 📅 VERSÃO: 1.0.0
 * 🛠️ DESCRIÇÃO: Sistema de Migrations (versionamento do banco)
 */

/**
 * Sistema de Migrations (versionamento do banco)
 * Permite atualizar o schema sem perder dados
 */

const MIGRATIONS = {
  1: {
    id: 1,
    descricao: 'Criação inicial: tarefas, lembretes e schema_version',
    up: (db) => {
      // V1: Cria tabelas básicas
      db.exec(`
        CREATE TABLE IF NOT EXISTS tarefas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          descricao TEXT NOT NULL,
          materia TEXT,
          tipo TEXT DEFAULT 'tarefa',
          prioridade TEXT DEFAULT 'normal',
          data_vencimento TEXT,
          criado_por TEXT,
          criado_em TEXT DEFAULT (datetime('now', 'localtime')),
          concluida INTEGER DEFAULT 0,
          concluida_em TEXT,
          ativo INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS lembretes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mensagem TEXT NOT NULL,
          criado_por TEXT,
          criado_em TEXT DEFAULT (datetime('now', 'localtime')),
          ativo INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS schema_version (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          versao INTEGER NOT NULL UNIQUE,
          descricao TEXT,
          executada_em TEXT DEFAULT (datetime('now', 'localtime'))
        );

        CREATE INDEX IF NOT EXISTS idx_tarefas_materia ON tarefas(materia);
        CREATE INDEX IF NOT EXISTS idx_tarefas_data_vencimento ON tarefas(data_vencimento);
        CREATE INDEX IF NOT EXISTS idx_tarefas_concluida ON tarefas(concluida);
        CREATE INDEX IF NOT EXISTS idx_tarefas_criado_por ON tarefas(criado_por);
        CREATE INDEX IF NOT EXISTS idx_tarefas_ativo ON tarefas(ativo);
        CREATE INDEX IF NOT EXISTS idx_lembretes_ativo ON lembretes(ativo);
      `)
    }
  },

  2: {
    id: 2,
    descricao: 'Criação da tabela de bloqueios para o SAC',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS bloqueios (
          usuario_id TEXT PRIMARY KEY,
          expira_em TEXT,
          bloqueado_em TEXT DEFAULT (datetime('now', 'localtime'))
        );
      `)
    }
  },

  3: {
    id: 3,
    descricao: 'Criação da tabela de memória contextual para o SAC',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS memoria_contextual (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          informacao TEXT NOT NULL,
          data_criacao TEXT DEFAULT (datetime('now', 'localtime'))
        );
      `)
    }
  },

  4: {
    id: 4,
    descricao: 'Criação da tabela de perfis de usuários para Consciência Social',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS perfil_usuarios (
          id_whatsapp TEXT PRIMARY KEY,
          nome TEXT,
          nivel_confianca INTEGER DEFAULT 50,
          notas_do_mentor TEXT,
          ultima_interacao TEXT DEFAULT (datetime('now', 'localtime'))
        );
      `)
    }
  },

  5: {
    id: 5,
    descricao: 'Adição de data_expiracao na memoria_contextual para limpeza automática',
    up: (db) => {
      db.exec(`ALTER TABLE memoria_contextual ADD COLUMN data_expiracao TEXT;`)
    }
  }
}

/**
 * Executa migrations pendentes
 * @param {Database} db - Instância do SQLite
 */
function executarMigrations(db) {
  console.log('📋 Verificando migrations...')

  try {
    // Cria tabela schema_version se não existir
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        versao INTEGER NOT NULL UNIQUE,
        descricao TEXT,
        executada_em TEXT DEFAULT (datetime('now', 'localtime'))
      );
    `)

    // Pega a versão atual
    const ultimaVersao = db
      .prepare('SELECT versao FROM schema_version ORDER BY versao DESC LIMIT 1')
      .get()

    const versaoAtual = ultimaVersao?.versao || 0
    console.log(`   Versão atual: ${versaoAtual}`)

    // Executa migrations pendentes
    Object.entries(MIGRATIONS).forEach(([id, migration]) => {
      const numeroMigracao = parseInt(id)

      if (numeroMigracao > versaoAtual) {
        console.log(`⬆️  Executando migração #${numeroMigracao}: ${migration.descricao}`)

        try {
          migration.up(db)

          // Registra a migration
          db.prepare(`
            INSERT INTO schema_version (versao, descricao)
            VALUES (?, ?)
          `).run(numeroMigracao, migration.descricao)

          console.log(`✅ Migração #${numeroMigracao} concluída`)
        } catch (erro) {
          console.error(`❌ Erro na migração #${numeroMigracao}:`, erro.message)
          throw erro
        }
      }
    })

    const novaVersao = db
      .prepare('SELECT versao FROM schema_version ORDER BY versao DESC LIMIT 1')
      .get()

    console.log(`✅ Banco de dados atualizado para v${novaVersao.versao}`)
  } catch (erro) {
    console.error('❌ Erro ao executar migrations:', erro)
    throw erro
  }
}

/**
 * Reseta o banco para versão 0 (apenas para desenvolvimento)
 * @param {Database} db - Instância do SQLite
 */
function resetarBanco(db) {
  console.log('⚠️  Resetando banco de dados...')

  try {
    db.exec(`
      DROP TABLE IF EXISTS tarefas;
      DROP TABLE IF EXISTS lembretes;
      DROP TABLE IF EXISTS schema_version;
    `)

    console.log('✅ Banco resetado. Execute migrations novamente.')
  } catch (erro) {
    console.error('❌ Erro ao resetar banco:', erro)
  }
}

module.exports = {
  MIGRATIONS,
  executarMigrations,
  resetarBanco
}
