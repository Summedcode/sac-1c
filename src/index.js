/**
 * 🚀 PROJETO: SAC-1C (Student Activity Control)
 * 👤 AUTOR: Rafael Magalhães
 * 📅 VERSÃO: 1.0.0
 * 🛠️ DESCRIÇÃO: Core do Bot de WhatsApp - Handlers e Eventos
 */

const path = require('path')
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcodeTerminal = require('qrcode-terminal')
const qrcode = require('qrcode')

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
const { handleSAC } = require('./handlers/sac')

// Utilitários
const { inicializarScheduler } = require('./scheduler')

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(process.cwd(), 'data', 'session')
  }),
  puppeteer: {
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  },
  qrMaxRetries: 5
})

// ─────────────────────────────────────
// Eventos do Cliente
// ─────────────────────────────────────

client.on('qr', (qr) => {
  console.log('Escaneie o QR code no terminal ou via link:')
  qrcodeTerminal.generate(qr, { small: true })

  // Salva o QR Code como imagem para visualização via Web (Railway)
  const qrPath = path.join(process.cwd(), 'data', 'qr.png')
  qrcode.toFile(qrPath, qr).catch(err => console.error('❌ Erro ao salvar QR:', err))
})

client.on('ready', () => {
  console.log('✅ SAC-1C conectado e funcionando!')
  inicializarScheduler(client)
})

// ─────────────────────────────────────
// Handler de Mensagens
// ─────────────────────────────────────

const botStartTime = Math.floor(Date.now() / 1000);

client.on('message', async (msg) => {
  try {
    // ⏳ Filtro de Tempo: Ignora mensagens enviadas antes do processo iniciar
    if (msg.timestamp < botStartTime) return;

    console.log('📨 Mensagem recebida:', msg.body, '| De:', msg.from)
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

    // 🤖 Ativação por menção ou proatividade (SAC)
    const isMention = texto.includes('sac')
    return await handleSAC(msg, isMention)

  } catch (erro) {
    console.error('❌ Erro ao processar mensagem:', erro)
    try {
      await msg.reply('❌ Erro ao processar comando. Tente novamente.')
    } catch (e) {
      console.error('❌ Erro ao enviar mensagem de erro:', e)
    }
  }
})

console.log('⏳ Inicializando motor do WhatsApp... Por favor, aguarde.');

client.initialize().catch(err => {
  console.error('\n❌ ERRO CRÍTICO NO WHATSAPP:', err.message)
  console.error('💡 DICA: Verifique se não há outro terminal aberto ou processos do Chrome travados.\n')
  process.exit(1)
})

console.log('📲 Aguardando geração do QR Code...')
console.log(`\n📊 Status do banco: ${JSON.stringify(statusBanco(), null, 2)}\n`)

module.exports = { client }