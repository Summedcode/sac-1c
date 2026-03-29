/**
 * Rotas da API para Tarefas
 * GET, POST, PUT, DELETE tarefas
 */

const express = require('express')
const router = express.Router()
const {
  adicionarTarefa,
  getTarefasHoje,
  getTarefasSemana,
  getProvas,
  deletarTarefaPorId,
  marcarConcluida,
  getEstatisticas
} = require('../../tasks/taskService')
const { obterBanco } = require('../../database')
const { registrarAcao } = require('../../utils/logger')

// ─────────────────────────────────────
// GET /api/tarefas — Listar todas
// ─────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = obterBanco()
    const tarefas = db.prepare('SELECT * FROM tarefas ORDER BY data_vencimento').all()

    res.json({
      sucesso: true,
      total: tarefas.length,
      dados: tarefas
    })

    registrarAcao('API', 'listar_tarefas', `${tarefas.length} tarefas listadas`)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// GET /api/tarefas/hoje — Tarefas de hoje
// ─────────────────────────────────────
router.get('/hoje', (req, res) => {
  try {
    const tarefas = getTarefasHoje()

    res.json({
      sucesso: true,
      data: new Date().toISOString().split('T')[0],
      total: tarefas.length,
      dados: tarefas
    })
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// GET /api/tarefas/semana — Tarefas da semana
// ─────────────────────────────────────
router.get('/semana', (req, res) => {
  try {
    const tarefas = getTarefasSemana()

    res.json({
      sucesso: true,
      periodo: `${new Date().toISOString().split('T')[0]} para próximos 7 dias`,
      total: tarefas.length,
      dados: tarefas
    })
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// GET /api/tarefas/provas — Listar provas
// ─────────────────────────────────────
router.get('/provas', (req, res) => {
  try {
    const provas = getProvas()

    res.json({
      sucesso: true,
      total: provas.length,
      dados: provas
    })
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// GET /api/tarefas/stats — Estatísticas
// ─────────────────────────────────────
router.get('/stats', (req, res) => {
  try {
    const stats = getEstatisticas()

    res.json({
      sucesso: true,
      ...stats
    })
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// GET /api/tarefas/:id — Tarefa específica
// ─────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = obterBanco()
    const tarefa = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(req.params.id)

    if (!tarefa) {
      return res.status(404).json({ erro: `Tarefa ${req.params.id} não encontrada` })
    }

    res.json({
      sucesso: true,
      dados: tarefa
    })
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// POST /api/tarefas — Criar nova tarefa
// ─────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { descricao, materia, tipo, data_vencimento, prioridade = 'normal', criado_por } = req.body

    // Validações
    if (!descricao) {
      return res.status(400).json({ erro: 'descricao é obrigatória' })
    }

    const id = adicionarTarefa(descricao, materia, tipo, data_vencimento, criado_por || 'api', prioridade)

    res.status(201).json({
      sucesso: true,
      id,
      mensagem: 'Tarefa criada com sucesso'
    })

    registrarAcao('API', 'criar_tarefa', `Tarefa #${id} criada: ${descricao}`)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// PUT /api/tarefas/:id — Editar tarefa
// ─────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const db = obterBanco()
    const { descricao, materia, tipo, data_vencimento, prioridade } = req.body

    const campos = []
    const valores = []

    if (descricao !== undefined) {
      campos.push('descricao = ?')
      valores.push(descricao)
    }
    if (materia !== undefined) {
      campos.push('materia = ?')
      valores.push(materia)
    }
    if (tipo !== undefined) {
      campos.push('tipo = ?')
      valores.push(tipo)
    }
    if (data_vencimento !== undefined) {
      campos.push('data_vencimento = ?')
      valores.push(data_vencimento)
    }
    if (prioridade !== undefined) {
      campos.push('prioridade = ?')
      valores.push(prioridade)
    }

    if (campos.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar' })
    }

    valores.push(req.params.id)
    const resultado = db.prepare(`UPDATE tarefas SET ${campos.join(', ')} WHERE id = ?`).run(...valores)

    if (resultado.changes === 0) {
      return res.status(404).json({ erro: `Tarefa ${req.params.id} não encontrada` })
    }

    res.json({
      sucesso: true,
      mensagem: 'Tarefa atualizada com sucesso'
    })

    registrarAcao('API', 'editar_tarefa', `Tarefa #${req.params.id} atualizada`)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// POST /api/tarefas/:id/concluir — Marcar como feita
// ─────────────────────────────────────
router.post('/:id/concluir', (req, res) => {
  try {
    const resultado = marcarConcluida(req.params.id)

    if (!resultado.sucesso) {
      return res.status(404).json({ erro: resultado.mensagem })
    }

    res.json({
      sucesso: true,
      mensagem: 'Tarefa marcada como concluída'
    })

    registrarAcao('API', 'concluir_tarefa', `Tarefa #${req.params.id} concluída`)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// DELETE /api/tarefas/:id — Deletar tarefa
// ─────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const resultado = deletarTarefaPorId(req.params.id)

    if (!resultado.sucesso) {
      return res.status(404).json({ erro: resultado.mensagem })
    }

    res.json({
      sucesso: true,
      mensagem: 'Tarefa deletada com sucesso'
    })

    registrarAcao('API', 'deletar_tarefa', `Tarefa #${req.params.id} deletada`)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

module.exports = router
