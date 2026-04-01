#!/usr/bin/env node

/**
 * 🚀 PROJETO: SAC-1C (Student Activity Control)
 * 👤 AUTOR: Rafael Magalhães
 * 📅 VERSÃO: 1.0.0
 * 🛠️ DESCRIÇÃO: Ponto de entrada principal - Inicia Bot WhatsApp e API REST
 */

/**
 * Sistema Completo: WhatsApp Bot + API REST
 * 
 * Executa:
 * 1. Servidor Express na porta 3000 (API REST)
 * 2. Bot WhatsApp para grupo "1c"
 * 
 * Uso:
 *   node start.js
 *   ou npm start (se configurado em package.json)
 */

const dotenv = require('dotenv')

// Carrega variáveis de ambiente
dotenv.config()

console.log(`
╔════════════════════════════════════════╗
║   SAC-1C — Sistema de Gerenciamento   ║
║   WhatsApp Bot + API REST              ║
╚════════════════════════════════════════╝
`)

const { inicializarBanco } = require('./src/database')
const { iniciarAPI } = require('./src/api')

async function bootstrap() {
  try {
    // 1. Banco de Dados primeiro (Síncrono)
    console.log('📦 1. Preparando banco de dados...');
    inicializarBanco();
    console.log('   ✅ Banco de dados e migrations prontos');

    // 2. API REST
    console.log('📡 2. Iniciando servidor Express...');
    await iniciarAPI();

    // 3. Bot WhatsApp
    console.log('\n🤖 3. Conectando ao WhatsApp (Puppeteer)...');
    require('./src/index');
  } catch (erro) {
    console.error('❌ Erro na inicialização:', erro.message)
    process.exit(1)
  }
}

bootstrap()

// ─────────────────────────────────────────────
// Handlers de Erro Global
// ─────────────────────────────────────────────

process.on('unhandledRejection', (motivo, promise) => {
  console.error('❌ Promise rejection não tratada:', motivo)
})

process.on('uncaughtException', (erro) => {
  console.error('❌ Erro não capturado:', erro)
})

// ─────────────────────────────────────────────
// Info de Parada
// ─────────────────────────────────────────────

console.log(`
┌────────────────────────────────────────┐
│ Sistema iniciado com sucesso!          │
├────────────────────────────────────────┤
│ 📡 API REST:   http://localhost:3000   │
│ 🤖 WhatsApp:   Conectando...           │
│                                        │
│ Pressione Ctrl+C para desligar         │
└────────────────────────────────────────┘
`)

process.on('SIGINT', async () => {
  console.log('\n\n👋 Desligando sistema com segurança...')
  try {
    // Fecha conexão com banco
    const { fecharBanco } = require('./src/database')
    fecharBanco()

    // Fecha WhatsApp
    const { client } = require('./src/index')
    if (client) {
      console.log('  └─ Encerrando navegador do WhatsApp...')
      await client.destroy().catch(() => {})
    }
    console.log('  └─ Sistema encerrado.')
    process.exit(0)
  } catch (err) {
    console.error('Erro ao encerrar:', err.message)
    process.exit(1)
  }
})
