# Como Iniciar e Testar a API

## 1️⃣ Instalação de Dependências

Certifique-se de ter Express instalado:

```bash
npm install express
```

Se não tiver, verifique seu `package.json`:

```bash
npm install
```

---

## 2️⃣ Iniciar a API

### Opção A: API SOZINHA
```bash
node src/api/index.js
```

Deve aparecer:
```
📡 Servidor rodando na porta 3000
✅ Banco de dados conectado
```

### Opção B: WhatsApp Bot + API (simultâneos)

Crie ou atualize `src/main.js`:

```javascript
// Inicia WhatsApp Bot
require('./index')

// Inicia API em thread separada
setTimeout(() => {
  console.log('\n⏱️ Iniciando API em 2 segundos...\n')
  const { iniciarAPI } = require('./api/index')
  iniciarAPI()
}, 2000)
```

Então execute:
```bash
node src/main.js
```

---

## 3️⃣ Testar Endpoints

### Opção 1: cURL (Terminal/PowerShell)

#### A. Health Check (verifica se API está rodando)
```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "status": "online",
  "timestamp": "2025-03-29T15:30:45.123Z",
  "banco": "conectado",
  "versao_banco": 1
}
```

#### B. Listar Tarefas de Hoje
```bash
curl http://localhost:3000/api/tarefas/hoje
```

#### C. Enviar Tarefas de IA (IMPORTANTE!)
```bash
curl -X POST http://localhost:3000/api/ia/gerar-tarefas ^
  -H "Content-Type: application/json" ^
  -d "{\"modelo\":\"teste\",\"origem\":\"manual\",\"tarefas\":[{\"descricao\":\"Estudar Física\",\"materia\":\"Física\",\"tipo\":\"estudo\",\"prioridade\":\"alta\",\"data_vencimento\":\"2025-04-10\"}]}"
```

#### D. Analisar Progresso
```bash
curl -X POST http://localhost:3000/api/ia/analisar-progresso
```

#### E. Gerar Resumo da Semana
```bash
curl -X POST http://localhost:3000/api/ia/gerar-resumo ^
  -H "Content-Type: application/json" ^
  -d "{\"tipo\":\"semana\"}"
```

---

### Opção 2: Insomnia / Postman (Visual)

**Postman é melhor para testes! Baixe em: https://www.postman.com/downloads/**

#### Depois de instalar:

1. **Novo Request**
   - Method: `POST`
   - URL: `http://localhost:3000/api/ia/gerar-tarefas`

2. **Tab "Headers"**
   - Key: `Content-Type`
   - Value: `application/json`

3. **Tab "Body"** (selecionar "raw" + "JSON")
   ```json
   {
     "modelo": "claude-3-opus",
     "origem": "teste_postman",
     "tarefas": [
       {
         "descricao": "Fazer exercícios de Cálculo",
         "materia": "Matemática",
         "tipo": "tarefa",
         "prioridade": "alta",
         "data_vencimento": "2025-04-15"
       },
       {
         "descricao": "Reler aula de Química",
         "materia": "Química",
         "tipo": "estudo",
         "prioridade": "normal",
         "data_vencimento": "2025-04-20"
       }
     ]
   }
   ```

4. **Clique "Send"** → Vê resposta JSON

---

### Opção 3: Script Node.js (Automático)

Crie `teste-api.js`:

```javascript
// teste-api.js
const http = require('http')

function fazerRequisicao(caminho, dados, metodo = 'GET') {
  return new Promise((resolve, reject) => {
    const opcoes = {
      hostname: 'localhost',
      port: 3000,
      path: caminho,
      method: metodo,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const req = http.request(opcoes, (res) => {
      let resposta = ''
      res.on('data', chunk => (resposta += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(resposta))
        } catch {
          resolve(resposta)
        }
      })
    })

    req.on('error', reject)
    if (dados) req.write(JSON.stringify(dados))
    req.end()
  })
}

async function testar() {
  console.log('🧪 Testando API...\n')

  try {
    // 1. Health check
    console.log('1️⃣ Health Check...')
    const health = await fazerRequisicao('/health')
    console.log('✅', health.status, '\n')

    // 2. Listar tarefas
    console.log('2️⃣ Buscando tarefas de hoje...')
    const hoje = await fazerRequisicao('/api/tarefas/hoje')
    console.log(`✅ ${hoje.total || 0} tarefas\n`)

    // 3. Enviar tarefas de IA
    console.log('3️⃣ Enviando tarefas geradas por IA...')
    const resposta = await fazerRequisicao('/api/ia/gerar-tarefas', {
      modelo: 'teste-automatico',
      origem: 'script_node',
      tarefas: [
        {
          descricao: 'Estudar para prova de Biologia',
          materia: 'Biologia',
          tipo: 'prova',
          prioridade: 'alta',
          data_vencimento: '2025-04-25'
        }
      ]
    }, 'POST')
    console.log(`✅ ${resposta.criadas} tarefas criadas!\n`)

    // 4. Analisar progresso
    console.log('4️⃣ Analisando progresso...')
    const progresso = await fazerRequisicao('/api/ia/analisar-progresso', {}, 'POST')
    console.log(`✅ ${progresso.dados.percentual}% concluído\n`)

    console.log('🎉 Todos os testes passaram!')
  } catch (erro) {
    console.error('❌ Erro:', erro.message)
  }
}

testar()
```

Executar:
```bash
node teste-api.js
```

---

## 4️⃣ Integração com Claude / ChatGPT

### Usando a API em um Agente IA

```javascript
// Exemplo: Claude lendo tarefas do seu banco

const Anthropic = require('@anthropic-ai/sdk')
const http = require('http')

async function obterTarefasDoServerNodeLocal() {
  // Faz requisição para sua API local
  const tarefas = await fetch('http://localhost:3000/api/tarefas/semana')
    .then(r => r.json())
  
  return tarefas.dados.map(t => `${t.descricao} (${t.materia}) - ${t.data_vencimento}`).join('\n')
}

async function pedirSugestoesAIA() {
  const client = new Anthropic()

  const tarefasTexto = await obterTarefasDoServerNodeLocal()

  const message = await client.messages.create({
    model: 'claude-3-opus-20250204',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Baseado nessas tarefas escolares:
        
${tarefasTexto}

Gere 3-5 sugestões de novas tarefas que faltam. Retorne em formato JSON com campos: descricao, materia, tipo, prioridade, data_vencimento`
      }
    ]
  })

  const resposta = message.content[0].text

  // Extrai JSON da resposta
  const jsonMatch = resposta.match(/\[[\s\S]*\]/)
  if (jsonMatch) {
    const tarefas = JSON.parse(jsonMatch[0])

    // Envia para sua API
    await fetch('http://localhost:3000/api/ia/gerar-tarefas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelo: 'claude-3-opus',
        origem: 'sugestoes_ia',
        tarefas
      })
    })

    console.log('✅', tarefas.length, 'tarefas sugeridas adicionadas!')
  }
}

pedirSugestoesAIA()
```

---

## ❓ Troubleshooting

| Problema | Solução |
|----------|---------|
| **`ECONNREFUSED`** | API não está rodando. Execute `node src/api/index.js` |
| **`Cannot find module 'express'`** | Instale: `npm install express` |
| **Resposta 404** | URL errada. Verifique: `/api/tarefas` não `/api/tarefa` |
| **Resposta 500** | Erro no servidor. Veja console (pode ser erro no banco) |
| **Nenhuma tarefa retornada** | Provavelmente nenhuma tarefa salva. Use POST para criar |
| **Tarefas criadas mas sumiram** | Verificar se estão marcadas com `ativo=0` |

---

## 📝 Checklist para Testar Tudo

- [ ] Iniciar API: `node src/api/index.js`
- [ ] Health check retorna status "online"
- [ ] POST /api/ia/gerar-tarefas com sucesso
- [ ] Tarefas aparecem em GET /api/tarefas
- [ ] !hoje no WhatsApp mostra novas tarefas
- [ ] Logs registram as ações (ver `logs/acoes.log`)

Pronto! Sua API está alimentando o banco com dados de IA! 🚀

