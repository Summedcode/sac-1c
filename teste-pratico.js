#!/usr/bin/env node

/**
 * Script Prático de Teste
 * 
 * Testa TODOS os endpoints da API sem precisar de Postman
 * 
 * Uso:
 *   node teste-pratico.js
 */

const http = require('http')

// Helper para fazer requisições HTTP
function fazerRequisicao(metodo, caminho, dados = null) {
  return new Promise((resolve, reject) => {
    const token = 'sac1c_bot_2025' // Token padrão definido no seu .env
    const opcoes = {
      hostname: 'localhost',
      port: 3000,
      path: caminho,
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    }

    const req = http.request(opcoes, (res) => {
      let resposta = ''
      res.on('data', chunk => (resposta += chunk))
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(resposta)
          })
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: resposta
          })
        }
      })
    })

    req.on('error', reject)

    if (dados) {
      req.write(JSON.stringify(dados))
    }

    req.end()
  })
}

// Cores para terminal
const cores = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  vermelho: '\x1b[31m',
  amarelo: '\x1b[33m',
  azul: '\x1b[36m',
  cinza: '\x1b[90m'
}

async function teste() {
  console.log(`
${cores.azul}╔═════════════════════════════════════════════╗
║   TESTE COMPLETO DA API SAC-1C             ║
║   WhatsApp Bot + API REST + IA             ║
╚═════════════════════════════════════════════╝${cores.reset}
`)

  const testes = []
  let passaram = 0
  let falharam = 0

  // Função para executar um teste
  async function executarTeste(nome, metodo, caminho, dados = null) {
    try {
      console.log(`\n${cores.amarelo}→ ${nome}${cores.reset}`)
      console.log(`  ${cores.cinza}${metodo} ${caminho}${cores.reset}`)

      const resultado = await fazerRequisicao(metodo, caminho, dados)

      if (resultado.status >= 200 && resultado.status < 300) {
        console.log(`  ${cores.verde}✅ Status ${resultado.status}${cores.reset}`)
        console.log(
          `  ${cores.cinza}Resposta: ${JSON.stringify(resultado.body, null, 0).slice(0, 100)}${cores.reset}`
        )
        passaram++
        return true
      } else {
        console.log(`  ${cores.vermelho}❌ Status ${resultado.status}${cores.reset}`)
        console.log(`  ${cores.vermelho}Erro: ${JSON.stringify(resultado.body)}${cores.reset}`)
        falharam++
        return false
      }
    } catch (erro) {
      console.log(`  ${cores.vermelho}❌ Erro: ${erro.message}${cores.reset}`)
      falharam++
      return false
    }
  }

  // ─────────────────────────────────────
  // 1. VERIFICAR SAÚDE DA API
  // ─────────────────────────────────────
  console.log(`\n${cores.azul}━━━ 1. VERIFICAR SAÚDE DA API ━━━${cores.reset}`)
  await executarTeste('Health Check', 'GET', '/health')

  // ─────────────────────────────────────
  // 2. TAREFAS
  // ─────────────────────────────────────
  console.log(`\n${cores.azul}━━━ 2. TAREFAS ━━━${cores.reset}`)
  await executarTeste('Listar todas tarefas', 'GET', '/api/tarefas')
  await executarTeste('Tarefas de hoje', 'GET', '/api/tarefas/hoje')
  await executarTeste('Tarefas da semana', 'GET', '/api/tarefas/semana')
  await executarTeste('Todas as provas', 'GET', '/api/tarefas/provas')
  await executarTeste('Estatísticas', 'GET', '/api/tarefas/stats')

  // Criar uma tarefa
  const dataCriacao = new Date()
  dataCriacao.setDate(dataCriacao.getDate() + 2)
  const dataFormatada = dataCriacao.toISOString().split('T')[0]

  const tarefa = {
    descricao: 'Estudar para prova de Filosofia',
    materia: 'Filosofia',
    tipo: 'prova',
    data_vencimento: dataFormatada,
    prioridade: 'alta',
    criado_por: 'teste-pratico.js'
  }

  console.log(`\n${cores.amarelo}→ Criar nova tarefa${cores.reset}`)
  console.log(`  ${cores.cinza}POST /api/tarefas${cores.reset}`)
  console.log(`  ${cores.cinza}Dados: ${JSON.stringify(tarefa, null, 0)}${cores.reset}`)

  const respostaCreate = await fazerRequisicao('POST', '/api/tarefas', tarefa)
  if (respostaCreate.status === 201) {
    console.log(
      `  ${cores.verde}✅ Status ${respostaCreate.status} — ID criado: ${respostaCreate.body.id}${cores.reset}`
    )
    passaram++
    var tarefaId = respostaCreate.body.id

    // Testar atualização
    console.log(`\n${cores.amarelo}→ Atualizar tarefa${cores.reset}`)
    console.log(`  ${cores.cinza}PUT /api/tarefas/${tarefaId}${cores.reset}`)
    const atualizacao = {
      prioridade: 'normal',
      descricao: 'Estudar para prova de Filosofia (capítulos 1-3)'
    }
    const respostaUpdate = await fazerRequisicao('PUT', `/api/tarefas/${tarefaId}`, atualizacao)
    if (respostaUpdate.status === 200) {
      console.log(`  ${cores.verde}✅ Status ${respostaUpdate.status}${cores.reset}`)
      passaram++
    } else {
      console.log(`  ${cores.vermelho}❌ Status ${respostaUpdate.status}${cores.reset}`)
      falharam++
    }

    // Marcar como concluída
    console.log(`\n${cores.amarelo}→ Marcar tarefa como concluída${cores.reset}`)
    console.log(`  ${cores.cinza}POST /api/tarefas/${tarefaId}/concluir${cores.reset}`)
    const respostaConcluir = await fazerRequisicao('POST', `/api/tarefas/${tarefaId}/concluir`)
    if (respostaConcluir.status === 200) {
      console.log(`  ${cores.verde}✅ Status ${respostaConcluir.status}${cores.reset}`)
      passaram++
    } else {
      console.log(`  ${cores.vermelho}❌ Status ${respostaConcluir.status}${cores.reset}`)
      falharam++
    }
  } else {
    console.log(`  ${cores.vermelho}❌ Status ${respostaCreate.status}${cores.reset}`)
    falharam++
  }

  // ─────────────────────────────────────
  // 3. LEMBRETES
  // ─────────────────────────────────────
  console.log(`\n${cores.azul}━━━ 3. LEMBRETES ━━━${cores.reset}`)
  await executarTeste('Listar lembretes', 'GET', '/api/lembretes')

  const lembrete = {
    mensagem: 'Não esquecer de estudar Matemática',
    criado_por: 'teste-pratico.js'
  }

  console.log(`\n${cores.amarelo}→ Criar lembrete${cores.reset}`)
  console.log(`  ${cores.cinza}POST /api/lembretes${cores.reset}`)
  const respostaLembrete = await fazerRequisicao('POST', '/api/lembretes', lembrete)
  if (respostaLembrete.status === 201) {
    console.log(`  ${cores.verde}✅ Status ${respostaLembrete.status}${cores.reset}`)
    passaram++
  } else {
    console.log(`  ${cores.vermelho}❌ Status ${respostaLembrete.status}${cores.reset}`)
    falharam++
  }

  // ─────────────────────────────────────
  // 4. INTEGRAÇÃO COM IA
  // ─────────────────────────────────────
  console.log(`\n${cores.azul}━━━ 4. INTEGRAÇÃO COM IA/LLM ━━━${cores.reset}`)

  // 4.1 Analisar Progresso
  console.log(`\n${cores.amarelo}→ Analisar progresso${cores.reset}`)
  console.log(`  ${cores.cinza}GET /api/gemini/progresso${cores.reset}`)
  const respostaProgresso = await fazerRequisicao('GET', '/api/gemini/progresso')
  if (respostaProgresso.status === 200) {
    console.log(`  ${cores.verde}✅ Status ${respostaProgresso.status}${cores.reset}`)
    if (respostaProgresso.body.dados) {
      console.log(
        `  ${cores.cinza}Total: ${respostaProgresso.body.dados.total} | Concluídas: ${respostaProgresso.body.dados.concluidas} | Progresso: ${respostaProgresso.body.dados.percentual}%${cores.reset}`
      )
    }
    passaram++
  } else {
    console.log(`  ${cores.vermelho}❌ Status ${respostaProgresso.status}${cores.reset}`)
    falharam++
  }

  // 4.2 Gerar Resumo
  console.log(`\n${cores.amarelo}→ Gerar resumo para IA processar${cores.reset}`)
  console.log(`  ${cores.cinza}POST /api/gemini/webhook${cores.reset}`)
  const respostaResumo = await fazerRequisicao('POST', '/api/gemini/webhook', { acao: 'analisar-progresso' })
  if (respostaResumo.status === 200 || respostaResumo.status === 201) {
    console.log(`  ${cores.verde}✅ Status ${respostaResumo.status}${cores.reset}`)
    if (respostaResumo.body.prompt) {
      const snippet = respostaResumo.body.prompt.slice(0, 80)
      console.log(`  ${cores.cinza}Prompt gerado (snippet): ${snippet}...${cores.reset}`)
    }
    passaram++
  } else {
    console.log(`  ${cores.vermelho}❌ Status ${respostaResumo.status}${cores.reset}`)
    falharam++
  }

  // 4.3 Gerar Tarefas (Principal!)
  console.log(`\n${cores.amarelo}→ Simular IA gerando tarefas${cores.reset}`)
  console.log(`  ${cores.cinza}POST /api/gemini/gerar-tarefas${cores.reset}`)

  const tarefasIA = {
    token_verificacao: 'sac1c_bot_2025',
    tarefas: [
      {
        descricao: 'Fazer exercícios de Geometria pág 45-50',
        materia: 'Matemática',
        tipo: 'tarefa',
        prioridade: 'alta',
        data_vencimento: dataFormatada
      },
      {
        descricao: 'Ler capítulo 4 sobre Renascimento',
        materia: 'História',
        tipo: 'estudo',
        prioridade: 'normal',
        data_vencimento: dataFormatada
      }
    ]
  }

  const respostaIA = await fazerRequisicao('POST', '/api/gemini/gerar-tarefas', tarefasIA)
  if (respostaIA.status === 201) {
    console.log(`  ${cores.verde}✅ Status ${respostaIA.status}${cores.reset}`)
    console.log(
      `  ${cores.verde}${respostaIA.body.criadas} tarefas criadas com sucesso!${cores.reset}`
    )
    if (respostaIA.body.erros > 0) {
      console.log(`  ${cores.amarelo}⚠️ ${respostaIA.body.erros} erro(s) durante criação${cores.reset}`)
    }
    passaram++
  } else {
    console.log(`  ${cores.vermelho}❌ Status ${respostaIA.status}${cores.reset}`)
    falharam++
  }

  // ─────────────────────────────────────
  // 5. RESUMO FINAL
  // ─────────────────────────────────────
  console.log(`\n${cores.azul}━━━ RESUMO DOS TESTES ━━━${cores.reset}`)
  console.log(`
${cores.verde}✅ Passaram:  ${passaram}${cores.reset}
${cores.vermelho}❌ Falharam: ${falharam}${cores.reset}
${cores.azul}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${cores.reset}
`)

  if (falharam === 0) {
    console.log(
      `${cores.verde}🎉 TODOS OS TESTES PASSARAM! Sua API está funcionando perfeitamente!${cores.reset}\n`
    )
  } else {
    console.log(
      `${cores.vermelho}⚠️ Alguns testes falharam. Verifique os erros acima.${cores.reset}\n`
    )
  }

  console.log(`${cores.cinza}Próximos passos:
1. Leia: API-IA-EXEMPLO.md (exemplos práticos)
2. Leia: README-COMPLETO.md (documentação completa)
3. Teste com um bot real (Discord, Telegram, etc)
4. Integre com Claude, ChatGPT ou outro LLM${cores.reset}
`)
}

// Executar testes
teste().catch((erro) => {
  console.error(`\n${cores.vermelho}❌ Erro fatal: ${erro.message}${cores.reset}`)
  console.error(`\n${cores.amarelo}💡 Dica: Certifique-se que a API está rodando!${cores.reset}`)
  console.error(`   Execute em outro terminal: node src/api/index.js\n`)
  process.exit(1)
})
