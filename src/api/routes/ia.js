/**
 * 🚀 PROJETO: SAC-1C (Student Activity Control)
 * 👤 AUTOR: Rafael Magalhães
 * 📅 VERSÃO: 1.0.0
 * 🛠️ DESCRIÇÃO: Rotas da API para Integração com IA/LLM (Legado)
 */

/**
 * Rotas da API para Integração com IA/LLM
 * Recebe dados gerados por um modelo de IA e salva no banco
 */

const express = require('express')
const router = express.Router()
const { adicionarTarefa } = require('../../tasks/taskService')
const { obterBanco } = require('../../database')
const { registrarAcao } = require('../../utils/logger')

// ─────────────────────────────────────
// POST /api/ia/gerar-tarefas — Recebe tarefas de um modelo IA
// ─────────────────────────────────────
/**
 * Formato esperado:
 * {
 *   "modelo": "claude-3-opus",
 *   "origem": "resumo_de_aula",
 *   "tarefas": [
 *     {
 *       "descricao": "Ler capítulos 3-5 de Termodinâmica",
 *       "materia": "Física",
 *       "tipo": "estudo",
 *       "prioridade": "alta",
 *       "data_vencimento": "2025-04-15"
 *     }
 *   ]
 * }
 */
router.post('/gerar-tarefas', (req, res) => {
  try {
    const { modelo, origem, tarefas } = req.body

    // Validações
    if (!tarefas || !Array.isArray(tarefas)) {
      return res.status(400).json({
        erro: 'Campo "tarefas" deve ser um array',
        exemplo: {
          tarefas: [
            {
              descricao: 'string',
              materia: 'string',
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
        // Validacoes básicas
        if (!tarefa.descricao) {
          erros.push({ indice, erro: 'descricao é obrigatória' })
          return
        }

        // Sanitização
        const descricao = String(tarefa.descricao).slice(0, 500) // Limita a 500 caracteres
        const materia = String(tarefa.materia || 'geral').slice(0, 100)
        const tipo = String(tarefa.tipo || 'tarefa').slice(0, 50)
        const prioridade = ['alta', 'normal', 'baixa'].includes(tarefa.prioridade)
          ? tarefa.prioridade
          : 'normal'
        const data_vencimento = tarefa.data_vencimento || null

        // Cria a tarefa
        const id = adicionarTarefa(descricao, materia, tipo, data_vencimento, `ia:${modelo}`, prioridade)

        resultados.push({
          indice,
          id,
          descricao: descricao.slice(0, 50) + '...'
        })
      } catch (erro) {
        erros.push({ indice, erro: erro.message })
      }
    })

    // Registra ação
    registrarAcao('IA', 'gerar_tarefas', `${resultados.length} tarefas criadas (modelo: ${modelo})`)

    res.status(201).json({
      sucesso: true,
      modelo,
      origem,
      total_requisitado: tarefas.length,
      criadas: resultados.length,
      erros: erros.length,
      dados: {
        criadas: resultados,
        erros: erros.length > 0 ? erros : undefined
      }
    })
  } catch (erro) {
    next(erro)
  }
})

// ─────────────────────────────────────
// POST /api/ia/analisar-progresso — IA analisa progresso
// ─────────────────────────────────────
router.post('/analisar-progresso', (req, res) => {
  try {
    const db = obterBanco()

    // Pega estatísticas do banco
    const total = db.prepare('SELECT COUNT(*) as count FROM tarefas').get()
    const concluidas = db.prepare('SELECT COUNT(*) as count FROM tarefas WHERE concluida = 1').get()
    const pendentes = db.prepare('SELECT COUNT(*) as count FROM tarefas WHERE concluida = 0').get()
    const por_materia = db.prepare(`
      SELECT materia, COUNT(*) as total, SUM(concluida) as feitas
      FROM tarefas
      GROUP BY materia
    `).all()

    const progresso = {
      total: total.count,
      concluidas: concluidas.count,
      pendentes: pendentes.count,
      percentual: total.count > 0 ? ((concluidas.count / total.count) * 100).toFixed(1) : 0,
      por_materia
    }

    res.json({
      sucesso: true,
      dados: progresso,
      prompt_recomendado: `
Baseado nesses dados de progresso de estudos:
${JSON.stringify(progresso, null, 2)}

Gere sugestões de tarefas e lembretes para melhorar o aprendizado.
      `
    })

    registrarAcao('IA', 'analisar_progresso', 'Análise de progresso realizada')
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// ─────────────────────────────────────
// POST /api/ia/gerar-resumo — Gera resumo com IA
// ─────────────────────────────────────
/**
 * Endpoint que preparaos dados para enviar a uma IA
 * Retorna conteúdo formatado pronto para passar a Claude, GPT, etc.
 */
router.post('/gerar-resumo', (req, res) => {
  try {
    const { tipo = 'semana' } = req.body

    const db = obterBanco()

    let tarefas
    if (tipo === 'hoje') {
      const hoje = new Date().toISOString().split('T')[0]
      tarefas = db.prepare(`
        SELECT * FROM tarefas
        WHERE data_vencimento = ? AND concluida = 0
        ORDER BY prioridade DESC
      `).all(hoje)
    } else {
      const hoje = new Date().toISOString().split('T')[0]
      const semana = new Date()
      semana.setDate(semana.getDate() + 7)
      const fimSemana = semana.toISOString().split('T')[0]

      tarefas = db.prepare(`
        SELECT * FROM tarefas
        WHERE data_vencimento BETWEEN ? AND ? AND concluida = 0
        ORDER BY data_vencimento, prioridade DESC
      `).all(hoje, fimSemana)
    }

    // Formata para enviar para IA
    const prompt = `
# Tarefas de Estudo - ${tipo.toUpperCase()}

${tarefas
  .map(
    (t, i) => `
${i + 1}. **${t.materia.toUpperCase()}** - ${t.tipo}
   - Descrição: ${t.descricao}
   - Vencimento: ${t.data_vencimento || 'sem data'}
   - Prioridade: ${t.prioridade}
`
  )
  .join('\n')}

Por favor, gere um plano de estudos otimizado e sugestões de novas tarefas
`

    res.json({
      sucesso: true,
      tipo,
      total_tarefas: tarefas.length,
      prompt,
      dados_brutos: tarefas
    })

    registrarAcao('IA', 'gerar_resumo', `Resumo de ${tipo} gerado (${tarefas.length} tarefas)`)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

module.exports = router
