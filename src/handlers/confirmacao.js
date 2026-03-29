// Handler de confirmações (!sim, !não)

const { confirmarAcao, cancelarConfirmacao } = require('../utils/confirmacao')
const { registrarAcao, registrarErro } = require('../utils/logger')

/**
 * Comando !sim (confirmar ação)
 */
async function handleSim(msg) {
  try {
    const resultado = await confirmarAcao(msg.from)
    await msg.reply(resultado.mensagem)

    if (resultado.sucesso) {
      registrarAcao(msg.from, 'confirmacao', 'Ação confirmada')
    } else {
      registrarAcao(msg.from, 'confirmacao', 'Falha na confirmação', false)
    }
  } catch (erro) {
    registrarErro('handleSim', erro)
    await msg.reply('❌ Erro ao confirmar ação')
  }
}

/**
 * Comando !não (cancelar ação)
 */
async function handleNao(msg) {
  try {
    const resultado = cancelarConfirmacao(msg.from)
    await msg.reply(resultado.mensagem)
    registrarAcao(msg.from, 'cancelacao', 'Ação cancelada')
  } catch (erro) {
    registrarErro('handleNao', erro)
    await msg.reply('❌ Erro ao cancelar ação')
  }
}

module.exports = {
  handleSim,
  handleNao
}
