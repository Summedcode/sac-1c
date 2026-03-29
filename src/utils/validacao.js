// ─────────────────────────────────────
// Validações e utilitários
// ─────────────────────────────────────

/**
 * Valida se a data está no formato YYYY-MM-DD e é válida
 * @param {string} data - Data no formato YYYY-MM-DD
 * @returns {boolean} true se válida, false caso contrário
 */
function validarData(data) {
  // Verifica formato YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false
  }

  // Verifica se é uma data válida
  const date = new Date(data)
  return date instanceof Date && !isNaN(date)
}

/**
 * Valida se um ID é válido (número inteiro positivo)
 * @param {*} id - ID a validar
 * @returns {boolean}
 */
function validarId(id) {
  const numero = parseInt(id)
  return !isNaN(numero) && numero > 0
}

/**
 * Valida se a mensagem não está vazia
 * @param {string} mensagem - Mensagem a validar
 * @returns {boolean}
 */
function validarMensagem(mensagem) {
  return mensagem && mensagem.trim().length > 0
}

/**
 * Valida número de dias
 * @param {*} dias - Número de dias
 * @returns {boolean}
 */
function validarDias(dias) {
  const numero = parseInt(dias)
  return !isNaN(numero) && numero > 0
}

module.exports = {
  validarData,
  validarId,
  validarMensagem,
  validarDias
}
