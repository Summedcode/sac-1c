/**
 * Definições das tabelas do banco de dados
 * Cada tabela é um objeto com nome e SQL de criação
 */

const SCHEMA = {
  tarefas: {
    nome: 'tarefas',
    sql: `
      CREATE TABLE IF NOT EXISTS tarefas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        materia TEXT,
        tipo TEXT DEFAULT 'tarefa',
        prioridade TEXT DEFAULT 'normal' CHECK(prioridade IN ('alta', 'normal', 'baixa')),
        data_vencimento TEXT,
        criado_por TEXT,
        criado_em TEXT DEFAULT (datetime('now', 'localtime')),
        concluida INTEGER DEFAULT 0,
        concluida_em TEXT,
        ativo INTEGER DEFAULT 1,
        
        CONSTRAINT data_valida CHECK (data_vencimento IS NULL OR datetime(data_vencimento) IS NOT NULL)
      )
    `,
    indices: [
      'CREATE INDEX IF NOT EXISTS idx_tarefas_materia ON tarefas(materia)',
      'CREATE INDEX IF NOT EXISTS idx_tarefas_data_vencimento ON tarefas(data_vencimento)',
      'CREATE INDEX IF NOT EXISTS idx_tarefas_concluida ON tarefas(concluida)',
      'CREATE INDEX IF NOT EXISTS idx_tarefas_criado_por ON tarefas(criado_por)',
      'CREATE INDEX IF NOT EXISTS idx_tarefas_ativo ON tarefas(ativo)'
    ]
  },

  lembretes: {
    nome: 'lembretes',
    sql: `
      CREATE TABLE IF NOT EXISTS lembretes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mensagem TEXT NOT NULL,
        criado_por TEXT,
        criado_em TEXT DEFAULT (datetime('now', 'localtime')),
        ativo INTEGER DEFAULT 1
      )
    `,
    indices: [
      'CREATE INDEX IF NOT EXISTS idx_lembretes_criado_por ON lembretes(criado_por)',
      'CREATE INDEX IF NOT EXISTS idx_lembretes_ativo ON lembretes(ativo)'
    ]
  },

  schema_version: {
    nome: 'schema_version',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_version (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        versao INTEGER NOT NULL UNIQUE,
        descricao TEXT,
        executada_em TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `,
    indices: []
  }
}

module.exports = SCHEMA
