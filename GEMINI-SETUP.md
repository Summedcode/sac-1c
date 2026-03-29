# 🚀 INTEGRAÇÃO COM GOOGLE GEMINI

**Versão mais simples, rápida e GRATUITA** de integrar IA ao seu projeto.

---

## ⚡ Quick Start (5 minutos)

### 1️⃣ Pegar API Key (2 min - FREE)

```
1. Abra: https://makersuite.google.com/app/apikey
2. Login com sua conta Google (ou cria uma)
3. Clique em "Create API Key"
4. Copie a chave (algo como: AIzaSy...)
```

### 2️⃣ Configurar no seu projeto (2 min)

```bash
# Instalar SDK Gemini
npm install @google/generative-ai

# Adicionar ao .env
echo "GEMINI_API_KEY=AIzaSy..." >> .env

# Reinicia seu terminal
```

### 3️⃣ Rodar (1 min)

```bash
# Terminal 1: Rodar sua API
node start.js

# Terminal 2: Executar Gemini
node src/integracoes/gemini.js
```

**Resultado esperado:**
```
✅ Dados recebidos:
   Total: 47
   Concluídas: 12
   Pendentes: 35
   Progresso: 25.5%

✅ 5 tarefas parseadas:
   📋 Fazer exercícios de derivadas
      Matéria: Matemática | Tipo: tarefa | Prioridade: alta
      Vencimento: 2025-04-15

✅ 5/5 tarefas criadas com sucesso!
```

---

## 🤖 Como Funciona

### Fluxo Simples

```
┌─ SEU PROJETO ─────────┐
│                       │
│  1. seu-banco.sqlite  │
│     {50 tarefas}      │
│                       │
└──────────┬────────────┘
           │
    GET /api/gemini/progresso
           │
           ↓
┌─ GOOGLE GEMINI ───────────┐
│                            │
│  Analisa progresso         │
│  Identifica lacunas        │
│  Gera 5 tarefas novas      │
│                            │
└────────────┬───────────────┘
             │ Retorna JSON
             ↓
┌─ SEU PROJETO ─────────┐
│                       │
│  POST /api/gemini/    │
│       gerar-tarefas   │
│                       │
│  ✅ Salva no banco    │
│                       │
└───────────────────────┘
             │
             ↓
    !hoje / !semana
```

---

## 📡 3 Endpoints Disponíveis

### 1. Consultar Progresso

```http
GET /api/gemini/progresso
```

**Resposta:**
```json
{
  "sucesso": true,
  "dados": {
    "total": 47,
    "concluidas": 12,
    "pendentes": 35,
    "percentual": "25.5",
    "por_materia": [
      {"materia": "Matemática", "total": 20, "feitas": 8},
      {"materia": "Física", "total": 15, "feitas": 3}
    ]
  }
}
```

### 2. Enviar Tarefas Geradas

```http
POST /api/gemini/gerar-tarefas

{
  "tarefas": [
    {
      "descricao": "Fazer exercícios 1-50 de derivadas",
      "materia": "Matemática",
      "tipo": "tarefa",
      "prioridade": "alta",
      "data_vencimento": "2025-04-15"
    }
  ]
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "modelo": "gemini-1.5-pro",
  "origem": "gemini_api",
  "total_requisitado": 1,
  "criadas": 1,
  "erros": 0,
  "dados": {
    "criadas": [
      {"indice": 0, "id": 101, "descricao": "Fazer exercícios 1-50..."}
    ]
  }
}
```

### 3. Webhook (Automático)

```http
POST /api/gemini/webhook

{
  "tarefas": [...],
  "timestamp": "2025-03-29T15:30:00Z"
}
```

---

## 🔄 Usar em Loop Automático (24/7)

### Opção A: Cron Job Local (Seu PC)

```bash
# Executar a cada 1 hora
*/1 * * * * /usr/bin/node /caminho/para/src/integracoes/gemini.js >> /tmp/gemini.log
```

No arquivo `crontab -e`:
```
# A cada hora
0 * * * * cd /seu/projeto && GEMINI_API_KEY=sua_key node src/integracoes/gemini.js

# Ou todos os dias às 7am
0 7 * * * cd /seu/projeto && GEMINI_API_KEY=sua_key node src/integracoes/gemini.js
```

### Opção B: Script em Loop (Simples)

```bash
while true; do
  node src/integracoes/gemini.js
  sleep 3600  # Aguarda 1 hora
done
```

### Opção C: PM2 (Recomendado)

```bash
# Instalar PM2
npm install -g pm2

# Criar arquivo pm2.config.js
cat > pm2.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "sac-1c-api",
      script: "./start.js",
      env: {
        NODE_ENV: "production",
        GEMINI_API_KEY: "sua_key"
      }
    },
    {
      name: "gemini-scheduler",
      script: "./src/integracoes/gemini.js",
      instances: 1,
      cron: "0 */1 * * *",  // A cada hora
      env: {
        GEMINI_API_KEY: "sua_key"
      }
    }
  ]
}
EOF

# Rodar
pm2 start pm2.config.js
pm2 save
pm2 startup  # Para rodar no boot
```

---

## 💰 Preço

```
❌ Nada de pagar
✅ Google Gemini API: GRATUITA (até 15 requisições/minuto)
✅ Seu servidor: Railway (5 USD/mês) ou Heroku (free)

Total: R$0 a R$25/mês
```

---

## 🛠️ Código Completo (Se quiser customizar)

### Node.js + Gemini Manual

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai')
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function gerar() {
  // 1. Pegar dados do seu banco
  const progresso = await fetch('http://localhost:3000/api/gemini/progresso')
  const dados = await progresso.json()
  
  // 2. Criar prompt
  const prompt = `
    Baseado nesse progresso: ${JSON.stringify(dados.dados)}
    Gere 3 tarefas prioritárias em JSON
  `
  
  // 3. Chamar Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
  const result = await model.generateContent(prompt)
  const texto = result.response.text()
  
  // 4. Extrair JSON
  const tarefas = JSON.parse(texto.match(/\{[\s\S]*\}/)[0])
  
  // 5. Salvar
  await fetch('http://localhost:3000/api/gemini/gerar-tarefas', {
    method: 'POST',
    body: JSON.stringify({ tarefas: tarefas.tarefas })
  })
  
  console.log('✅ Pronto!')
}

gerar()
```

---

## 🔒 Segurança

### Proteger sua API Key

```bash
# ✅ CORRETO - no .env
GEMINI_API_KEY=AIzaSy...

# ❌ NUNCA - no código
const apiKey = "AIzaSy..."  // NÃO FAÇA ISSO
```

### No Cloudflare Workers (se usar)

```javascript
// Variável de ambiente no Cloudflare
const GEMINI_API_KEY = env.GEMINI_API_KEY
```

---

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| `Cannot find module` | `npm install @google/generative-ai` |
| `API key not found` | Verificar `.env` contém `GEMINI_API_KEY=...` |
| `Failed to connect to localhost:3000` | API não está rodando: `node start.js` |
| `Invalid JSON from Gemini` | Gemini às vezes retorna markdown, trata com regex |
| `Rate limit exceeded` | Ficar dentro de 15 req/min (script respeita) |

---

## 🚀 Deploy 24/7

### Opção A: Railway (Recomendado)

1. Código pronto em `src/integracoes/gemini.js`
2. Deploy em Railway (copy-paste do git)
3. Configurar variável: `GEMINI_API_KEY=sua_key`
4. Adicionar job schedule: `node src/integracoes/gemini.js` (a cada hora)
5. Pronto! Rodando 24/7

### Opção B: Seu VPS ($5/mês)

```bash
ssh seu-vps
cd seu-projeto
npm install
node start.js &  # Background

# Setup cron
crontab -e
0 * * * * /usr/bin/node /seu-projeto/src/integracoes/gemini.js
```

---

## 🎯 Próximos Passos

- [x] Instalar SDK (`npm install @google/generative-ai`)
- [x] Pegar API key (https://makersuite.google.com/app/apikey)
- [x] Configurar .env
- [x] Rodar `node src/integracoes/gemini.js`
- [ ] Testar com seus dados
- [ ] Setup scheduler (cron, PM2, ou plataforma)
- [ ] Deploy em Railway/VPS

---

## 📝 Exemplo Resultado

```
🤖 Iniciando Gemini...

📊 1️⃣ Buscando progresso do seu banco...
✅ Dados recebidos:
   Total: 47
   Concluídas: 12
   Pendentes: 35
   Progresso: 25.5%

🧠 2️⃣ Enviando para Gemini...
✅ Gemini respondeu

📝 3️⃣ Parseando resposta...
✅ 5 tarefas parseadas:

   📋 Fazer exercícios 1-50 de derivadas
      Matéria: Matemática | Tipo: tarefa | Prioridade: alta
      Vencimento: 2025-04-15

   📋 Rever conceitos de limites
      Matéria: Cálculo | Tipo: estudo | Prioridade: normal
      Vencimento: 2025-04-18

🚀 4️⃣ Salvando no banco...

✅ 5/5 tarefas criadas com sucesso!

📱 Verifique no WhatsApp:
   !hoje     — Tarefas de hoje
   !semana   — Próximos 7 dias
   !stats    — Ver estatísticas

✨ Gemini integrado com sucesso!
```

---

**Pronto para usar!** 🎉

```bash
npm install @google/generative-ai
echo "GEMINI_API_KEY=sua_key" >> .env
node start.js  # Terminal 1
node src/integracoes/gemini.js  # Terminal 2
```

