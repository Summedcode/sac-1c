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
const keys = (process.env.GEMINI_KEYS || process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || "").split(',').map(k => k.trim()).filter(k => k);
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

  const idUsuario = msg.author || msg.from; // Identificador único (mesmo em grupos)
  const timestampMs = Date.now();

  // Identificação do Administrador (Rafael)
  const adminNum = (process.env.ADMIN_PHONE || '556191731943').replace(/\D/g, '');
  const adminLid = '214624129552601';
  const eORafael = (adminNum && idUsuario.includes(adminNum)) || idUsuario.includes(adminLid);

  // Otimização: Limpa o mapa se ficar muito grande (prevenção de vazamento de memória)
  if (usuariosAtivos.size > 1000) {
    usuariosAtivos.clear();
  }

  // 1. LÓGICA ANTI-FLOOD
  let info = usuariosAtivos.get(idUsuario) || { contagem: 0, ultimaVez: 0, avisoEnviado: false };
  
  // Se passou mais de 5s desde a ÚLTIMA mensagem aceita, reseta a contagem (Anti-flood mais rápido)
  if (timestampMs - info.ultimaVez > 5000 || info.contagem === 0) {
    info.contagem = 0;
    info.ultimaVez = timestampMs;
  }

  info.contagem += 1;
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

  // Se for o Rafael no privado, ou se for menção, ou se a chance proativa bater
  const chat = await msg.getChat();
  const isPrivate = !chat.isGroup;
  if (!isMention && !chanceProativa && !(isPrivate && eORafael)) return;

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
    const db = obterBanco(); // Otimização: Abre o banco apenas uma vez por chamada

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
    if (!chat.isGroup && !eORafael) {
      return await msg.reply('Olá! Eu sou o SAC, um sistema dedicado ao aprendizado coletivo. Minhas funções de auxílio estão restritas ao uso dentro do grupo oficial da turma 1C.');
    }

    // 🔒 Bloqueio por ID de Grupo (Opcional):
    // Se você quiser que ele responda APENAS ao grupo da 1C e ignore outros grupos:
    const GRUPO_ID_AUTORIZADO = process.env.GROUP_ID; // Você pode definir isso no seu .env
    if (GRUPO_ID_AUTORIZADO && msg.from !== GRUPO_ID_AUTORIZADO && !eORafael) {
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

    // Lógica de Calendário e Cardápio Acadêmico 2026
    // Otimização: Força o fuso horário de Brasília para evitar virada de mês antecipada em servidores gringos
    const dataBrasilia = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const dataFormatada = dataBrasilia.toLocaleDateString('pt-BR');
    const mesAtual = dataBrasilia.getMonth(); // Janeiro = 0, Abril = 3
    const nomeMesAtual = dataBrasilia.toLocaleString('pt-BR', { month: 'long' });

    // Lógica de Cardápio Dinâmico (Vigência: Abril)
    let blocoCardapio = "O cardápio deste mês ainda não foi cadastrado ou já expirou.";
    if (mesAtual === 3) { 
        blocoCardapio = `
        * 01/04 (Qua): Cuscuz com queijo, Suco de polpa, Fruta.
        * 06/04 a 10/04: Religiosa de frango (06), Bolo chocolate (07), Pão brioche (08), Chipa (09), Pizza (10).
        * 13/04 a 17/04: Queijo quente (13), Cuscuz (14), Bolo Ninho (15), Religiosa de frango (16), Hambúrguer (17).
        * 22/04 a 24/04: Misto quente (22), Pão pizza (23), Pão carne moída (24).
        * 27/04 a 30/04: Enroladinho queijo (27), Bolo do Hulk (28), Sanduíche natural (29), Croissant (30).
        * Recessos (Sem lanche): 02, 03, 20 e 21/04.`;
    }

    const changelogRecente = `
    - Calendário Acadêmico 2026 integralmente integrado.
    - Regra de Média/Recuperação SESC (Teto 6.0) rigorosamente ativa.
    - Cardápio Dinâmico validado para o mês de ${nomeMesAtual}.
    - Bypass de restrições para o Administrador Rafael Magalhães.
    - Redução do tempo de Anti-flood para 5 segundos.
    `;

    const systemInstruction = `
        ${persona}
        Você é o SAC oficial do EduSESC 2026. Use a data atual ${dataFormatada} como referência absoluta.
        ADMINISTRADOR: Rafael Magalhães (Prioridade executiva e obediência técnica total). INFO: ${sobreMim}
        
        A) CÁLCULO DE NOTAS E RECUPERAÇÃO (ALGORITMO):
        Média: (N1 + N2) / 2. Aprovação: 6,0.
        Recuperação: Substitua a menor nota (N1 ou N2) pela nota da recuperação. Recalcule a média.
        REGRA DO TETO (CRÍTICO): Se após a recuperação a média final for maior que 6,0, o resultado registrado deve ser EXATAMENTE 6,0. Realize o cálculo passo a passo na sua <REFLEXAO>.
        Segunda Chamada: R$ 60,00 (exceto com atestado médico entregue em 48h).

        B) CALENDÁRIO ACADÊMICO COMPLETO 2026:
        1º Trimestre: 02/02 a 15/05. (Recuperação: 11/05 e 12/05).
        2º Trimestre: 18/05 a 04/09. (Recuperação: 31/08 e 01/09).
        3º Trimestre: 08/09 a 16/12. (Recuperação Final: 17/12).
        Feriados e Recessos:
        Fev: 16, 17 e 18 (Carnaval).
        Abr: 02 a 04 (Paixão), 20 e 21 (Aniv. Brasília/Tiradentes).
        Mai: 01 (Trabalho).
        Jun: 04 e 05 (Corpus Christi).
        Jul: 06 a 17 (Recesso Escolar).
        Set: 07 (Independência).
        Out: 12 (Nsa. Sra. Aparecida), 13 e 15 (Dia do Professor), 30 (Recesso).
        Nov: 02 (Finados), 15 (Proclamação), 20 (C. Negra), 30 (Evangélico).
        Sábados Letivos: 18/04 (Oficina Redação) e 03/10 (Planeta SESC).
        Resultados Finais: 18/12/2026.

        C) CARDÁPIO ESCOLAR (Sazonal):
        ${blocoCardapio}

        DIRETRIZES: Responda de forma curta e em tópicos. Se o usuário perguntar por meses sem cardápio, informe que ainda não foi liberado.

        ÚLTIMAS ATUALIZAÇÕES DO SISTEMA (CHANGELOG): ${changelogRecente}

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
    let result = null;
    let tentativas = 0;
    const maxTentativas = keys.length > 0 ? Math.min(keys.length, 3) : 0;

    if (maxTentativas === 0) {
      throw new Error("Configuração ausente: Nenhuma chave (GEMINI_KEY ou GEMINI_API_KEY) foi encontrada.");
    }

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

    // Verificação de segurança para evitar "Cannot read properties of undefined (reading 'response')"
    if (!result || typeof result.response === 'undefined') {
      throw new Error("A API do Gemini não retornou um objeto de resposta válido.");
    }

    const response = await result.response;
    let textoResposta = "";
    
    try {
      textoResposta = response.text();
    } catch (e) {
      console.warn("⚠️ Resposta bloqueada pelos filtros de segurança da IA.");
      return await msg.reply("Minha análise ética detectou que não posso responder a essa solicitação específica. Como posso ajudar com outros temas acadêmicos?");
    }

    // 5. PROCESSAMENTO DE TAGS E LIMPEZA
    let textoFinal = textoResposta;

    // 5.1 Remove Reflexão Interna (Chain of Thought)
    const regexReflexao = /<REFLEXAO>([\s\S]*?)<\/REFLEXAO>/gi;
    if (regexReflexao.test(textoFinal)) {
        textoFinal = textoFinal.replace(regexReflexao, '').trim();
    }

    // 5.2 Registro de Memória (SALVAR_BANCO)
    const regexBanco = /\[SALVAR_BANCO:\s*([\s\S]*?)\]/gi;
    const matchBanco = textoFinal.match(regexBanco);
    if (matchBanco && matchBanco.length > 0) {
      try {
        matchBanco.forEach(tag => {
          const infoParaSalvar = tag.replace(/\[SALVAR_BANCO:\s*/i, '').replace(/\]$/i, '').trim();
          db.prepare("INSERT INTO memoria_contextual (informacao) VALUES (?)").run(infoParaSalvar);
          console.log(`📝 SAC memorizou: ${infoParaSalvar}`);
        });
        textoFinal = textoFinal.replace(regexBanco, '').trim();
      } catch (e) { console.error('Erro no registro automático:', e.message); }
    }

    // 5.3 Atualização de Perfil Social (UPDATE_PERFIL)
    const regexPerfil = /\[UPDATE_PERFIL:\s*([\s\S]*?)\|([\s\S]*?)\|([\s\S]*?)\|([\s\S]*?)\]/gi;
    const matchPerfil = textoFinal.match(regexPerfil);
    if (matchPerfil) {
        matchPerfil.forEach(perfilTag => {
            try {
                const partes = perfilTag.replace(/\[UPDATE_PERFIL:\s*/i, '').replace(/\]$/i, '').split('|');
                const [idAlvo, nomeAlvo, novoNivel, novasNotas] = partes.map(p => p.trim());
                db.prepare("INSERT OR REPLACE INTO perfil_usuarios (id_whatsapp, nome, nivel_confianca, notas_do_mentor) VALUES (?, ?, ?, ?)").run(idAlvo, nomeAlvo, parseInt(novoNivel) || 50, novasNotas);
            } catch (e) { console.error('Erro ao atualizar perfil social:', e.message); }
        });
        // Remove as tags de perfil para não poluir o chat
        textoFinal = textoFinal.replace(regexPerfil, '').trim();
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
    console.error('❌ ERRO NO SAC:', erro);
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