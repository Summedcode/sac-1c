/**
 * 🚀 PROJETO: SAC-1C (Student Activity Control)
 * 👤 AUTOR: Rafael Magalhães
 * 📅 VERSÃO: 1.0.0
 * 🛠️ DESCRIÇÃO: Configuração e inicialização do servidor Express (API)
 */

/**
 * Servidor Express da API
 * Endpoints REST para tarefas, lembretes e integração com IA
 */

const path = require('path')
const express = require('express')
const fs = require('fs')
const { obterBanco } = require('../database')

const rotasTarefas = require('./routes/tarefas')
const rotasLembretes = require('./routes/lembretes')
const rotasIA = require('./routes/ia')
const { router: rotasGemini } = require('./routes/gemini')
const errorHandler = require('../middleware/errorHandler')

const PORT = process.env.PORT || process.env.API_PORT || 3000

const app = express()

// ─────────────────────────────────────
// Middleware
// ─────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Log de requisições
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`)
  next()
})

// ─────────────────────────────────────
// Health Check
// ─────────────────────────────────────
app.get('/health', (req, res) => {
  const { statusBanco } = require('../database')
  const banco = statusBanco()

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    banco: banco.conectado ? 'conectado' : 'erro',
    versao_banco: banco.versao
  })
})

// ─────────────────────────────────────
// Rotas
// ─────────────────────────────────────
app.use('/api/tarefas', rotasTarefas)
app.use('/api/lembretes', rotasLembretes)
app.use('/api/ia', rotasIA)
app.use('/api/gemini', rotasGemini)

// Rota para visualizar o QR Code gerado pelo bot (Útil para logs no Railway)
app.get('/qr', (req, res) => {
  const qrPath = path.join(process.cwd(), 'data', 'qr.png')
  if (fs.existsSync(qrPath)) {
    res.sendFile(qrPath)
  } else {
    res.status(404).send('QR Code ainda não gerado. Aguarde a inicialização do bot.')
  }
})

// ─────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    caminho: req.path,
    metodo: req.method
  })
})

// ─────────────────────────────────────
// Error Handler (deve ser último)
// ─────────────────────────────────────
app.use(errorHandler)

// ─────────────────────────────────────
// Iniciar Servidor
// ─────────────────────────────────────
function iniciarAPI() {
  return new Promise((resolve) => {
    app.listen(PORT, () => {
      console.log(`\n🌐 API rodando em http://localhost:${PORT}`)
      console.log(`   📚 Documentação: http://localhost:${PORT}/docs`)
      console.log(`   💚 Health Check: http://localhost:${PORT}/health\n`)
      console.log(`   📸 QR Code: Acesse https://SUA-URL-DO-RAILWAY/qr para ver o QR Code.\n`)
      resolve()
    })
  })
}

module.exports = {
  app,
  iniciarAPI
}
