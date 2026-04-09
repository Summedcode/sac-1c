/**
 * 🤖 SAC-1C — Handler Principal da IA
 * Autor: Rafael Magalhães | Versão: 2.0.0
 */
'use strict';
const fs   = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { registrarAcao, registrarErro } = require('../utils/logger');
const { obterBanco } = require('../database');
const { bloquearUsuario, desbloquearUsuario, isUsuarioBloqueado } = require('../tasks/taskService');

const GEMINI_KEY  = process.env.GEMINI_KEY || process.env.GEMINI_API_KEY;
const GRUPO_ID    = process.env.GROUP_ID || null;
const ADMIN_PHONE = (process.env.ADMIN_PHONE || '556191731943').replace(/\D/g, '');
const ADMIN_LID   = process.env.ADMIN_LID || '214624129552601';

if (GEMINI_KEY) console.log(`✅ [SAC] Gemini: ${GEMINI_KEY.substring(0,8)}...`);
else console.warn('⚠️ [SAC] GEMINI_KEY não encontrada.');

function lerArquivo(...caminhos) {
  for (const c of caminhos) {
    try { if (fs.existsSync(c)) return fs.readFileSync(c, 'utf8').trim(); } catch (_) {}
  }
  return '';
}
const SOBRE_MIM    = lerArquivo('./src/handlers/sobre_mim.txt',    './src/knowledge/sobre_mim.txt');
const PERSONA      = lerArquivo('./src/handlers/persona.txt',      './src/knowledge/persona.txt');
const ESPECIALISTA = lerArquivo('./src/handlers/especialista.txt', './src/knowledge/especialista.txt');

const CARDAPIO = {
  3: `01/04: Cuscuz com queijo. 06-10/04: Religiosa frango(06), Bolo choco(07), Brioche(08), Chipa(09), Pizza(10).
13-17/04: Queijo quente(13), Cuscuz(14), Bolo Ninho(15), Religiosa(16), Hambúrguer(17).
22-24/04: Misto quente(22), Pão pizza(23), Pão c/ carne moída(24).
27-30/04: Enroladinho queijo(27), Bolo do Hulk(28), Sanduíche natural(29), Croissant(30).
Sem lanche: 02, 03, 20 e 21/04.`,
};
const getCardapio = mes => CARDAPIO[mes] || 'Cardápio deste mês ainda não cadastrado.';

// Anti-flood — janela deslizante de 10s
const floodMap = new Map();
function isFlood(id) {
  const agora = Date.now();
  const ts    = (floodMap.get(id) || []).filter(t => agora - t < 10000);
  ts.push(agora);
  floodMap.set(id, ts);
  if (floodMap.size > 2000) floodMap.clear();
  return ts.length > 4;
}

// Fila de mensagens
const fila = [];
let processando = false;
let modoProativo = true;

async function enfileirar(msg, isMention, idUsuario) {
  fila.push({ msg, isMention, idUsuario });
  if (!processando) processarFila();
}

async function processarFila() {
  if (processando || fila.length === 0) return;
  processando = true;
  while (fila.length > 0) {
    const item = fila.shift();
    try { await executarIA(item.msg, item.isMention, item.idUsuario); }
    catch (e) { console.error('[SAC] Erro na fila:', e.message); }
    await new Promise(r => setTimeout(r, 1800));
  }
  processando = false;
}

function eAdmin(id) {
  if (!id) return false;
  return id.includes(ADMIN_PHONE) || id.includes(ADMIN_LID) || id === ADMIN_PHONE + '@c.us';
}

async function handleSAC(msg, isMention) {
  if (msg.fromMe) return;
  const agora = Math.floor(Date.now() / 1000);
  if (msg.timestamp < agora - 15) return;

  const idUsuario = msg.author || msg.from;
  const isRafael  = eAdmin(idUsuario);

  if (!isRafael && isFlood(idUsuario)) return;

  const chat    = await msg.getChat();
  const isGrupo = chat.isGroup;

  if (GRUPO_ID && isGrupo && msg.from !== GRUPO_ID && !isRafael) return;
  if (!isGrupo && !isRafael) {
    return await msg.reply('Minhas funções ficam no grupo da turma 1C. Te vejo por lá! 🎓');
  }
  if (!isRafael && isUsuarioBloqueado(idUsuario)) return;

  if (!isMention && !isRafael) {
    const t = msg.body.toLowerCase();
    const keys = ['prova','dever','trabalho','nota','aula','onhb','simulado','data',
                  'cardapio','cardápio','média','recuperação','atividade','exercicio','lição','materia'];
    const temKey = keys.some(k => t.includes(k)) || msg.hasMedia;
    if (Math.random() > (temKey ? 0.65 : 0.02)) return;
  }
  enfileirar(msg, isMention, idUsuario);
}

async function executarIA(msg, isMention, idUsuario) {
  const db       = obterBanco();
  const isRafael = eAdmin(idUsuario);
  const nome     = isRafael ? 'RAFAEL (ADMIN)' : (msg.pushname || 'Aluno');
  const chat     = await msg.getChat();
  const promptUsuario = msg.body.replace(/^@?\s*sac\s*/i, '').trim();

  if (!promptUsuario && !msg.hasMedia && isMention) return await msg.reply('Aqui, presente. O que precisa? 📚');
  if (!promptUsuario && !msg.hasMedia) return;

  // Comandos admin
  if (isRafael) {
    const cmd = promptUsuario.toLowerCase();
    if (cmd.startsWith('colocar no banco')) {
      const c = promptUsuario.split(/colocar no banco/i)[1]?.trim();
      if (!c) return await msg.reply('⚠️ O que devo memorizar?');
      try { db.prepare('INSERT INTO memoria_contextual (informacao) VALUES (?)').run(c); return await msg.reply(`✅ Memorizado: "${c}"`); }
      catch { return await msg.reply('❌ Erro no banco.'); }
    }
    const matchAp = promptUsuario.match(/^apague?\s+(.+)/i);
    if (matchAp) {
      const chave = matchAp[1].trim();
      if (chave.length < 3) return await msg.reply('⚠️ Chave muito curta.');
      try {
        const r = db.prepare('DELETE FROM memoria_contextual WHERE informacao LIKE ?').run(`%${chave}%`);
        return await msg.reply(r.changes > 0 ? `✅ ${r.changes} entrada(s) removida(s).` : '⚠️ Nenhuma entrada encontrada.');
      } catch { return await msg.reply('❌ Erro na exclusão.'); }
    }
    const matchSav = msg.body.match(/salvar:\s*\[(.*?)\]\s*validade:\s*\[(.*?)\]/i);
    if (matchSav) {
      const [, c, d] = matchSav;
      const p = d.trim().split('/');
      let exp = null;
      if (p.length === 3) { const [dd,mm,aa] = p.map(x=>x.trim()); exp = `${aa.length===2?'20'+aa:aa}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`; }
      try { db.prepare('INSERT INTO memoria_contextual (informacao, data_expiracao) VALUES (?,?)').run(c.trim(), exp); return await msg.reply(`✅ Memorizado até ${d}: "${c.trim()}"`); }
      catch { return await msg.reply('❌ Erro ao salvar.'); }
    }
    if (cmd.includes('ativar modo ativo'))    { modoProativo = true;  return await msg.reply('✅ Modo proativo ativado.'); }
    if (cmd.includes('desativar modo ativo')) { modoProativo = false; return await msg.reply('📴 Modo proativo desativado.'); }
    if (cmd.startsWith('silenciar') || cmd.startsWith('mute')) {
      const alvo = msg.hasQuotedMsg ? (await msg.getQuotedMessage()).author : msg.mentionedIds[0];
      if (!alvo) return await msg.reply('❌ Responda à mensagem ou mencione o aluno.');
      const min = parseInt(cmd.split(/\s+/)[1]) || null;
      bloquearUsuario(alvo, min);
      return await msg.reply(`✅ Silenciado${min ? ` por ${min} min` : ' indefinidamente'}.`);
    }
    if (cmd.startsWith('liberar') || cmd.startsWith('falar')) {
      const alvo = msg.hasQuotedMsg ? (await msg.getQuotedMessage()).author : msg.mentionedIds[0];
      if (!alvo) return await msg.reply('❌ Responda ou mencione o aluno.');
      desbloquearUsuario(alvo);
      return await msg.reply('✅ Usuário liberado.');
    }
  }

  // Contexto
  const brasilia   = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const hojeISO    = brasilia.toISOString().split('T')[0];
  const hojeFormatado = brasilia.toLocaleDateString('pt-BR');
  const agoraStr   = brasilia.toLocaleString('pt-BR', { timeZone:'America/Sao_Paulo', weekday:'long', hour:'2-digit', minute:'2-digit', day:'2-digit', month:'long' });

  try { db.prepare('DELETE FROM memoria_contextual WHERE data_expiracao IS NOT NULL AND data_expiracao < ?').run(hojeISO); } catch (_) {}

  let gradeOficial = '', memorias = '';
  try {
    const gr = db.prepare("SELECT informacao FROM memoria_contextual WHERE informacao LIKE '%GRADE HORÁRIA OFICIAL%' LIMIT 1").get();
    if (gr) gradeOficial = `📋 Grade Oficial:\n${gr.informacao}`;
    const rows = db.prepare("SELECT informacao FROM memoria_contextual WHERE informacao NOT LIKE '%GRADE HORÁRIA OFICIAL%' ORDER BY data_criacao DESC LIMIT 10").all();
    memorias = rows.map(r => `• ${r.informacao}`).join('\n');
  } catch (_) {}

  let perfil = { nivel_confianca: 50, notas_do_mentor: '' };
  try {
    const p = db.prepare('SELECT * FROM perfil_usuarios WHERE id_whatsapp = ?').get(idUsuario);
    if (p) perfil = p;
    else db.prepare('INSERT INTO perfil_usuarios (id_whatsapp, nome) VALUES (?,?)').run(idUsuario, nome);
  } catch (_) {}

  let contextTarefas = '';
  try {
    const tfs = db.prepare(`SELECT materia, tipo, data_vencimento, descricao FROM tarefas WHERE concluida=0 AND ativo=1 AND (data_vencimento >= ? OR data_vencimento IS NULL) ORDER BY data_vencimento LIMIT 8`).all(hojeISO);
    if (tfs.length > 0) contextTarefas = '📚 Tarefas pendentes:\n' + tfs.map(t=>`• [${t.materia||'?'}] ${t.tipo} — ${t.descricao} (até ${t.data_vencimento||'?'})`).join('\n');
  } catch (_) {}

  const ton = perfil.nivel_confianca < 40 ? 'Seja mais direto e exigente.' : perfil.nivel_confianca > 75 ? 'Seja mais humano e amigável.' : 'Seja um mentor focado e técnico.';

  const systemInstruction = `${PERSONA}\n${SOBRE_MIM}

HORÁRIO ATUAL (BRASÍLIA): ${agoraStr} | DATA: ${hojeFormatado}
ADMINISTRADOR: Rafael Magalhães — obediência total, prioridade máxima.

REGRAS ACADÊMICAS:
Média: (N1+N2)/2. Aprovação ≥ 6,0. Recuperação: substitui a menor nota. TETO pós-rec = 6,0.
Segunda chamada: R$60 (isento c/ atestado em 48h).

CALENDÁRIO 2026:
1ºTrim: 02/02–15/05 (rec 11-12/05) | 2ºTrim: 18/05–04/09 (rec 31/08-01/09) | 3ºTrim: 08/09–16/12 (rec 17/12)
Feriados: Carnaval 16-18/fev, Paixão 02-04/abr, Tiradentes 20-21/abr, Trabalho 01/mai,
Corpus 04-05/jun, Recesso 06-17/jul, Independência 07/set, Aparecida 12/out,
Prof 13-15/out, Finados 02/nov, Proclamação 15/nov, C.Negra 20/nov.

CARDÁPIO (${brasilia.toLocaleString('pt-BR',{month:'long'})}):
${getCardapio(brasilia.getMonth())}

PERFIL: ${nome} | Confiança: ${perfil.nivel_confianca}/100 | ${ton}
${perfil.notas_do_mentor ? `Observações: ${perfil.notas_do_mentor}` : ''}

${contextTarefas}
${gradeOficial}
${memorias ? `MEMÓRIA:\n${memorias}` : ''}

ESPECIALIDADE ONHB: ${ESPECIALISTA}

AÇÕES (use no final se necessário):
[SALVAR_BANCO: texto] — memoriza informação
[UPDATE_PERFIL: id|nome|nivel|notas] — atualiza perfil

ESTILO: Respostas curtas, em tópicos, sem repetir a pergunta.
Reflexão interna em <REFLEXAO>...</REFLEXAO> — removida antes de enviar.
Estado: ${isMention ? 'Chamado diretamente.' : 'Intervenção proativa.'}`.trim();

  // Imagem
  let mediaPart = null;
  if (msg.hasMedia) {
    try {
      const media = await msg.downloadMedia();
      if (media?.mimetype?.startsWith('image/')) mediaPart = { inlineData: { data: media.data, mimeType: media.mimetype } };
    } catch (e) { console.error('[SAC] Mídia:', e.message); }
  }

  if (!GEMINI_KEY) { if (isRafael) await msg.reply('❌ GEMINI_KEY não configurada.'); return; }

  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction }, { apiVersion: 'v1beta' });

  const promptFinal = `[ID: ${idUsuario}] [NOME: ${nome}]\n${promptUsuario || (mediaPart ? '(analise a imagem)' : '')}`;
  const parts = mediaPart ? [{ text: promptFinal }, mediaPart] : [{ text: promptFinal }];

  let resultado;
  try { resultado = await model.generateContent({ contents: [{ role: 'user', parts }] }); }
  catch (e) { console.error('[SAC] Gemini:', e.message); return await msg.reply('⚠️ Estou sobrecarregado. Tente em instantes!'); }

  if (!resultado?.response) return;

  let texto = '';
  try { texto = resultado.response.text(); }
  catch { return await msg.reply('Não consigo responder isso. Outra dúvida?'); }

  // Pós-processamento
  texto = texto.replace(/<REFLEXAO>[\s\S]*?<\/REFLEXAO>/gi, '').trim();

  for (const m of [...texto.matchAll(/\[SALVAR_BANCO:\s*([\s\S]*?)\]/gi)]) {
    try { db.prepare('INSERT INTO memoria_contextual (informacao) VALUES (?)').run(m[1].trim()); console.log(`📝 Memorizado: ${m[1].trim().slice(0,60)}`); } catch (_) {}
  }
  texto = texto.replace(/\[SALVAR_BANCO:[\s\S]*?\]/gi, '').trim();

  for (const m of [...texto.matchAll(/\[UPDATE_PERFIL:\s*([\s\S]*?)\]/gi)]) {
    try {
      const [idA, nomeA, nivel, notas] = m[1].split('|').map(s => s.trim());
      db.prepare('INSERT OR REPLACE INTO perfil_usuarios (id_whatsapp, nome, nivel_confianca, notas_do_mentor) VALUES (?,?,?,?)').run(idA, nomeA, parseInt(nivel)||50, notas);
    } catch (_) {}
  }
  texto = texto.replace(/\[UPDATE_PERFIL:[\s\S]*?\]/gi, '').trim();
  texto = texto.replace(/```[\s\S]*?```/g, '').replace(/```/g, '').trim();

  if (!texto) return;

  try { await msg.reply(texto); } catch { await chat.sendMessage(texto); }
  registrarAcao(idUsuario, 'sac_ia', promptUsuario.slice(0, 50));
}

module.exports = { handleSAC };
