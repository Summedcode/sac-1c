// Sistema de confirmação para ações perigosas
// Armazena Estados de confirmação pendentes

const confirmacoesPendentes = new Map()

/**
 * Cria uma confirmação pendente
 * @param {string} usuario - ID do usuário
 * @param {string} acao - Tipo de ação
 * @param {*} dados - Dados da ação
 * @param {Function} callback - Função a executar com a confirmação
 * @returns {boolean} true se criada
 */
function solicitarConfirmacao(usuario, acao, dados, callback) {
  confirmacoesPendentes.set(usuario, {
    acao,
    dados,
    callback,
    timestamp: Date.now()
  })

  return true
}

/**
 * Confirma uma ação
 * @param {string} usuario - ID do usuário
 * @returns {*} resultado da ação ou null se expirou/não existe
 */
async function confirmarAcao(usuario) {
  const confirmacao = confirmacoesPendentes.get(usuario)

  if (!confirmacao) {
    return { sucesso: false, mensagem: '❌ Nenhuma ação pendente para confirmar' }
  }

  // Limpa após 5 minutos
  if (Date.now() - confirmacao.timestamp > 5 * 60 * 1000) {
    confirmacoesPendentes.delete(usuario)
    return { sucesso: false, mensagem: '❌ Confirmação expirou (5 minutos)' }
  }

  try {
    const resultado = await confirmacao.callback(confirmacao.dados)
    confirmacoesPendentes.delete(usuario)
    return resultado
  } catch (erro) {
    confirmacoesPendentes.delete(usuario)
    return { sucesso: false, mensagem: '❌ Erro ao executar ação: ' + erro.message }
  }
}

/**
 * Cancela uma confirmação
 * @param {string} usuario - ID do usuário
 */
function cancelarConfirmacao(usuario) {
  confirmacoesPendentes.delete(usuario)
  return { sucesso: true, mensagem: '❌ Ação cancelada' }
}

module.exports = {
  solicitarConfirmacao,
  confirmarAcao,
  cancelarConfirmacao
}
