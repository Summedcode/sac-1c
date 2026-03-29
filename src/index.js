const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

// 📦 Inicializa o banco de dados
const { statusBanco } = require('./database')
console.log('\n🚀 Iniciando SAC-1C...\n')

// Handlers
const { handleBomdia, handlePing, handleAjuda } = require('./handlers/geral')
const {
  handleAdd,
  handleHoje,
  handleSemana,
  handleProvas,
  handleDel,
  handleDelAntigos,
  handleDelMateria,
  handleConcluir,
  handleStats
} = require('./handlers/tarefas')
const { handleLembrete, handleLembretes, handleDelLembrete } = require('./handlers/lembretes')
const { handleSim, handleNao } = require('./handlers/confirmacao')

// Utilitários
const { inicializarScheduler } = require('./scheduler')

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
})

// ─────────────────────────────────────
// Eventos do Cliente
// ─────────────────────────────────────

client.on('qr', (qr) => {
  console.log('Escaneie o QR code:')
  qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
  console.log('✅ SAC-1C conectado e funcionando!')
  inicializarScheduler(client)
})

// ─────────────────────────────────────
// Handler de Mensagens
// ─────────────────────────────────────

client.on('message', async (msg) => {
  try {
    const texto = msg.body.toLowerCase().trim()

    // Ignora mensagens vazias
    if (!texto) return

    // Comandos gerais
    if (texto === '!bomdia') return await handleBomdia(msg)
    if (texto === '!ping') return await handlePing(msg)
    if (texto === '!ajuda') return await handleAjuda(msg)

    // Comandos de tarefas
    if (texto.startsWith('!add')) return await handleAdd(msg)
    if (texto === '!hoje') return await handleHoje(msg)
    if (texto === '!semana') return await handleSemana(msg)
    if (texto === '!provas') return await handleProvas(msg)
    if (texto.startsWith('!del ')) return await handleDel(msg)
    if (texto.startsWith('!delantigos')) return await handleDelAntigos(msg)
    if (texto.startsWith('!delmateria')) return await handleDelMateria(msg)
    if (texto.startsWith('!concluir')) return await handleConcluir(msg)
    if (texto === '!stats') return await handleStats(msg)

    // Comandos de lembretes
    if (texto.startsWith('!lembrete ')) return await handleLembrete(msg)
    if (texto === '!lembretes') return await handleLembretes(msg)
    if (texto.startsWith('!dellembrete')) return await handleDelLembrete(msg)

    // Comandos de confirmação
    if (texto === '!sim') return await handleSim(msg)
    if (texto === '!não') return await handleNao(msg)
  } catch (erro) {
    console.error('❌ Erro ao processar mensagem:', erro)
    try {
      await msg.reply('❌ Erro ao processar comando. Tente novamente.')
    } catch (e) {
      console.error('❌ Erro ao enviar mensagem de erro:', e)
    }
  }
})

client.initialize().catch(err => {
  console.error('\n❌ ERRO CRÍTICO NO WHATSAPP:', err.message)
  console.error('💡 DICA: Verifique se não há outro terminal aberto ou processos do Chrome travados.\n')
  process.exit(1)
})

console.log('� Aguardando QR code para conectar ao WhatsApp...')
console.log(`\n📊 Status do banco: ${JSON.stringify(statusBanco(), null, 2)}\n`)

module.exports = { client }