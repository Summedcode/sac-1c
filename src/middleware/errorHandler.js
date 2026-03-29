/**
 * Middleware de Tratamento de Erros
 * Centraliza o tratamento de erros da API
 */

const errorHandler = (err, req, res, next) => {
  // Log do erro no console
  console.error('❌ ERRO:', err.message);
  console.error('Stack:', err.stack);

  // Define o status code
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  // Resposta JSON padronizada
  res.status(status).json({
    sucesso: false,
    erro: {
      status,
      mensagem: message,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = errorHandler;
