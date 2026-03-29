# SAC-1C: Sistema de Gerenciamento de Tarefas

**WhatsApp Bot + API REST + Integração com IA**

Sistema completo para gerenciamento de tarefas escolares da turma "1c", com suporte a:
- ✅ Comandos WhatsApp (!add, !hoje, !semana, !provas, etc)
- 📡 REST API para integração externa
- 🤖 Endpoints para IA/LLM alimentar tarefas automaticamente
- 💾 Banco de dados SQLite profissional com migrações
- 📊 Lembretes automáticos
- 🔐 Validação e auditoria completa

---

## 🚀 Quick Start

### 1. Instalação

```bash
# Instale as dependências
npm install

# Configure variáveis de ambiente
# (copie .env.example → .env, se existir)
```

### 2. Iniciar Sistema Completo (Bot + API)

```bash
# Opção A: Iniciar tudo junto
node start.js

# Opção B: Apenas a API
node src/api/index.js

# Opção C: Apenas WhatsApp Bot
node src/index.js
```

### 3. Testar a API

```bash
# Quick health check
curl http://localhost:3000/health

# Ver exemplos
cat API-IA-EXEMPLO.md
cat TESTAR-API.md
```

---

## 📁 Estrutura do Projeto

```
sac-1c/
├── src/
│   ├── index.js                   # Bot WhatsApp (entrypoint)
│   ├── start.js                   # Sistema completo
│   ├── scheduler.js               # Tarefas automáticas (lembretes, limpeza)
│   │
│   ├── database/                  # 💾 Camada de Dados
│   │   ├── index.js               # Conexão SQLite + inicialização
│   │   ├── migrations.js          # Versionamento de schema
│   │   └── schema.js              # Referência de tabelas
│   │
│   ├── api/                       # 📡 Servidor Express
│   │   ├── index.js               # App REST, middleware, rotas
│   │   ├── middleware/
│   │   │   └── errorHandler.js    # Tratamento de erros
│   │   └── routes/
│   │       ├── tarefas.js         # GET/POST/PUT/DELETE tarefas
│   │       ├── lembretes.js       # CRUD lembretes
│   │       └── ia.js              # 🤖 Endpoints IA/LM
│   │
│   ├── handlers/                  # 🎯 Comandos WhatsApp
│   │   ├── geral.js               # !bomdia, !ping, !ajuda
│   │   ├── tarefas.js             # !add, !hoje, !del, !concluir, etc
│   │   ├── lembretes.js           # !lembrete, !lembretes, !dellembrete
│   │   └── confirmacao.js         # !sim, !não
│   │
│   ├── tasks/                     # 📋 Negócio
│   │   ├── taskService.js         # Queries e lógica
│   │   └── db.js                  # Compatibilidade (deprecated)
│   │
│   └── utils/                     # 🔧 Utilitários
│       ├── validacao.js           # Validar datas, IDs, mensagens
│       ├── logger.js              # Auditoria (logs/acoes.log)
│       └── confirmacao.js         # Gerenciar confirmações (!sim/!não)
│
├── data/
│   └── database.sqlite            # 🗄️ Banco de dados
│
├── logs/
│   └── acoes.log                  # 📝 Auditoria
│
├── help/                          # 📚 Documentação
├── knowledge/                     # 🧠 Dados
│
├── package.json                   # Dependências
├── .env                           # 🔐 Variáveis de ambiente
│
├── start.js                       # 🎯 INICIAR AQUI
├── API-IA-EXEMPLO.md              # Exemplos de uso da API
├── TESTAR-API.md                  # Como testar endpoints
└── README.md                      # Este arquivo

```

---

## 🎮 Comandos WhatsApp

### Tarefas
- `!add <descricao> | <materia> | <tipo> | <data> [prioridade]`
- `!hoje` — Tarefas de hoje
- `!semana` — Próximos 7 dias
- `!provas` — Todas as provas
- `!del <id>` — Apagar tarefa (pede confirmação)
- `!delantigos <dias>` — Apagar tarefas antigas
- `!delmateria <materia>` — Apagar por matéria
- `!concluir <id>` — Marcar como concluída
- `!stats` — Estatísticas

### Lembretes
- `!lembrete <mensagem>` — Criar lembrete
- `!lembretes` — Listar lembretes
- `!dellembrete <id>` — Deletar lembrete

### Geral
- `!bomdia` — Bom dia!
- `!ping` — Verifica se bot está online
- `!ajuda` — Lista de comandos
- `!sim` / `!não` — Confirmar/cancelar ações

---

## 📡 Endpoints da API

### Base URL
```
http://localhost:3000/api/
```

### Tarefas

```
GET    /tarefas              — Lista todas
GET    /tarefas/hoje         — Tarefas de hoje
GET    /tarefas/semana       — Próximos 7 dias
GET    /tarefas/provas       — Todas as provas
GET    /tarefas/stats        — Estatísticas
GET    /tarefas/:id          — Tarefa específica
POST   /tarefas              — Criar tarefa
PUT    /tarefas/:id          — Atualizar
DELETE /tarefas/:id          — Deletar
POST   /tarefas/:id/concluir — Marcar concluída
```

### Lembretes

```
GET    /lembretes            — Listar
GET    /lembretes/:id        — Um lembrete
POST   /lembretes            — Criar
DELETE /lembretes/:id        — Deletar
```

### IA/LLM

```
POST   /ia/gerar-tarefas        — Receber tarefas de IA
POST   /ia/analisar-progresso   — Consultar métricas
POST   /ia/gerar-resumo         — Formatar para IA processar
```

---

## 🤖 Integração com IA (Como Usar)

### Cenário 1: Discord com Claude

```python
# seu-bot.py (Discord)
import requests

async def gerar_tarefas_com_ia(contexto):
    # 1. Faz requisição para sua API local
    response = requests.get('http://seu-servidor:3000/api/tarefas/semana')
    tarefas = response.json()['dados']
    
    # 2. Passa para Claude
    prompt = f"Baseado nessas tarefas:\n{tarefas}\n\nGere 3 novas tarefas"
    resposta_claude = await chamar_claude(prompt)
    
    # 3. Envia tarefas geradas para sua API
    requests.post('http://seu-servidor:3000/api/ia/gerar-tarefas', 
        json={
            "modelo": "claude-3",
            "origem": "discord_bot",
            "tarefas": resposta_claude['tarefas']
        }
    )
```

### Cenário 2: Cron Job (Diário)

```bash
# crontab -e
# Todos os dias às 7:00, gerar tarefas
0 7 * * * curl -X POST http://localhost:3000/api/ia/analisar-progresso | \
  python3 enviar-para-claude.py | \
  curl -X POST http://localhost:3000/api/ia/gerar-tarefas
```

### Cenário 3: Telegram Bot

```python
@bot.message_handler(commands=['ia'])
def ia_sugestoes(message):
    # Faz requisição para sua API
    resumo = requests.post(
        'http://localhost:3000/api/ia/gerar-resumo',
        json={'tipo': 'semana'}
    ).json()
    
    # Envia para o usuário processar com IA
    bot.send_message(
        message.chat.id, 
        f"Cole isso no Claude:\n\n{resumo['prompt']}"
    )
```

---

## 🔧 Configuração (.env)

```env
# WhatsApp
WHATSAPP_GROUP_ID=123456789-1234567890@g.us

# API
API_PORT=3000
NODE_ENV=development

# Banco de dados
DATABASE_PATH=./data/database.sqlite
DATABASE_LOG=true
```

---

## 📊 Banco de Dados

### Tabelas

**tarefas**
- `id` (inteiro, PK)
- `descricao` (texto)
- `materia` (texto)
- `tipo` (tarefa/prova/estudo)
- `data_vencimento` (data)
- `prioridade` (alta/normal/baixa)
- `concluida` (boolean)
- `criado_por` (texto - usuário ou IA)
- `criado_em` (timestamp)
- `concluida_em` (timestamp)
- `ativo` (soft delete)

**lembretes**
- `id` (inteiro, PK)
- `mensagem` (texto)
- `criado_por` (texto)
- `criado_em` (timestamp)
- `ativo` (boolean)

**schema_version** (controle de migrações)
- `versao` (inteiro)
- `aplicada_em` (timestamp)

### Migrações

As migrações são aplicadas automaticamente ao iniciar:

```
database/migrations.js → define M001, M002, M003...
database/index.js     → executa o que falta on startup
```

Para adicionar uma tabela nova:

```javascript
// database/migrations.js
MIGRATIONS = {
  // ...
  M002: {
    id: 'M002',
    descricao: 'Adicionar tabela notificacoes',
    up: (db) => {
      db.exec(`
        CREATE TABLE notificacoes (
          id INTEGER PRIMARY KEY,
          ...
        )
      `)
    }
  }
}
```

Pronto! Na próxima inicialização, a migração rode automaticamente.

---

## 🔐 Segurança

- ✅ Todos os queries usam params (`?`) — SQL injection seguro
- ✅ Validação de entrada em todos os handlers
- ✅ Confirmação obrigatória para operações destrutivas
- ✅ Auditoria completa (logs/acoes.log)
- ✅ Soft deletes (nunca deleta, apenas marca inativo)
- ✅ Isolamento de código (handlers < services < database)

---

## 📝 Logs

Todas as ações são registradas em `logs/acoes.log`:

```
✅ [2025-03-29T15:30:45.123Z] +55-123456789@c.us - add - Tarefa #1 adicionada
❌ [2025-03-29T15:32:10.456Z] +55-999999999@c.us - del - Erro: ID inválido
🤖 [2025-03-29T15:35:22.789Z] IA - gerar_tarefas - 5 tarefas criadas
```

---

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| "Cannot find module 'whatsapp-web.js'" | `npm install whatsapp-web.js` |
| "Cannot find module 'express'" | `npm install express` |
| "EADDRINUSE: Port 3000 in use" | Mudar porta: `API_PORT=3001 node start.js` |
| "QR code não aparece" | Verificar terminal, pode estar acima da tela |
| "Tarefas não aparecem em !hoje" | Verificar formato: `YYYY-MM-DD` |
| "API retorna 404" | Verificar URL: `/api/tarefas` não `/tarefas` |

---

## 📚 Documentação Adicional

- **[API-IA-EXEMPLO.md](API-IA-EXEMPLO.md)** — Exemplos de integração com IA
- **[TESTAR-API.md](TESTAR-API.md)** — Como testar todos os endpoints
- **[SQLite-SETUP.md](SQLite-SETUP.md)** — Database profissional
- **[help/](help/)** — Documentação interna

---

## 🚀 Deploy

### Heroku/Railway

```bash
# package.json
{
  "scripts": {
    "start": "node start.js"
  }
}

# .env variables
WHATSAPP_GROUP_ID=...
API_PORT=3000
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "start.js"]
```

```bash
docker build -t sac-1c .
docker run -p 3000:3000 sac-1c
```

---

## 📞 Suporte

Problemas? Verifique:
1. ✅ Node.js v14+? (`node --version`)
2. ✅ Dependências instaladas? (`npm list`)
3. ✅ .env configurado? (cópia de .env.example)
4. ✅ Logs? (`cat logs/acoes.log`)
5. ✅ Database? (`ls data/database.sqlite`)

---

## 📄 Licença

MIT — Use livremente para fins educacionais

---

**Desenvolvido para a turma 1c — 2025** 🎓

