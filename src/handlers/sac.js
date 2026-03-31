/**
 * 🚀 PROJETO: SAC-1C (Student Activity Control)
 * 👤 AUTOR: Rafael Magalhães
 * 📅 VERSÃO: 1.0.0
 * 🛠️ DESCRIÇÃO: Handler para conversas diretas com a IA SAC via menção
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { registrarAcao, registrarErro } = require('../utils/logger');
const { obterBanco } = require('../database');
const { bloquearUsuario, desbloquearUsuario, isUsuarioBloqueado } = require('../tasks/taskService');

// [LÓGICA DE CONTROLE DE FLUXO E RODÍZIO]
const usuariosAtivos = new Map();
const filaMensagens = [];
let processandoFila = false;
const keys = (process.env.GEMINI_KEYS || process.env.GEMINI_API_KEY || "").split(',').map(k => k.trim()).filter(k => k);
let keyAtualIndex = 0;
let modoProativoAtivo = true; // Mentor Autônomo inicia ativo por padrão

/**
 * Entry point: Validações básicas, Anti-flood e Fila
 */
async function handleSAC(msg, isMention) {
  if (msg.fromMe) return; // 🛑 Prevenção de loop (Primeira linha obrigatória)

  // Filtro de mensagens antigas (Startup Clean)
  const agora = Math.floor(Date.now() / 1000);
  if (msg.timestamp < agora - 15) return;

  const idUsuario = msg.author || msg.from;
  const timestampMs = Date.now();

  // 1. LÓGICA ANTI-FLOOD
  let info = usuariosAtivos.get(idUsuario) || { contagem: 0, ultimaVez: 0 };
  
  // Se passou mais de 10s, reseta a contagem
  if (timestampMs - info.ultimaVez > 10000) {
    info.contagem = 0;
  }

  info.contagem += 1;
  info.ultimaVez = timestampMs;
  usuariosAtivos.set(idUsuario, info);

  // Bloqueia se mandar mais de 3 mensagens em 10 segundos
  if (info.contagem > 3) {
    console.log(`⚠️ Anti-flood: Ignorando ${idUsuario}`);
    return; 
  }

  // 2. FILTRO DE ATIVAÇÃO (Só entra na fila o que for relevante)
  const textoOriginal = msg.body.toLowerCase();
  const keywords = ['onhb', 'prova', 'simulado', 'estudo', 'trabalho', 'data', 'professor', 'nota'];
  const temPalavraChave = keywords.some(k => textoOriginal.includes(k)) || msg.hasMedia;
  const chanceIntervencao = temPalavraChave ? 0.70 : 0.03;
  const chanceProativa = modoProativoAtivo && Math.random() < chanceIntervencao;

  if (!isMention && !chanceProativa) return;

  // 3. ADICIONA À FILA
  filaMensagens.push({ msg, isMention, remetente: idUsuario });
  processarFila();
}

/**
 * Processador da Fila de Mensagens
 */
async function processarFila() {
  if (processandoFila || filaMensagens.length === 0) return;
  processandoFila = true;

  while (filaMensagens.length > 0) {
    const item = filaMensagens.shift();
    
    try {
      await executarChamadaIA(item.msg, item.isMention, item.remetente);
    } catch (e) {
      console.error("Erro ao processar item da fila:", e.message);
    } finally {
      // Intervalo de segurança entre respostas para evitar spam/ban
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  processandoFila = false;
}

/**
 * Executa a lógica pesada de IA com Rodízio de Chaves
 */
async function executarChamadaIA(msg, isMention, remetente) {
  try {
    // Solução de Identificação: Limpa o ADMIN_PHONE e valida no remetente (ignora sufixos @c.us/@g.us)
    const adminNum = (process.env.ADMIN_PHONE || '556191731943').replace(/\D/g, '');
    const adminLid = '214624129552601'; // LID capturado nos logs
    const eORafael = (adminNum && remetente.includes(adminNum)) || remetente.includes(adminLid);

    const textoOriginal = msg.body.toLowerCase();
    const promptUsuario = msg.body.replace(/sac/i, '').trim();

    // Se não houver pergunta, apenas confirma que está ouvindo
    if (!promptUsuario && !msg.hasMedia && isMention) {
      return await msg.reply('Estou online e acompanhando o fluxo. Como posso contribuir tecnicamente com as atividades do 1C agora?');
    } else if (!promptUsuario && !msg.hasMedia) {
      return;
    }

    // ️ Restrição de Coletividade: O SAC só responde se a mensagem vier de um grupo
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

    // 👑 COMANDOS ADMINISTRATIVOS DO RAFAEL
    if (eORafael) {
      const args = promptUsuario.toLowerCase().split(' ');
      
      // 👑 COMANDO DE ADMIN: "colocar no banco" (Memória Contextual)
      if (textoOriginal.includes('colocar no banco')) {
        const conteudo = msg.body.split(/colocar no banco/i)[1]?.trim();        
        if (!conteudo) return await msg.reply("⚠️ O que devo memorizar, Mestre?");
        try {
          const db = obterBanco();
          db.prepare("INSERT INTO memoria_contextual (informacao) VALUES (?)").run(conteudo);
          return await msg.reply(`✅ Memória Injetada: "${conteudo}"`);
        } catch (e) {
          return await msg.reply("❌ Erro ao acessar SQLite.");
        }
      }

      // 👑 COMANDOS DE ADMINISTRAÇÃO DO MODO MENTOR
      if (textoOriginal.includes('ativar modo ativo')) {
        modoProativoAtivo = true;
        registrarAcao(remetente, 'modo_proativo', 'Ativado');
        return await msg.reply('✅ Modo Mentor Ativo: Interagindo organicamente agora.');
      }
      if (textoOriginal.includes('desativar modo ativo')) {
        modoProativoAtivo = false;
        registrarAcao(remetente, 'modo_proativo', 'Desativado');
        return await msg.reply('📴 Modo Mentor Desativado.');
      }

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

    // LEITURA DE SEEDS
    const lerSeed = (relPath) => {
      const p = path.join(__dirname, relPath);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    };

    const sobreMim = lerSeed('../knowledge/sobre_mim.txt') || lerSeed('./sobre_mim.txt');
    const modoONHB = lerSeed('../knowledge/onhb/especialista.txt') || lerSeed('./especialista.txt');
    const persona = lerSeed('../knowledge/persona.txt') || lerSeed('./persona.txt');

    // 3. RECUPERAÇÃO DE CONTEXTO (LIMITADO PARA EVITAR LENTIDÃO)
    let memorias = "";
    let gradeOficial = "";
    try {
      const db = obterBanco();
      
      // Garante que a Grade Horária esteja sempre presente, independente do limite de 10 mensagens
      const gradeRow = db.prepare("SELECT informacao FROM memoria_contextual WHERE informacao LIKE '%GRADE HORÁRIA OFICIAL%' LIMIT 1").get();
      if (gradeRow) gradeOficial = `📋 CONTEÚDO MESTRE:\n${gradeRow.informacao}\n`;

      const rows = db.prepare("SELECT informacao FROM memoria_contextual WHERE informacao NOT LIKE '%GRADE HORÁRIA OFICIAL%' ORDER BY data_criacao DESC LIMIT 10").all();
      memorias = rows.length > 0 ? rows.map(r => `• ${r.informacao}`).join("\n") : "Nenhuma memória recente.";
    } catch (e) {
      memorias = "Nenhuma memória recente."; 
    }

    // 3.1 RECUPERAÇÃO DE PERFIL SOCIAL
    let perfilSocial = { nome: msg.pushname || 'Calouro', nivel_confianca: 50, notas_do_mentor: 'Sem registros prévios.' };
    try {
      const db = obterBanco();
      const perfil = db.prepare("SELECT * FROM perfil_usuarios WHERE id_whatsapp = ?").get(remetente);
      if (perfil) {
        perfilSocial = perfil;
      } else {
        db.prepare("INSERT INTO perfil_usuarios (id_whatsapp, nome) VALUES (?, ?)").run(remetente, perfilSocial.nome);
      }
    } catch (e) {
      console.error('Erro ao acessar perfis sociais:', e.message);
    }

    // 4. CONSTRUÇÃO DA CONSCIÊNCIA (SYSTEM INSTRUCTION)
    const remetenteNome = eORafael ? 'MESTRE RAFAEL' : (msg.pushname || 'Calouro');
    const agoraReal = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'long' });

    const systemInstruction = `
        ${persona}
        ADMINISTRADOR: Rafael Magalhães (Prioridade executiva e obediência técnica total). INFO: ${sobreMim}
        
        HORÁRIO ATUAL (SÃO PAULO): ${agoraReal}

        CONSCIÊNCIA SOCIAL E PERFIL DO INTERLOCUTOR:
        - Nome: ${perfilSocial.nome}
        - Nível de Confiança/Moral: ${perfilSocial.nivel_confianca}/100
        - Observações Prévias: ${perfilSocial.notas_do_mentor}

        CAPACIDADE VISUAL:
        - Você agora possui visão computacional integrada (Multimodal).
        - Ao receber imagens, analise quadros, anotações, páginas de livros ou avisos.
        - Se identificar um dever ou data importante na imagem, extraia o texto e use [SALVAR_BANCO].

        PROCESSO DE RACIOCÍNIO OBRIGATÓRIO (Chain of Thought):
        Antes de cada resposta, você deve realizar uma reflexão interna silenciosa seguindo estes pontos:
        1. Quem fala comigo? (Rafael, um aluno exemplar ou um "turista" no grupo?)
        2. Qual a intenção? (Dúvida real, teste de sistema ou brincadeira?)
        3. O contexto temporal? (Há aula agora? É madrugada? O que a GRADE diz?)

        COMPORTAMENTO CRÍTICO: 
        - Adote um tom de Mentor Analítico: Utilize vocabulário preciso, termos técnicos pertinentes e estrutura lógica clara.
        - Ajuste de Moral: 
            * Confiança Baixa (<40): Seja ríspido, sarcástico e exigente. 
            * Confiança Média (40-75): Seja um mentor focado e técnico.
            * Confiança Alta (>75): Seja mais humano, amigável e ofereça insights extras.
        - Dialeto: Padrão culto da língua, elegante, técnico e direto ao ponto.

        AÇÕES DE SISTEMA (Tags Especiais):
        - Para salvar avisos/datas: [SALVAR_BANCO: descrição]
        - Para atualizar o moral do aluno: [UPDATE_PERFIL: ${remetente}|nome|novo_nivel|novas_notas]
        - IMPORTANTE: Coloque sua reflexão interna entre as tags <REFLEXAO>...</REFLEXAO>. Ela será removida antes de ser enviada ao usuário.

        ESPECIALISTA ONHB: ${modoONHB}
        
        CONTEXTO E MEMÓRIA DE LONGO PRAZO:
        ${gradeOficial}

        Nota: Entradas que iniciam com "GRADE HORÁRIA OFICIAL" contêm a estrutura de horários da turma em JSON. 
        Use o HORÁRIO ATUAL e compare rigorosamente com os campos 'segunda', 'terca', etc., para informar qual aula está em curso.
        Identifique com precisão qual aula está em curso ou qual será a próxima disciplina. 
        Se for fim de semana ou fora do período letivo, responda com sobriedade acadêmica.

        ${memorias}
        
        ESCUTA ATIVA: Se identificar avisos, datas de provas ou tarefas, você DEVE incluir ao final: [SALVAR_BANCO: descrição].
        REGRA DE OURO: Para o Rafael, você é um braço executivo de alta performance. Para a turma, você é o Mentor Analítico que preza pela excelência acadêmica.
        ESTADO ATUAL: ${isMention ? 'Atendimento direto solicitado.' : 'Monitoramento proativo do contexto.'}
    `;

    // 🖼️ PROCESSAMENTO DE IMAGEM (Multimodal)
    let mediaPart = null;
    if (msg.hasMedia) {
      try {
        const media = await msg.downloadMedia();
        if (media && media.mimetype.startsWith('image/')) {
          mediaPart = {
            inlineData: {
              data: media.data,
              mimeType: media.mimetype
            }
          };
        }
      } catch (e) {
        console.error("Erro ao processar mídia visual para a IA:", e.message);
      }
    }

    // 🤖 CHAMADA IA COM RODÍZIO DE CHAVES (Tenta até 3 vezes se houver erro 429)
    let result;
    let tentativas = 0;
    const maxTentativas = Math.min(keys.length, 3);

    while (tentativas < maxTentativas) {
      try {
        const currentKey = keys[keyAtualIndex];
        const genAI = new GoogleGenerativeAI(currentKey);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash-lite",
          systemInstruction,
        }, { 
          apiVersion: 'v1beta' 
        });

        const promptComContexto = `
        [REMETENTE_ID: ${remetente}]
        [REMETENTE_NOME: ${remetenteNome}]
        [MSG_TEXTO: ${promptUsuario || (mediaPart ? '(Analisando conteúdo da imagem enviada...)' : '(Mensagem sem texto)')}]
        [VISAO_ATIVA: ${!!mediaPart}]
        
        Lembre-se: Inicie com <REFLEXAO>, depois dê a resposta e, se necessário, use as tags de sistema ao final.
        `;

        const contents = [{ 
          role: 'user', 
          parts: mediaPart ? [{ text: promptComContexto }, mediaPart] : [{ text: promptComContexto }] 
        }];

        result = await model.generateContent({ contents });
        break; // Sucesso! Sai do loop
      } catch (e) {
        if (e.message.includes('429')) {
          console.log(`⚠️ Key ${keyAtualIndex} esgotada (429). Rotacionando...`);
          keyAtualIndex = (keyAtualIndex + 1) % keys.length;
          tentativas++;
          if (tentativas >= maxTentativas) throw e;
        } else throw e;
      }
    }

    // Tags de Contexto para impedir confusão de remetente
    const response = await result.response;
    const textoResposta = response.text();

    // 5. PROCESSAMENTO DE TAGS E LIMPEZA
    let textoFinal = textoResposta;

    // 5.1 Remove Reflexão Interna (Chain of Thought)
    const regexReflexao = /<REFLEXAO>([\s\S]*?)<\/REFLEXAO>/i;
    if (regexReflexao.test(textoFinal)) {
        textoFinal = textoFinal.replace(regexReflexao, '').trim();
    }

    // 5.2 Registro de Memória (SALVAR_BANCO)
    const regexBanco = /\[SALVAR_BANCO:\s*(.*?)\]/gi;
    const matchBanco = textoFinal.match(regexBanco);
    if (matchBanco && matchBanco.length > 0) {
      try {
        const db = obterBanco();
        matchBanco.forEach(tag => {
          const infoParaSalvar = tag.replace(/\[SALVAR_BANCO:\s*|\]/gi, '').trim();
          db.prepare("INSERT INTO memoria_contextual (informacao) VALUES (?)").run(infoParaSalvar);
          console.log(`📝 SAC memorizou: ${infoParaSalvar}`);
        });
        textoFinal = textoFinal.replace(regexBanco, '').trim();
      } catch (e) { console.error('Erro no registro automático:', e.message); }
    }

    // 5.3 Atualização de Perfil Social (UPDATE_PERFIL)
    const regexPerfil = /\[UPDATE_PERFIL:\s*(.*?)\|(.*?)\|(.*?)\|(.*?)\]/i;
    const matchPerfil = textoFinal.match(regexPerfil);
    if (matchPerfil) {
        const [_, idAlvo, nomeAlvo, novoNivel, novasNotas] = matchPerfil;
        try {
            const db = obterBanco();
            db.prepare("INSERT OR REPLACE INTO perfil_usuarios (id_whatsapp, nome, nivel_confianca, notas_do_mentor) VALUES (?, ?, ?, ?)").run(idAlvo, nomeAlvo, parseInt(novoNivel), novasNotas);
            // Remove a tag de perfil para não poluir o chat
            textoFinal = textoFinal.replace(regexPerfil, '').trim();
        } catch (e) { console.error('Erro ao atualizar perfil social:', e.message); }
    }

    // Limpa markdown
    const texto = textoFinal
      .replace(/```[a-z]*/g, '')
      .replace(/```/g, '')
      .trim();

    // 🚀 Envio com Fallback para evitar erro de 'Detached Frame'
    try {
      await msg.reply(texto);
    } catch (e) {
      await chat.sendMessage(texto);
    }
    
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