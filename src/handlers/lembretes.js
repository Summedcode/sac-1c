// Handler de comandos de lembretes

const {
  adicionarLembrete,
  getLembretes,
  formatarLembretes,
  deletarLembrete
} = require('../tasks/taskService')

const { validarId, validarMensagem } = require('../utils/validacao')
const { registrarAcao, registrarErro } = require('../utils/logger')
const { solicitarConfirmacao } = require('../utils/confirmacao')

/**
 * Comando !lembrete <mensagem>
 */
async function handleLembrete(msg) {
  try {
    const mensagem = msg.body.slice(10).trim()

    if (!validarMensagem(mensagem)) {
      await msg.reply(
        '❌ Mensagem do lembrete vazia.\n\n' +
        'Use: !lembrete <mensagem>\n\n' +
        'Exemplo: !lembrete Estudar para prova de inglês'
      )
      return
    }

    const id = adicionarLembrete(mensagem, msg.from)
    await msg.reply(
      `🔔 *Lembrete criado!*\n\n` +
      `💬 "${mensagem}"\n` +
      `🔢 ID: ${id}`
    )

    registrarAcao(msg.from, 'lembrete', `Lembrete #${id} criado`)
  } catch (erro) {
    registrarErro('handleLembrete', erro)
    await msg.reply('❌ Erro ao criar lembrete')
  }
}

/**
 * Comando !lembretes
 */
async function handleLembretes(msg) {
  try {
    const lembretes = getLembretes()
    const lista = formatarLembretes(lembretes)
    await msg.reply('🔔 *Seus lembretes:*\n\n' + lista)
    registrarAcao(msg.from, 'lembretes', `${lembretes.length} lembretes listados`)
  } catch (erro) {
    registrarErro('handleLembretes', erro)
    await msg.reply('❌ Erro ao buscar lembretes')
  }
}

/**
 * Comando !dellembrete <id>
 */
async function handleDelLembrete(msg) {
  try {
    const id = parseInt(msg.body.slice(13).trim())

    if (!validarId(id)) {
      await msg.reply(
        '❌ ID inválido.\n\n' +
        'Use: !dellembrete <id>\n\n' +
        'Exemplo: !dellembrete 3'
      )
      return
    }

    // Solicita confirmação
    const confirmacao = solicitarConfirmacao(
      msg.from,
      'deletarLembrete',
      { id },
      async (dados) => {
        const resultado = deletarLembrete(dados.id)
        if (resultado.sucesso) {
          registrarAcao(msg.from, 'dellembrete', `Lembrete #${dados.id} deletado`)
        }
        return resultado
      }
    )

    await msg.reply(
      `⚠️ *Confirmação necessária!*\n\n` +
      `Deseja deletar o lembrete #${id}?\n\n` +
      `Responda com:\n` +
      `✅ !sim — confirmar\n` +
      `❌ !não — cancelar`
    )
  } catch (erro) {
    registrarErro('handleDelLembrete', erro)
    await msg.reply('❌ Erro ao processar comando')
  }
}

module.exports = {
  handleLembrete,
  handleLembretes,
  handleDelLembrete
}
