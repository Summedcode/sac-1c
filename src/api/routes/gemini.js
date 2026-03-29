/**
 * 🚀 PROJETO: SAC-1C (Student Activity Control)
 * 👤 AUTOR: Rafael Magalhães
 * 📅 VERSÃO: 1.0.0
 * 🛠️ DESCRIÇÃO: Rotas da API para Integração com Gemini (Google)
 */

/**
 * Rotas da API para Integração com Gemini (Google)
 * Similar aos endpoints IA, mas específico para Gemini
 */

const express = require('express')
const router = express.Router()
const { adicionarTarefa, getEstatisticas } = require('../../tasks/taskService')
const { obterBanco } = require('../../database')
const { registrarAcao } = require('../../utils/logger')

// Middleware de proteção simples
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'] || req.body.token_verificacao
  const tokenEsperado = process.env.API_TOKEN || 'sac1c_bot_2025'
  
  if (token !== tokenEsperado && token !== `Bearer ${tokenEsperado}`) {
    return res.status(401).json({ erro: 'Não autorizado. Token inválido.' })
  }
  next()
}

// ─────────────────────────────────────
// POST /api/gemini/gerar-tarefas — Recebe tarefas geradas por Gemini
// ─────────────────────────────────────
/**
 * Endpoint automático para Gemini enviar tarefas geradas
 * 
 * Formato esperado:
 * {
 *   "tarefas": [
 *     {
 *       "descricao": "Ler capítulos 3-5",
 *       "materia": "Física",
 *       "tipo": "estudo",
 *       "prioridade": "alta",
 *       "data_vencimento": "2025-04-15"
 *     }
 *   ]
 * }
 */
router.post('/gerar-tarefas', verificarToken, (req, res, next) => {
  try {
    const { tarefas } = req.body

    // Validações
    if (!tarefas || !Array.isArray(tarefas)) {
      return res.status(400).json({
        erro: 'Campo "tarefas" deve ser um array',
        exemplo: {
          tarefas: [
            {
              descricao: 'string (obrigatória)',
              materia: 'string (opcional)',
              tipo: 'prova|tarefa|estudo',
              prioridade: 'alta|normal|baixa',
              data_vencimento: 'YYYY-MM-DD'
            }
          ]
        }
      })
    }

    if (tarefas.length === 0) {
      return res.status(400).json({ erro: 'Array de tarefas vazio' })
    }

    const resultados = []
    const erros = []

    tarefas.forEach((tarefa, indice) => {
      try {
        // Validações
        if (!tarefa.descricao) {
          erros.push({ indice, erro: 'descricao é obrigatória' })
          return
        }

        // Sanitização
        const descricao = String(tarefa.descricao).slice(0, 500)
        const materia = String(tarefa.materia || 'geral').slice(0, 100)
        const tipo = String(tarefa.tipo || 'tarefa').slice(0, 50)
        const prioridade = ['alta', 'normal', 'baixa'].includes(tarefa.prioridade)
          ? tarefa.prioridade
          : 'normal'
        const data_vencimento = tarefa.data_vencimento || null

        // Cria a tarefa
        const id = adicionarTarefa(
          descricao,
          materia,
          tipo,
          data_vencimento,
          'ia:gemini',
          prioridade
        )

        resultados.push({
          indice,
          id,
          descricao: descricao.slice(0, 50) + '...'
        })

        // Log
        registrarAcao('Gemini', 'tarefa_criada', `Tarefa #${id}: ${descricao.slice(0, 50)}`)
      } catch (erro) {
        erros.push({ indice, erro: erro.message })
        registrarAcao('Gemini', 'erro_tarefa', `Erro em tarefa ${indice}: ${erro.message}`)
      }
    })

    // Resposta
    res.status(201).json({
      sucesso: true,
      modelo: 'gemini-2.0-flash',
      origem: 'gemini_api',
      total_requisitado: tarefas.length,
      criadas: resultados.length,
      erros: erros.length,
      dados: {
        criadas: resultados,
        erros: erros.length > 0 ? erros : undefined
      }
    })

    registrarAcao(
      'Gemini',
      'lote_tarefas',
      `${resultados.length}/${tarefas.length} tarefas criadas`
    )
  } catch (erro) {
    next(erro)
  }
})

// ─────────────────────────────────────
// GET /api/gemini/progresso — Dados para Gemini analisar
// ─────────────────────────────────────
router.get('/progresso', verificarToken, (req, res, next) => {
  try {
    const stats = getEstatisticas()
    const db = obterBanco()
    const por_materia = db.prepare(`
      SELECT materia, COUNT(*) as total, SUM(concluida) as feitas 
      FROM tarefas GROUP BY materia
    `).all()

    res.json({
      sucesso: true,
      dados: { ...stats, por_materia },
      instrucoes:
        'Use esses dados para gerar tarefas. Retorne um JSON com array "tarefas"'
    })

    registrarAcao('Gemini', 'consulta_progresso', 'Progresso consultado')
  } catch (erro) {
    next(erro)
  }
})

// ─────────────────────────────────────
// POST /api/gemini/resumo — Gera resumo formatado para IA
// ─────────────────────────────────────
router.post('/resumo', verificarToken, (req, res, next) => {
  try {
    // Segurança: evita crash se o body estiver vazio
    const { tipo = 'semana' } = req.body || {}
    const db = obterBanco()
    let tarefas
    const hoje = new Date().toISOString().split('T')[0]

    if (tipo === 'hoje') {
      tarefas = db.prepare(`
        SELECT * FROM tarefas 
        WHERE data_vencimento = ? AND concluida = 0 
        ORDER BY prioridade DESC
      `).all(hoje)
    } else {
      const semana = new Date()
      semana.setDate(semana.getDate() + 7)
      const fimSemana = semana.toISOString().split('T')[0]

      tarefas = db.prepare(`
        SELECT * FROM tarefas 
        WHERE data_vencimento BETWEEN ? AND ? AND concluida = 0 
        ORDER BY data_vencimento, prioridade DESC
      `).all(hoje, fimSemana)
    }

    // Formata o resumo para a IA
    const prompt = `
# Tarefas de Estudo - ${tipo.toUpperCase()}

${tarefas.map((t, i) => `
${i + 1}. **${t.materia.toUpperCase()}** - ${t.tipo}
   - Descrição: ${t.descricao}
   - Vencimento: ${t.data_vencimento || 'sem data'}
   - Prioridade: ${t.prioridade}
`).join('\n')}

Por favor, analise este progresso e sugira melhorias.
`
    res.json({ sucesso: true, tipo, total_tarefas: tarefas.length, prompt })
    registrarAcao('Gemini', 'gerar_resumo', `Resumo ${tipo} gerado (${tarefas.length} tarefas)`)
  } catch (erro) {
    next(erro)
  }
})

// ─────────────────────────────────────
// POST /api/gemini/webhook — Webhook para Gemini
// ─────────────────────────────────────
/**
 * Endpoint para receber notificações do Gemini
 * Configurar em seu script:
 * 
 * await fetch('http://seu-servidor:3000/api/gemini/webhook', {
 *   method: 'POST',
 *   body: JSON.stringify({ tarefas: [...] })
 * })
 */
router.post('/webhook', verificarToken, (req, res, next) => {
  try {
    const { tarefas, timestamp } = req.body

    if (!tarefas) {
      return res.status(400).json({ erro: 'Nenhuma tarefa recebida' })
    }

    // Processa como as outras
    let criadas = 0

    tarefas.forEach((t) => {
      try {
        const id = adicionarTarefa(
          String(t.descricao).slice(0, 500),
          String(t.materia || 'geral'),
          String(t.tipo || 'tarefa'),
          t.data_vencimento || null,
          'ia:gemini-webhook',
          t.prioridade || 'normal'
        )
        criadas++
      } catch (e) {
        console.error('Erro ao processar tarefa:', e.message)
      }
    })

    res.json({
      sucesso: true,
      criadas,
      timestamp: new Date().toISOString()
    })

    registrarAcao('Gemini', 'webhook', `${criadas} tarefas via webhook`)
  } catch (erro) {
    next(erro)
  }
})

module.exports = {
  router,
  verificarToken
};
