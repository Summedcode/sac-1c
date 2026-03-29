// Handler de comandos de tarefas

const {
  adicionarTarefa,
  getTarefasHoje,
  getTarefasSemana,
  getProvas,
  formatarTarefas,
  deletarTarefaPorId,
  deletarTarefasAntigas,
  deletarTarefasPorMateria,
  marcarConcluida,
  getEstatisticas
} = require('../tasks/taskService')

const { validarData, validarId, validarDias } = require('../utils/validacao')
const { registrarAcao, registrarErro } = require('../utils/logger')
const { solicitarConfirmacao, confirmarAcao, cancelarConfirmacao } = require('../utils/confirmacao')

/**
 * Comando !add <matéria> | <tipo> | <data> | <descrição>
 */
async function handleAdd(msg) {
  try {
    const conteudo = msg.body.slice(4).trim()

    if (!conteudo) {
      await msg.reply(
        '❌ Formato incorreto.\n\n' +
        'Use: !add <matéria> | <tipo> | <data> | <descrição> | [prioridade]\n\n' +
        'Exemplo:\n' +
        '!add matemática | prova | 2025-03-28 | capítulos 3 e 4\n' +
        '!add português | tarefa | 2025-03-30 | redação | alta'
      )
      return
    }

    const partes = conteudo.split('|').map(p => p.trim())

    if (partes.length < 4) {
      await msg.reply(
        '❌ Preencha todos os campos separados por |\n\n' +
        'Exemplo:\n' +
        '!add matemática | prova | 2025-03-28 | capítulos 3 e 4'
      )
      return
    }

    const [materia, tipo, data, descricao, prioridade = 'normal'] = partes

    // Valida a data
    if (!validarData(data)) {
      await msg.reply(
        '❌ Data inválida!\n\n' +
        'Use o formato: YYYY-MM-DD\n' +
        'Exemplo: 2025-03-28'
      )
      return
    }

    // Valida prioridade
    const prioridadesValidas = ['alta', 'normal', 'baixa']
    if (!prioridadesValidas.includes(prioridade.toLowerCase())) {
      await msg.reply(
        '❌ Prioridade inválida!\n\n' +
        'Use: alta, normal ou baixa\n' +
        'Padrão: normal'
      )
      return
    }

    const id = adicionarTarefa(descricao, materia, tipo, data, msg.from, prioridade.toLowerCase())

    await msg.reply(
      `✅ *Tarefa adicionada!*\n\n` +
      `📚 Matéria: ${materia}\n` +
      `🏷️ Tipo: ${tipo}\n` +
      `📅 Data: ${data}\n` +
      `⚡ Prioridade: ${prioridade}\n` +
      `📝 Descrição: ${descricao}\n` +
      `🔢 ID: ${id}`
    )

    registrarAcao(msg.from, 'add', `Tarefa #${id} adicionada - ${descricao}`)
  } catch (erro) {
    registrarErro('handleAdd', erro)
    await msg.reply('❌ Erro ao adicionar tarefa')
  }
}

/**
 * Comando !hoje
 */
async function handleHoje(msg) {
  try {
    const tarefas = getTarefasHoje()
    const lista = formatarTarefas(tarefas)
    await msg.reply('📅 *Tarefas de hoje:*\n\n' + lista)
    registrarAcao(msg.from, 'hoje', `${tarefas.length} tarefas listadas`)
  } catch (erro) {
    registrarErro('handleHoje', erro)
    await msg.reply('❌ Erro ao buscar tarefas')
  }
}

/**
 * Comando !semana
 */
async function handleSemana(msg) {
  try {
    const tarefas = getTarefasSemana()
    const lista = formatarTarefas(tarefas)
    await msg.reply('📅 *Tarefas dos próximos 7 dias:*\n\n' + lista)
    registrarAcao(msg.from, 'semana', `${tarefas.length} tarefas listadas`)
  } catch (erro) {
    registrarErro('handleSemana', erro)
    await msg.reply('❌ Erro ao buscar tarefas')
  }
}

/**
 * Comando !provas
 */
async function handleProvas(msg) {
  try {
    const provas = getProvas()
    const lista = formatarTarefas(provas)
    await msg.reply('📝 *Provas pendentes:*\n\n' + lista)
    registrarAcao(msg.from, 'provas', `${provas.length} provas listadas`)
  } catch (erro) {
    registrarErro('handleProvas', erro)
    await msg.reply('❌ Erro ao buscar provas')
  }
}

/**
 * Comando !del <id>
 */
async function handleDel(msg) {
  try {
    const id = parseInt(msg.body.slice(5).trim())

    if (!validarId(id)) {
      await msg.reply(
        '❌ ID inválido.\n\n' +
        'Use: !del <id>\n\n' +
        'Exemplo: !del 5'
      )
      return
    }

    // Solicita confirmação
    const confirmacao = solicitarConfirmacao(
      msg.from,
      'deletarTarefa',
      { id },
      async (dados) => {
        const resultado = deletarTarefaPorId(dados.id)
        if (resultado.sucesso) {
          registrarAcao(msg.from, 'del', `Tarefa #${dados.id} deletada`)
        }
        return resultado
      }
    )

    await msg.reply(
      `⚠️ *Confirmação necessária!*\n\n` +
      `Tem certeza que deseja deletar a tarefa #${id}?\n\n` +
      `Responda com:\n` +
      `✅ !sim — confirmar\n` +
      `❌ !não — cancelar`
    )
  } catch (erro) {
    registrarErro('handleDel', erro)
    await msg.reply('❌ Erro ao processar comando')
  }
}

/**
 * Comando !delantigos <dias>
 */
async function handleDelAntigos(msg) {
  try {
    const dias = parseInt(msg.body.slice(12).trim())

    if (!validarDias(dias)) {
      await msg.reply(
        '❌ Número de dias inválido.\n\n' +
        'Use: !delantigos <dias>\n\n' +
        'Exemplo: !delantigos 30'
      )
      return
    }

    const confirmacao = solicitarConfirmacao(
      msg.from,
      'deletarAntigos',
      { dias },
      async (dados) => {
        const resultado = deletarTarefasAntigas(dados.dias, true)
        if (resultado.deletadas > 0) {
          registrarAcao(msg.from, 'delantigos', `${resultado.deletadas} tarefas deletadas`)
        }
        return resultado
      }
    )

    await msg.reply(
      `⚠️ *Confirmação necessária!*\n\n` +
      `Deseja deletar tarefas concluídas com mais de ${dias} dias?\n\n` +
      `Responda com:\n` +
      `✅ !sim — confirmar\n` +
      `❌ !não — cancelar`
    )
  } catch (erro) {
    registrarErro('handleDelAntigos', erro)
    await msg.reply('❌ Erro ao processar comando')
  }
}

/**
 * Comando !delmateria <matéria>
 */
async function handleDelMateria(msg) {
  try {
    const materia = msg.body.slice(12).trim()

    if (!materia) {
      await msg.reply(
        '❌ Matéria não informada.\n\n' +
        'Use: !delmateria <matéria>\n\n' +
        'Exemplo: !delmateria matemática'
      )
      return
    }

    const confirmacao = solicitarConfirmacao(
      msg.from,
      'deletarMateria',
      { materia },
      async (dados) => {
        const resultado = deletarTarefasPorMateria(dados.materia, true)
        if (resultado.deletadas > 0) {
          registrarAcao(msg.from, 'delmateria', `${resultado.deletadas} tarefas de ${dados.materia} deletadas`)
        }
        return resultado
      }
    )

    await msg.reply(
      `⚠️ *Confirmação necessária!*\n\n` +
      `Deseja deletar tarefas concluídas de ${materia}?\n\n` +
      `Responda com:\n` +
      `✅ !sim — confirmar\n` +
      `❌ !não — cancelar`
    )
  } catch (erro) {
    registrarErro('handleDelMateria', erro)
    await msg.reply('❌ Erro ao processar comando')
  }
}

/**
 * Comando !concluir <id>
 */
async function handleConcluir(msg) {
  try {
    const id = parseInt(msg.body.slice(9).trim())

    if (!validarId(id)) {
      await msg.reply(
        '❌ ID inválido.\n\n' +
        'Use: !concluir <id>\n\n' +
        'Exemplo: !concluir 5'
      )
      return
    }

    const resultado = marcarConcluida(id)

    if (resultado.sucesso) {
      registrarAcao(msg.from, 'concluir', `Tarefa #${id} marcada como concluída`)
    } else {
      registrarAcao(msg.from, 'concluir', `Erro ao marcar tarefa #${id}`, false)
    }

    await msg.reply(resultado.mensagem)
  } catch (erro) {
    registrarErro('handleConcluir', erro)
    await msg.reply('❌ Erro ao processar comando')
  }
}

/**
 * Comando !stats
 */
async function handleStats(msg) {
  try {
    const stats = getEstatisticas()

    const percentual = stats.total > 0 ? ((stats.concluidas / stats.total) * 100).toFixed(1) : 0

    await msg.reply(
      `📊 *Estatísticas de Tarefas:*\n\n` +
      `📝 Total: ${stats.total}\n` +
      `✅ Concluídas: ${stats.concluidas} (${percentual}%)\n` +
      `⏳ Pendentes: ${stats.pendentes}\n` +
      `📅 Para hoje: ${stats.hoje}`
    )

    registrarAcao(msg.from, 'stats', 'Estatísticas consultadas')
  } catch (erro) {
    registrarErro('handleStats', erro)
    await msg.reply('❌ Erro ao buscar estatísticas')
  }
}

module.exports = {
  handleAdd,
  handleHoje,
  handleSemana,
  handleProvas,
  handleDel,
  handleDelAntigos,
  handleDelMateria,
  handleConcluir,
  handleStats
}
