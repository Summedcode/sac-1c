#!/usr/bin/env node

/**
 * Integração com Google Gemini
 * 
 * Uso:
 *   npm install @google/generative-ai
 *   GEMINI_API_KEY=sua_key node src/integracoes/gemini.js
 * 
 * Pegar API key:
 *   https://makersuite.google.com/app/apikey (Google login + click em Create API Key)
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function gerarTarefasComGemini() {
  console.log('🤖 Iniciando Gemini...\n')

  try {
    // 1. BUSCAR PROGRESSO DO SEU BANCO
    console.log('📊 1️⃣ Buscando progresso do seu banco...')
    const token = process.env.API_TOKEN || 'sac1c_bot_2025'
    const respostaProgresso = await fetch('http://localhost:3000/api/gemini/progresso', {
      headers: { 
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    })
    const progresso = await respostaProgresso.json()

    if (!progresso.sucesso) {
      console.error('❌ Erro ao buscar progresso:', progresso)
      return
    }

    console.log('✅ Dados recebidos:')
    console.log(`   Total: ${progresso.dados.total}`)
    console.log(`   Concluídas: ${progresso.dados.concluidas}`)
    console.log(`   Pendentes: ${progresso.dados.pendentes}`)
    console.log(`   Progresso: ${progresso.dados.percentual}%\n`)

    // 2. CRIAR PROMPT COM INSTRUÇÕES
    const prompt = `
Você é um assistente educacional. Baseado nesse progresso de estudos, analise e gere 3-5 novas tarefas prioritárias:

PROGRESSO ATUAL:
- Total de tarefas: ${progresso.dados.total}
- Concluídas: ${progresso.dados.concluidas} 
- Pendentes: ${progresso.dados.pendentes}
- Percentual concluído: ${progresso.dados.percentual}%

Tarefas por matéria:
${progresso.dados.por_materia
  .map(
    (m) =>
      `- ${m.materia}: ${m.feitas} de ${m.total} concluídas (${((m.feitas / m.total) * 100).toFixed(0)}%)`
  )
  .join('\n')}

INSTRUÇÕES:
1. Identifique as matérias com menor progresso
2. Gere tarefas para melhorar o desempenho nessas áreas
3. Retorne APENAS um JSON válido neste formato (sem markdown ou explicações):

{
  "tarefas": [
    {
      "descricao": "descrição da tarefa (max 100 chars)",
      "materia": "nome da matéria",
      "tipo": "tarefa|prova|estudo",
      "prioridade": "alta|normal|baixa",
      "data_vencimento": "YYYY-MM-DD (próximos 7 dias)"
    }
  ]
}

Garanta que o JSON é válido e parseável. Tarefas devem ser específicas e acionáveis.
    `

    // 3. LISTAR MODELOS DISPONÍVEIS
    const modelId = 'gemini-1.5-flash';

    // 4. CHAMAR GEMINI
    console.log(`🧠 2️⃣ Enviando para Gemini (modelo: ${modelId})...`)
    // Forçamos a apiVersion 'v1' para evitar o erro 404 da v1beta
    const model = genAI.getGenerativeModel({ model: modelId }, { apiVersion: 'v1' });
    
    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 1024,
    };

    // Usamos um bloco try-catch específico para a geração de conteúdo
    let textoResposta;
    try {
      const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig });
      const response = await result.response;
      textoResposta = response.text();
    } catch (e) {
      console.error('❌ Erro na comunicação com a API do Gemini:', e.message);
      return;
    }

    console.log('✅ Gemini respondeu\n')

    // 4. EXTRAIR JSON DA RESPOSTA
    console.log('📝 3️⃣ Parseando resposta...')
    const jsonMatch = textoResposta.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error('❌ Resposta da IA não contém um bloco JSON válido')
      console.error('Resposta:', textoResposta)
      return
    }

    let tarefasGeradas;
    try {
      tarefasGeradas = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('❌ Erro ao parsear o JSON da IA:', e.message);
      return;
    }

    if (!tarefasGeradas || !tarefasGeradas.tarefas || tarefasGeradas.tarefas.length === 0) {
      console.error('❌ Nenhuma tarefa foi gerada')
      return
    }

    console.log(`✅ ${tarefasGeradas.tarefas.length} tarefas parseadas:\n`)
    tarefasGeradas.tarefas.forEach((t) => {
      console.log(`   📋 ${t.descricao}`)
      console.log(`      Matéria: ${t.materia} | Tipo: ${t.tipo} | Prioridade: ${t.prioridade}`)
      console.log(`      Vencimento: ${t.data_vencimento}\n`)
    })

    // 5. ENVIAR PARA SUA API
    console.log('🚀 4️⃣ Salvando no banco...')
    const respostaSalvar = await fetch('http://localhost:3000/api/gemini/gerar-tarefas', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ tarefas: tarefasGeradas.tarefas })
    })

    const resultado = await respostaSalvar.json()

    if (resultado.sucesso) {
      console.log(
        `\n✅ ${resultado.criadas}/${resultado.total_requisitado} tarefas criadas com sucesso!\n`
      )
      console.log('📱 Verifique no WhatsApp:')
      console.log('   !hoje     — Tarefas de hoje')
      console.log('   !semana   — Próximos 7 dias')
      console.log('   !stats    — Ver estatísticas\n')

      console.log('✨ Gemini integrado com sucesso!')
    } else {
      console.error('❌ Erro ao salvar:', resultado)
    }
  } catch (erro) {
    console.error('❌ Erro:', erro.message)
    console.error('\n💡 Dicas:')
    console.error('  1. API rodando? node start.js em outro terminal')
    console.error('  2. GEMINI_API_KEY configurado? Check .env')
    console.error('  3. Pakote instalado? npm install @google/generative-ai')
  }
}

// Rodar
gerarTarefasComGemini()
