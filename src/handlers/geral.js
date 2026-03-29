// Handler de comandos gerais (!bomdia, !ping, !ajuda)

const { registrarAcao } = require('../utils/logger')

/**
 * Comando !bomdia
 */
async function handleBomdia(msg) {
  try {
    await msg.reply(
      'Bom dia, 1c! 🌅\n\n' +
      'Estou em desenvolvimento pelo GOAT Rafael, mas caso queira saber meus comandos, é só digitar " !ajuda ".'
    )
    registrarAcao(msg.from, 'bomdia', 'Mensagem de bom dia enviada')
  } catch (erro) {
    console.error('❌ Erro em !bomdia:', erro)
    await msg.reply('❌ Erro ao enviar mensagem')
  }
}

/**
 * Comando !ping
 */
async function handlePing(msg) {
  try {
    await msg.reply('🏓 Pong! SAC-1C online.')
    registrarAcao(msg.from, 'ping', 'Bot testado e online')
  } catch (erro) {
    console.error('❌ Erro em !ping:', erro)
  }
}

/**
 * Comando !ajuda
 */
async function handleAjuda(msg) {
  try {
    await msg.reply(
      '📚 *SAC-1C — Comandos disponíveis:*\n\n' +
      '!bomdia — mensagem de bom dia\n' +
      '!ping — testa se o bot está online\n' +
      '!ajuda — mostra esse menu\n\n' +
      '*Tarefas:*\n' +
      '!add <matéria> | <tipo> | <data> | <descrição>\n' +
      '!hoje — tarefas de hoje\n' +
      '!semana — tarefas dos próximos 7 dias\n' +
      '!provas — todas as provas pendentes\n' +
      '!stats — estatísticas de tarefas\n\n' +
      '*Manage tarefas:*\n' +
      '!concluir <id> — marcar tarefa como feita\n' +
      '!del <id> — deletar uma tarefa específica\n' +
      '!delantigos <dias> — deletar tarefas concluídas com +X dias\n' +
      '!delmateria <matéria> — deletar tarefas de uma matéria\n\n' +
      '*Lembretes:*\n' +
      '!lembrete <mensagem> — criar um novo lembrete\n' +
      '!lembretes — listar todos os lembretes\n' +
      '!dellembrete <id> — deletar um lembrete\n\n' +
      '*Confirmação:*\n' +
      '!sim — confirmar ação perigosa\n' +
      '!não — cancelar ação perigosa'
    )
    registrarAcao(msg.from, 'ajuda', 'Menu consultado')
  } catch (erro) {
    console.error('❌ Erro em !ajuda:', erro)
    await msg.reply('❌ Erro ao enviar menu')
  }
}

module.exports = {
  handleBomdia,
  handlePing,
  handleAjuda
}
