// Scheduler de tarefas automáticas
// Usa node-cron para executar tarefas em horários específicos

const cron = require('node-cron')
const { deletarTarefasAntigas, getTarefasHoje } = require('./tasks/taskService')
const { registrarAcao, registrarErro } = require('./utils/logger')

let client = null

/**
 * Inicializa o scheduler com referência ao cliente WhatsApp
 * @param {Client} whatsappClient - Cliente do WhatsApp
 */
function inicializarScheduler(whatsappClient) {
  client = whatsappClient
  console.log('⏰ Scheduler inicializado')

  // ─────────────────────────────────────
  // Limpeza automática todos os dias às 03:00
  // ─────────────────────────────────────
  cron.schedule('0 3 * * *', () => {
    console.log('🧹 Iniciando limpeza automática de tarefas...')
    try {
      const resultado = deletarTarefasAntigas(30, true)
      registrarAcao('SISTEMA', 'limpeza_automatica', `${resultado.deletadas} tarefas deletadas`)
      console.log(`✅ Limpeza concluída: ${resultado.deletadas} tarefas removidas`)
    } catch (erro) {
      registrarErro('scheduler_limpeza', erro)
    }
  })

  // ─────────────────────────────────────
  // Recordatório de tarefas do dia às 07:00
  // ─────────────────────────────────────
  cron.schedule('0 7 * * *', () => {
    console.log('📬 Enviando lembrete diário...')
    try {
      const tarefas = getTarefasHoje()

      if (tarefas.length === 0) {
        console.log('✅ Nenhuma tarefa para hoje')
        return
      }

      const lista = tarefas.map(t => {
        const materia = t.materia || 'geral'
        const tipo = t.tipo || 'tarefa'
        return `📌 *${materia.toUpperCase()}* — ${t.descricao}`
      }).join('\n\n')

      // Nota: Aqui você precisaria ter o número do grupo/pessoa para enviar
      // Por enquanto, apenas registra no log
      registrarAcao('SISTEMA', 'lembrete_diario', `${tarefas.length} tarefas enviadas`)
      console.log(`✅ Lembrete enviado: ${tarefas.length} tarefas`)
    } catch (erro) {
      registrarErro('scheduler_lembrete', erro)
    }
  })
}

module.exports = {
  inicializarScheduler
}
