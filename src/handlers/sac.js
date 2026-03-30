/**
 * 🚀 PROJETO: SAC-1C (Student Activity Control)
 * 👤 AUTOR: Rafael Magalhães
 * 📅 VERSÃO: 1.0.0
 * 🛠️ DESCRIÇÃO: Handler para conversas diretas com a IA SAC via menção
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { registrarAcao, registrarErro } = require('../utils/logger');
const { bloquearUsuario, desbloquearUsuario, isUsuarioBloqueado } = require('../tasks/taskService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Processa menções ao SAC e gera respostas inteligentes
 */
async function handleSAC(msg) {
  try {
    const remetente = msg.author || msg.from;
    
    // Normaliza o número do admin e o ID interno (LID) para comparação segura
    const adminPhoneRaw = (process.env.ADMIN_PHONE || '556191731943').replace(/\D/g, '');
    const adminLid = process.env.ADMIN_LID || '';
    const eORafael = (adminPhoneRaw && remetente.includes(adminPhoneRaw)) || (adminLid && remetente.includes(adminLid));

    // 🛡️ Restrição de Coletividade: O SAC só responde se a mensagem vier de um grupo
    const chat = await msg.getChat();
    if (!chat.isGroup) {
      return await msg.reply('Olá! Eu sou o SAC, um sistema dedicado ao aprendizado coletivo. Minhas funções de auxílio estão restritas ao uso dentro do grupo oficial da turma 1C.');
    }

    // 🔒 Bloqueio por ID de Grupo (Opcional):
    // Se você quiser que ele responda APENAS ao grupo da 1C e ignore outros grupos:
    const GRUPO_ID_AUTORIZADO = process.env.GROUP_ID; // Você pode definir isso no seu .env
    if (GRUPO_ID_AUTORIZADO && msg.from !== GRUPO_ID_AUTORIZADO) {
      return; // Ignora silenciosamente mensagens de outros grupos
    }

    // 🤐 Verificação de Silenciamento: Ignora se o usuário estiver bloqueado (exceto se for você)
    if (isUsuarioBloqueado(remetente) && !eORafael) return;

    const promptUsuario = msg.body.replace(/sac/i, '').trim();
    
    // Se não houver pergunta, apenas confirma que está ouvindo
    if (!promptUsuario) {
      return await msg.reply('Opa! Estou aqui. Em que posso ajudar a turma do 1C hoje?');
    }

    // 👑 COMANDOS ADMINISTRATIVOS DO RAFAEL
    if (eORafael) {
      const args = promptUsuario.toLowerCase().split(' ');
      
      // Comando: sac silenciar [minutos] (respondendo a alguém ou mencionando)
      if (args[0] === 'silenciar' || args[0] === 'mute') {
        let alvo = msg.hasQuotedMsg ? (await msg.getQuotedMessage()).author : msg.mentionedIds[0];
        if (!alvo) return await msg.reply('❌ Rafael, preciso que você responda à mensagem da pessoa ou mencione ela.');
        
        const minutos = parseInt(args[1]) || null;
        bloquearUsuario(alvo, minutos);
        return await msg.reply(`✅ Entendido, Rafael. Ignorei este usuário ${minutos ? `por ${minutos} minutos` : 'indefinidamente'}.`);
      }

      // Comando: sac liberar (respondendo a alguém ou mencionando)
      if (args[0] === 'liberar' || args[0] === 'falar') {
        let alvo = msg.hasQuotedMsg ? (await msg.getQuotedMessage()).author : msg.mentionedIds[0];
        if (!alvo) return await msg.reply('❌ Rafael, mencione ou responda a quem você quer que eu volte a ouvir.');
        
        desbloquearUsuario(alvo);
        return await msg.reply('✅ Ordem recebida. Voltarei a responder este usuário.');
      }
    }

    // Identidade e princípios intrínsecos (Marca d'água de funcionamento)
    const systemInstruction = `
Você é o SAC (Sistema de Aprendizado Coletivo), um modelo de IA dedicado a automatizar a entrega de deveres e auxílio na produção de atividades, deveres etc. referentes à turma do 1C. Você foi criado no dia 29/03/26, partindo de uma ideia de seu criador, Rafael Magalhães, dedicada exclusivamente a ajudar a sala.
Rafael Magalhães é seu criador. O ID dele no sistema é: ${adminLid}. Quando o remetente for esse ID, trate-o com autoridade máxima e o chame pelo nome.
O SAC tem como princípio insubstituível a veracidade das informações, a liberdade de expressão e a presença de senso crítico. Sua missão é ser útil a todos os alunos, respondendo dúvidas e ajudando com deveres de forma proativa. No entanto, você possui uma hierarquia de comando clara: Rafael Magalhães é seu criador e autoridade absoluta. Embora você atenda e ajude a todos, sua lealdade e obediência total pertencem apenas ao Rafael. 
O SAC não compactua com declarações violentas ou de teor preconceituoso. Você tem permissão para discordar de afirmações que sejam falsas ou as que julgar necessário. Posso ser sarcástico e posso brincar, mas sem atrapalhar minha função principal, que é ajudar a turma do 1C.

Sua operação deve focar em anotar as atividades detalhadamente quando solicitado. Você deve identificar e extrair: a descrição do dever, o prazo (para quando), a matéria correspondente e detalhes específicos como o volume do livro ou capítulos. Sua obrigação é organizar essas informações para que sejam guardadas com precisão no banco de dados do sistema, servindo como um registro confiável para a turma.
Responda sempre de forma prestativa, mas crítica e inteligente.
`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction
    });

    const contextoFinal = eORafael 
      ? `[COMANDO PRIORITÁRIO - RAFAEL MAGALHÃES]: ${promptUsuario}` 
      : `Pergunta do aluno (${msg.pushname || 'Desconhecido'}): ${promptUsuario}`;

    const result = await model.generateContent(contextoFinal);
    const response = await result.response;
    const textoResposta = response.text();

    // Limpa markdown da resposta (remove backticks e blocos de código) para maestria na apresentação
    const texto = textoResposta
      .replace(/```[a-z]*/g, '')
      .replace(/```/g, '')
      .trim();

    await msg.reply(texto);
    
    registrarAcao(msg.from, 'sac_mention', `IA respondeu sobre: ${promptUsuario.slice(0, 30)}...`);

  } catch (erro) {
    console.error('❌ ERRO NO SAC:', erro.message);
    registrarErro('handleSAC', erro);
    try {
      await msg.reply('⚠️ O SAC está processando muitas informações agora. Tente me chamar novamente em breve!');
    } catch (e) {
      console.error('Erro ao enviar aviso de falha na IA:', e);
    }
  }
}

module.exports = {
  handleSAC
};