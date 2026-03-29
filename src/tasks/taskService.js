/**
 * 🚀 PROJETO: SAC-1C (Student Activity Control)
 * 👤 AUTOR: Rafael Magalhães
 * 📅 VERSÃO: 1.0.0
 * 🛠️ DESCRIÇÃO: Core de serviços para Tarefas, Lembretes e Moderação
 */

// Importa o banco de dados
const { obterBanco } = require('../database')

// Função auxiliar para obter db de forma simplificada
const getDb = () => obterBanco()

// ─────────────────────────────────────
// SALVAR uma tarefa nova
// ─────────────────────────────────────
function adicionarTarefa(descricao, materia, tipo, dataVencimento, criadoPor, prioridade = 'normal') {
  const stmt = getDb().prepare(`
    INSERT INTO tarefas (descricao, materia, tipo, data_vencimento, prioridade, criado_por)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const resultado = stmt.run(descricao, materia, tipo, dataVencimento, prioridade, criadoPor)
  return resultado.lastInsertRowid
}

// ─────────────────────────────────────
// BUSCAR tarefas de hoje
// ─────────────────────────────────────
function getTarefasHoje() {
  const hoje = new Date().toISOString().split('T')[0]

  return getDb().prepare(`
    SELECT * FROM tarefas
    WHERE data_vencimento = ?
    AND concluida = 0
    ORDER BY materia
  `).all(hoje)
}

// ─────────────────────────────────────
// BUSCAR tarefas da semana
// ─────────────────────────────────────
function getTarefasSemana() {
  const hoje = new Date().toISOString().split('T')[0]

  const proxSemana = new Date()
  proxSemana.setDate(proxSemana.getDate() + 7)
  const fimSemana = proxSemana.toISOString().split('T')[0]

  return getDb().prepare(`
    SELECT * FROM tarefas
    WHERE data_vencimento BETWEEN ? AND ?
    AND concluida = 0
    ORDER BY data_vencimento, materia
  `).all(hoje, fimSemana)
}

// ─────────────────────────────────────
// BUSCAR só as provas
// ─────────────────────────────────────
function getProvas() {
  return getDb().prepare(`
    SELECT * FROM tarefas
    WHERE tipo = 'prova'
    AND concluida = 0
    ORDER BY data_vencimento
  `).all()
}

// ─────────────────────────────────────
// FORMATAR lista de tarefas para WhatsApp
// ─────────────────────────────────────
function formatarTarefas(tarefas) {
  if (tarefas.length === 0) {
    return '✅ Nenhuma tarefa encontrada.'
  }

  return tarefas.map(t => {
    const data = t.data_vencimento || 'sem data'
    const materia = t.materia || 'geral'
    const tipo = t.tipo || 'tarefa'
    const prioridade = t.prioridade || 'normal'
    
    // Emoji de prioridade
    const emojiPrioridade = prioridade === 'alta' ? '🔴' : prioridade === 'baixa' ? '🟢' : '🟡'
    
    return `📌 *${materia.toUpperCase()}* — ${t.descricao}\n   📅 ${data} | 🏷️ ${tipo} | ${emojiPrioridade} ${prioridade}`
  }).join('\n\n')
}

// ─────────────────────────────────────
// DELETAR uma tarefa por ID
// ─────────────────────────────────────
function deletarTarefaPorId(id) {
  const stmt = getDb().prepare(`
    DELETE FROM tarefas
    WHERE id = ?
  `)

  const resultado = stmt.run(id)
  
  if (resultado.changes === 0) {
    return { sucesso: false, mensagem: `❌ Tarefa ID ${id} não encontrada` }
  }
  
  return { sucesso: true, mensagem: `✅ Tarefa ID ${id} deletada com sucesso` }
}

// ─────────────────────────────────────
// DELETAR tarefas antigas
// ─────────────────────────────────────
function deletarTarefasAntigas(diasAntigos = 30, apenasConcluidasantigas = true) {
  // Calcula a data limite (X dias atrás)
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - diasAntigos)
  const dataStr = dataLimite.toISOString().split('T')[0]

  let query = 'DELETE FROM tarefas WHERE data_vencimento < ?'
  
  // Se true, deleta só as concluídas antigas
  // Se false, deleta TODAS as antigas (concluídas e não concluídas)
  if (apenasConcluidasantigas) {
    query += ' AND concluida = 1'
  }

  const stmt = getDb().prepare(query)
  const resultado = stmt.run(dataStr)
  
  return {
    deletadas: resultado.changes,
    mensagem: `🗑️ ${resultado.changes} tarefa(s) deletada(s) com ${diasAntigos}+ dias`
  }
}

// ─────────────────────────────────────
// DELETAR tarefas de uma matéria específica
// ─────────────────────────────────────
function deletarTarefasPorMateria(materia, apenasConcluidasantigas = true) {
  let query = 'DELETE FROM tarefas WHERE materia = ?'
  
  if (apenasConcluidasantigas) {
    query += ' AND concluida = 1'
  }

  const stmt = getDb().prepare(query)
  const resultado = stmt.run(materia)
  
  return {
    deletadas: resultado.changes,
    mensagem: `🗑️ ${resultado.changes} tarefa(s) de ${materia} deletada(s)`
  }
}

// ─────────────────────────────────────
// ADICIONAR lembrete novo
// ─────────────────────────────────────
function adicionarLembrete(mensagem, criadoPor) {
  const stmt = getDb().prepare(`
    INSERT INTO lembretes (mensagem, criado_por)
    VALUES (?, ?)
  `)

  const resultado = stmt.run(mensagem, criadoPor)
  return resultado.lastInsertRowid
}

// ─────────────────────────────────────
// BUSCAR todos os lembretes ativos
// ─────────────────────────────────────
function getLembretes() {
  return getDb().prepare(`
    SELECT id, mensagem, criado_em FROM lembretes
    ORDER BY criado_em DESC
  `).all()
}

// ─────────────────────────────────────
// FORMATAR lembretes para WhatsApp
// ─────────────────────────────────────
function formatarLembretes(lembretes) {
  if (lembretes.length === 0) {
    return '✅ Nenhum lembrete no momento.'
  }

  return lembretes.map(l => {
    return `🔔 *#${l.id}* — ${l.mensagem}\n   📅 ${l.criado_em}`
  }).join('\n\n')
}

// ─────────────────────────────────────
// DELETAR lembrete por ID
// ─────────────────────────────────────
function deletarLembrete(id) {
  const stmt = getDb().prepare(`
    DELETE FROM lembretes
    WHERE id = ?
  `)

  const resultado = stmt.run(id)

  if (resultado.changes === 0) {
    return { sucesso: false, mensagem: `❌ Lembrete ID ${id} não encontrado` }
  }

  return { sucesso: true, mensagem: `✅ Lembrete ID ${id} deletado` }
}

// ─────────────────────────────────────
// MARCAR tarefa como concluída
// ─────────────────────────────────────
function marcarConcluida(id) {
  const agora = new Date().toISOString()
  const stmt = getDb().prepare(`
    UPDATE tarefas
    SET concluida = 1, concluida_em = ?
    WHERE id = ?
  `)

  const resultado = stmt.run(agora, id)

  if (resultado.changes === 0) {
    return { sucesso: false, mensagem: `❌ Tarefa ID ${id} não encontrada` }
  }

  return { sucesso: true, mensagem: `✅ Tarefa ID ${id} marcada como concluída` }
}

// ─────────────────────────────────────
// BUSCAR estatísticas de tarefas
// ─────────────────────────────────────
function getEstatisticas() {
  const total = getDb().prepare('SELECT COUNT(*) as count FROM tarefas').get()
  const concluidas = getDb().prepare('SELECT COUNT(*) as count FROM tarefas WHERE concluida = 1').get()
  const pendentes = getDb().prepare('SELECT COUNT(*) as count FROM tarefas WHERE concluida = 0').get()
  const hoje = getDb().prepare(`
    SELECT COUNT(*) as count FROM tarefas
    WHERE data_vencimento = ?
    AND concluida = 0
  `).get(new Date().toISOString().split('T')[0])

  return {
    total: total.count,
    concluidas: concluidas.count,
    pendentes: pendentes.count,
    hoje: hoje.count
  }
}

function bloquearUsuario(usuarioId, minutos = null) {
  const expiraEm = minutos ? new Date(Date.now() + minutos * 60000).toISOString() : null;
  const stmt = obterBanco().prepare(`
    INSERT OR REPLACE INTO bloqueios (usuario_id, expira_em)
    VALUES (?, ?)
  `);
  stmt.run(usuarioId, expiraEm);
  return { sucesso: true, expiraEm };
}

function desbloquearUsuario(usuarioId) {
  const stmt = obterBanco().prepare('DELETE FROM bloqueios WHERE usuario_id = ?');
  const resultado = stmt.run(usuarioId);
  return { sucesso: resultado.changes > 0 };
}

function isUsuarioBloqueado(usuarioId) {
  const block = obterBanco().prepare('SELECT expira_em FROM bloqueios WHERE usuario_id = ?').get(usuarioId);
  if (!block) return false;
  if (!block.expira_em) return true;
  
  const aindaBloqueado = new Date(block.expira_em) > new Date();
  if (!aindaBloqueado) {
    desbloquearUsuario(usuarioId);
  }
  return aindaBloqueado;
}

// Exporta todas as funções para outros arquivos usarem
module.exports = {
  adicionarTarefa,
  getTarefasHoje,
  getTarefasSemana,
  getProvas,
  formatarTarefas,
  deletarTarefaPorId,
  deletarTarefasAntigas,
  deletarTarefasPorMateria,
  adicionarLembrete,
  getLembretes,
  formatarLembretes,
  deletarLembrete,
  marcarConcluida,
  getEstatisticas,
  bloquearUsuario,
  desbloquearUsuario,
  isUsuarioBloqueado
}
