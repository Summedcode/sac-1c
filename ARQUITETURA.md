# Arquitetura do Sistema SAC-1C

## 🏗️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                      SISTEMA SAC-1C                             │
│              (WhatsApp Bot + API REST + IA Integration)         │
└─────────────────────────────────────────────────────────────────┘

                            ┌──────────────┐
                            │  Usuários    │
                            └────────┬─────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                    │
        ┌───────▼────────┐  ┌────────▼──────┐  ┌────────▼──────┐
        │  WhatsApp Bot  │  │  LLM (Claude, │  │ Cron Job /    │
        │  (Node.js)     │  │  ChatGPT)     │  │ Webhook       │
        └────────┬────────┘  └────────┬──────┘  └────────┬──────┘
                 │                    │                 │
                 │    ┌───────────────┴─────────────────┘
                 │    │
        ┌────────▼────▼──────────────────────────┐
        │       Express API (Port 3000)          │
        ├──────────────────────────────────────┤
        │ ✅ /api/tarefas       - CRUD tasks    │
        │ ✅ /api/lembretes     - CRUD reminders│
        │ ✅ /api/ia/*          - IA endpoints  │
        │ ✅ /health            - Health check  │
        └────────┬───────────────────────────────┘
                 │
         ┌───────▼──────────────────┐
         │  Handlers & Services     │
         ├────────────────────────┤
         │ • handlers/geral       │
         │ • handlers/tarefas     │
         │ • handlers/lembretes   │
         │ • tasks/taskService    │
         │ • utils/*              │
         └────────┬────────────────┘
                  │
         ┌────────▼──────────────────┐
         │  Database Layer          │
         ├────────────────────────┤
         │ • database/index.js    │
         │ • database/migrations  │
         │ • SQLite Connection    │
         └────────┬────────────────┘
                  │
         ┌────────▼──────────────────┐
         │  SQLite Database         │
         ├────────────────────────┤
         │ • tarefas table        │
         │ • lembretes table      │
         │ • schema_version       │
         └────────────────────────┘
```

---

## 🎯 Fluxo de Dados - Tarefas

### 1. Criar Tarefa via WhatsApp

```
Usuário               Handler              Service              Database
  │                     │                    │                    │
  │──!add Física→────────│                    │                    │
  │  "Estudar luz       │                    │                    │
  │   Física 2025-04-10 │                    │                    │
  │   alta"             │                    │                    │
  │                     │──validarData()──→  │                    │
  │                     │ (valida formato)   │                    │
  │                     │                    │                    │
  │                     │──adicionarTarefa()→│                    │
  │                     │ (desc, materia)    │──INSERT INTO───────→│
  │                     │                    │  tarefas VALUES()   │
  │                     │                    │◄────id = 42────────│
  │                     │                    │                    │
  │◄────Tarefa #42──────│◄──mensagem OK──────│                    │
  │  adicionada!        │                    │                    │

Logs: ✅ [timestamp] +55-123456789@c.us - add - Tarefa #42 adicionada
```

### 2. Consultar Tarefas via API

```
Cliente (curl/Postman)    API Endpoint         Service            Database
       │                      │                  │                  │
       │──GET /api/tarefas/hoje──────→          │                  │
       │                      │                  │                  │
       │                      │──getTarefasHoje()→                  │
       │                      │   (hoje em ISO)  │──SELECT WHERE────→│
       │                      │                  │  today()         │
       │                      │                  │◄──[rows]─────────│
       │                      │                  │                  │
       │◄──JSON [tasks]───────│◄──{dados: []}────│                  │
       │  {                   │                  │                  │
       │   "total": 3,        │                  │                  │
       │   "dados": [{...}]   │                  │                  │
       │  }                   │                  │                  │
```

### 3. Deletar com Confirmação

```
Usuário             Handler         Confirmacao         Database
  │                   │                  │                 │
  │──!del 42────→     │                  │                 │
  │                   │                  │                 │
  │                   │──solicitarConfirmação()            │
  │                   │ (armazena em memória + timeout)    │
  │                   │◄──timeout: 5 min◄──────────────────│
  │◄────Confirmar?────│                  │                 │
  │  !sim ou !não     │                  │                 │
  │                   │                  │                 │
  │──!sim ────────→   │                  │                 │
  │                   │──confirmarAcao()→ ✅ deletarTarefa()│
  │                   │ (verifica timeout │──UPDATE ativo──→│
  │                   │  e autenticação)  │   = 0          │
  │                   │                   │◄──sucesso───────│
  │◄─Deletada!────────│                   │                 │

Logs: ✅ [timestamp] +55-123456789@c.us - del - Tarefa #42 deletada com confirmação
```

---

## 🤖 Fluxo de Integração com IA

### Cenário: Claude gerando tarefas

```
┌───────────────────────────────────────────────────────────────┐
│ SEU SERVIDOR (Node.js)        │  SERVIÇO IA (Claude)          │
└───────────────────────────────────────────────────────────────┘

1️⃣ ANÁLISE
   POST /api/ia/analisar-progresso
                          │
                          ├──SELECT * FROM tarefas
                          ├──SELECT COUNT(*) by materia
                          └─→ JSON com {total, concluidas, por_materia}

2️⃣ ENVIO PARA IA
   Seu código chama Claude API:
   
   client.messages.create({
     messages: [{
       role: "user",
       content: `
       Baseado nesse progresso:
       ${JSON.stringify(metricas)}
       
       Gere 3 tarefas prioritárias em JSON
       `
     }]
   })

3️⃣ PROCESSAMENTO NO CLAUDE
   Claude recebe os dados de progresso
   Claude analisa matérias com baixo progresso
   Claude gera tarefas estruturadas

4️⃣ RESPOSTA DO CLAUDE
   Claude retorna:
   [
     {
       "descricao": "Fazer exercícios de derivadas",
       "materia": "Matemática",
       "tipo": "tarefa",
       "prioridade": "alta",
       "data_vencimento": "2025-04-15"
     }
   ]

5️⃣ PERSISTÊNCIA
   POST /api/ia/gerar-tarefas
   {
     "modelo": "claude-3-opus",
     "origem": "seu_script",
     "tarefas": [...]
   }
                          │
                          ├──Validação de cada tarefa
                          ├──INSERT INTO tarefas VALUES()
                          └─→ OK - 3 tarefas criadas

6️⃣ VISIBILIDADE
   Usuário vê em:
   !hoje       ← mostra novas tarefas
   !semana     ← agrupa com as antigas
   /api/tarefas/stats ← atualiza estatísticas
```

---

## 📊 Camadas de Abstração

### Camada 1: Apresentação (Handlers)

```javascript
// handlers/tarefas.js — Apenas manipula mensagens
handleAdd(msg) {
  // Valida entrada
  // Chama taskService
  // Formata resposta para WhatsApp
}
```

**Responsabilidade:** Parser → Validação → Chamada Service → Formato

---

### Camada 2: Negócios (Service)

```javascript
// tasks/taskService.js — Lógica de aplicação
adicionarTarefa(descricao, materia, tipo, data, criador) {
  // Lógica de prioridade
  // Cálculo de prazos
  // Log de auditoria
  // Chamada ao DB
}
```

**Responsabilidade:** Regras de negócio → Transformação → Persistência

---

### Camada 3: Dados (Database)

```javascript
// database/index.js — Interface com BD
getDb().prepare(
  'INSERT INTO tarefas (descricao, materia, ...) VALUES (?, ?, ...)'
).run(dados)
```

**Responsabilidade:** SQL crudo → Migrações → Backups

---

## 🔄 Fluxo de Migrações

```
┌──────────────────────────────────────┐
│ Startup: node start.js               │
└───────────┬──────────────────────────┘
            │
            ├─ require('./src/database')
            │
            ├─ inicializarBanco()
            │  ├─ obterBanco()
            │  │  └─ sqlite open data/database.sqlite
            │  │
            │  ├─ executarMigrations()
            │  │  ├─ SELECT versao FROM schema_version
            │  │  │  └─ Última: 1
            │  │  │
            │  │  ├─ MIGRATIONS = { M001, M002, M003... }
            │  │  │
            │  │  ├─ Para M002 até MXXX:
            │  │  │  ├─ console.log('Aplicando M002...')
            │  │  │  ├─ MIGRATIONS.M002.up(db) 
            │  │  │  │  └─ CREATE TABLE notificacoes...
            │  │  │  └─ INSERT INTO schema_version...
            │  │  │
            │  │  └─ ✅ Banco atualizado
            │  │
            │  ├─ statusBanco()
            │  │  └─ { conectado: true, versao: 2 }
            │  │
            │  └─ console.log('DB pronto')
            │
            └─ Continuar inicialização

Resultado: Banco sempre em versão correta sem data loss
```

---

## 🛡️ Fluxo de Validação

```
Entrada do Usuário
        │
        ├─ validarData(input)
        │  ├─ Formato: YYYY-MM-DD? ✅
        │  ├─ Data no passado? ❌
        │  ├─ Data próxima 2 anos? ✅
        │  └─ return true/false
        │
        ├─ validarId(input)
        │  ├─ Number? ✅
        │  ├─ ID > 0? ✅
        │  └─ return true/false
        │
        ├─ validarMensagem(input)
        │  ├─ Not empty? ✅
        │  ├─ Length 1-500? ✅
        │  ├─ No SQL chars? ✅
        │  └─ return true/false
        │
        └─ Se algum falha → Rejeitar com mensagem clara
           Se todos passam → Proceder
```

---

## 🔐 Fluxo de Segurança

### SQL Injection Prevention

```javascript
// ❌ INSEGURO
const query = `INSERT INTO tarefas VALUES ('${descricao}')`

// ✅ SEGURO (parameterized)
const query = db.prepare(
  'INSERT INTO tarefas (descricao) VALUES (?)'
).run(descricao)
```

### Soft Deletes (GDPR Compliant)

```javascript
// ❌ HARD DELETE (perda de dados)
DELETE FROM tarefas WHERE id = 42

// ✅ SOFT DELETE (auditável, reversível)
UPDATE tarefas SET ativo = 0 WHERE id = 42

// Recuperar: UPDATE tarefas SET ativo = 1 WHERE id = 42
```

### Confirmação para Operações Riscosas

```
Operação Destrutiva
        │
        ├─ solicitarConfirmacao(usuario, acao)
        │  ├─ Armazena em memory (timeout 5 min)
        │  └─ Envia mensagem: "Confirmar? !sim ou !não"
        │
        ├─ Usuário responde !sim
        │  ├─ confirmarAcao(usuario)
        │  ├─ Valida timeout
        │  ├─ Valida autenticação
        │  └─ Executa operação
        │
        └─ Tudo auditado em logs/acoes.log
```

---

## 📈 Escalabilidade (Roadmap)

```
ATUAL (v1 - Monolítico)
│
├─ DB: SQLite local
├─ Bot: Único grupo WhatsApp
└─ API: Express simples

v2 (Multi-grupo)
│
├─ DB: PostgreSQL remoto
├─ Bot: Múltiplos grupos WhatsApp
├─ API: Com autenticação JWT
└─ Cache: Redis para performance

v3 (Microserviços)
│
├─ Service Bot: Docker container
├─ Service API: Docker container  
├─ Service DB: Managed PostgreSQL
├─ Message Queue: RabbitMQ
└─ Monitoring: Prometheus + Grafana

v4 (IA Nativa)
│
├─ Embeddings: Vector DB
├─ LLM Local: Ollama/LLaMA
├─ Multi-lingua
└─ Mobile App
```

---

## 📝 Diagrama de Classes (Conceitual)

```
┌─────────────────────────┐
│    DatabaseManager      │
├─────────────────────────┤
│ - db: Connection        │
│ - WAL: boolean          │
├─────────────────────────┤
│ + inicializarBanco()    │
│ + getDb()               │
│ + statusBanco()         │
│ + executarMigrations()  │
└────────────┬────────────┘
             │ uses
             ▼
┌─────────────────────────┐
│   TaskService           │
├─────────────────────────┤
│ -db: Connection         │
├─────────────────────────┤
│ + adicionarTarefa()     │
│ + getTarefasHoje()      │
│ + deletarTarefaPorId()  │
│ + marcarConcluida()     │
└────────┬────────────────┘
         │ uses
         ▼
┌─────────────────────────┐
│   APIEndpoint           │
├─────────────────────────┤
│ + GET /api/tarefas      │
│ + POST /api/tarefas     │
│ + PUT /api/tarefas/:id  │
│ + POST /api/ia/*        │
└─────────────────────────┘
```

---

Em resumo, a arquitetura é **modular, segura e escalável** com separação clara de responsabilidades! 🚀

