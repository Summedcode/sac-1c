/**
 * Rotas da API para Lembretes
 * GET, POST, DELETE lembretes
 */

const express = require('express')
const router = express.Router()
const {
  adicionarLembrete,
  getLembretes,
  deletarLembrete
} = require('../../tasks/taskService')
const { obterBanco } = require('../../database')
const { registrarAcao } = require('../../utils/logger')

// ─────────────────────────────────────
// GET /api/lembretes — Listar todos
// ─────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = obterBanco()
    const lembretes = db.prepare('SELECT * FROM lembretes ORDER BY criado_em DESC').all()

    res.json({
      sucesso: true,
      total: lembretes.length,
      dados: lembretes
    })

    registrarAcao('API', 'listar_lembretes', `${lembretes.length} lembretes listados`)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// GET /api/lembretes/:id — Lembrete específico
// ─────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = obterBanco()
    const lembrete = db.prepare('SELECT * FROM lembretes WHERE id = ?').get(req.params.id)

    if (!lembrete) {
      return res.status(404).json({ erro: `Lembrete ${req.params.id} não encontrado` })
    }

    res.json({
      sucesso: true,
      dados: lembrete
    })
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// POST /api/lembretes — Criar novo
// ─────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { mensagem, criado_por } = req.body

    // Validações
    if (!mensagem) {
      return res.status(400).json({ erro: 'mensagem é obrigatória' })
    }

    const id = adicionarLembrete(mensagem, criado_por || 'api')

    res.status(201).json({
      sucesso: true,
      id,
      mensagem: 'Lembrete criado com sucesso'
    })

    registrarAcao('API', 'criar_lembrete', `Lembrete #${id} criado`)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// DELETE /api/lembretes/:id — Deletar
// ─────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const resultado = deletarLembrete(req.params.id)

    if (!resultado.sucesso) {
      return res.status(404).json({ erro: resultado.mensagem })
    }

    res.json({
      sucesso: true,
      mensagem: 'Lembrete deletado com sucesso'
    })

    registrarAcao('API', 'deletar_lembrete', `Lembrete #${req.params.id} deletado`)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

module.exports = router
