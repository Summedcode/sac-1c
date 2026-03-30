# 🚀 SAC-1C — Bot de Tarefas WhatsApp

log note V.1:

IA inteligente integradas ao WhatsApp para gerenciar atividades, tarefas e lembretes via WhatsApp com arquitetura profissional.

## ✨ Melhorias Implementadas

### 🔒 Segurança & Validação
- ✅ Validação de datas no formato `YYYY-MM-DD`
- ✅ Validação de IDs e entrada de usuários
- ✅ **Sistema de confirmação para ações perigosas** (deletar tarefas)
- ✅ Tratamento de erros em todos os comandos
- ✅ Rate limiting automático em confirmações (5 minutos)

### 📊 Logging & Auditoria
- ✅ Registra todas as ações em `logs/acoes.log`
- ✅ Rastreamento de usuário para cada ação
- ✅ Mensagens de sucesso/falha detalhadas

### 📁 Arquitetura Modular
- ✅ Separação em **handlers** por funcionalidade
  - `handlers/geral.js` — comandos gerais
  - `handlers/tarefas.js` — gerenciar tarefas
  - `handlers/lembretes.js` — gerenciar lembretes
  - `handlers/confirmacao.js` — confirmações de ações
- ✅ Utilitários organizados
  - `utils/validacao.js` — validações
  - `utils/logger.js` — logging
  - `utils/confirmacao.js` — sistema de confirmações
- ✅ `scheduler.js` — tarefas automáticas

### ⏰ Automação & Scheduler
- ✅ Limpeza automática de tarefas às 3:00 da manhã
- ✅ Lembrete automático de tarefas do dia às 7:00 da manhã
- ✅ Fácil adicionar mais tarefas agendadas

### 📈 Novos Comandos
- ✅ `!concluir <id>` — marcar tarefa como feita (sem deletar)
- ✅ `!stats` — ver estatísticas de tarefas

## 📋 Estrutura do Projeto

```
src/
├── index.js                 # Arquivo principal (refatorizado)
├── scheduler.js             # Tarefas automáticas
├── handlers/
│   ├── geral.js            # !bomdia, !ping, !ajuda
│   ├── tarefas.js          # !add, !hoje, !del, etc
│   ├── lembretes.js        # !lembrete, !lembretes, !dellembrete
│   └── confirmacao.js      # !sim, !não
├── utils/
│   ├── validacao.js        # Funções de validação
│   ├── logger.js           # Logging de ações
│   └── confirmacao.js      # Sistema de confirmações
├── tasks/
│   ├── db.js               # Conexão SQLite (com nova tabela de lembretes)
│   └── taskService.js      # Funções de banco de dados
└── logs/
    └── acoes.log          # Arquivo de auditoria (gerado automaticamente)
```

## 🎮 Comandos Disponíveis

### 🌟 Gerais
```
!bomdia      — Mensagem de bom dia
!ping        — Testa se o bot está online
!ajuda       — Mostra todos os comandos
```

### 📝 Tarefas
```
!add <matéria> | <tipo> | <data> | <descrição>
!hoje        — Tarefas de hoje
!semana      — Tarefas dos próximos 7 dias
!provas      — Todas as provas pendentes
!stats       — Ver estatísticas

!concluir <id>               — Marcar como feita
!del <id>                    — Deletar tarefa (com confirmação)
!delantigos <dias>           — Deletar antigas (com confirmação)
!delmateria <matéria>        — Deletar por matéria (com confirmação)
```

### 🔔 Lembretes
```
!lembrete <mensagem>         — Criar novo lembrete
!lembretes                   — Listar todos
!dellembrete <id>            — Deletar (com confirmação)
```

### ✅ Confirmações
```
!sim         — Confirmar ação perigosa
!não         — Cancelar ação perigosa
```

## 📊 Banco de Dados

### Tabela: `tarefas`
```sql
CREATE TABLE tarefas (
  id INTEGER PRIMARY KEY,
  descricao TEXT,
  materia TEXT,
  tipo TEXT,
  prioridade TEXT,           -- NOVO: 'alta', 'normal', 'baixa'
  data_vencimento TEXT,
  criado_por TEXT,
  criado_em TEXT,
  concluida INTEGER,
  concluida_em TEXT          -- NOVO: data de conclusão
)
```

### Tabela: `lembretes`
```sql
CREATE TABLE lembretes (
  id INTEGER PRIMARY KEY,
  mensagem TEXT,
  criado_por TEXT,
  criado_em TEXT,
  ativo INTEGER
)
```

## 🤖 Exemplo de Uso

### Adicionar tarefa com validação
```
User: !add matemática | prova | 2025-04-15 | capítulos 3 e 4
Bot:  ✅ *Tarefa adicionada!*
      📚 Matéria: matemática
      🏷️ Tipo: prova
      📅 Data: 2025-04-15
      🔢 ID: 1
```

### Deletar com confirmação
```
User: !del 1
Bot:  ⚠️ *Confirmação necessária!*
      Tem certeza que deseja deletar a tarefa #1?
      ✅ !sim — confirmar
      ❌ !não — cancelar

User: !sim
Bot:  ✅ Tarefa ID 1 deletada com sucesso
```

### Ver estatísticas
```
User: !stats
Bot:  📊 *Estatísticas de Tarefas:*
      📝 Total: 15
      ✅ Concluídas: 8 (53.3%)
      ⏳ Pendentes: 7
      📅 Para hoje: 3
```

## 🔧 Customizações Fáceis

### Adicionar novo comandoAgendado
No `scheduler.js`:
```javascript
cron.schedule('0 18 * * *', () => {
  console.log('⏰ Executando tarefa às 18:00...')
  // Seu código aqui
})
```

### Adicionar validação custom
Crie função em `utils/validacao.js` e importe onde precisar.

### Alterar tempo de confirmação
Em `utils/confirmacao.js`, mude:
```javascript
if (Date.now() - confirmacao.timestamp > 5 * 60 * 1000)  // 5 minutos
```

## 📝 Logging

Todas as ações ficam registradas em `logs/acoes.log`:

```
✅ [2026-03-29T10:30:15.123Z] +55-123456789@c.us - add - Tarefa #1 adicionada - Estudar
✅ [2026-03-29T10:35:22.456Z] +55-123456789@c.us - concluir - Tarefa #1 marcada como concluída
❌ [2026-03-29T10:40:11.789Z] +55-123456789@c.us - del - Falha ao marcar tarefa
```

## 🚀 Como Rodar

```bash
npm install
node src/index.js
```

Escaneie o QR code com WhatsApp e pronto! 🎉

## 📦 Dependências

- `whatsapp-web.js` — Integração WhatsApp
- `better-sqlite3` — Banco de dados
- `node-cron` — Agendamento
- `dotenv` — Variáveis de ambiente

## 🎯 Próximas Melhorias Possíveis

- [ ] Suporte a prioridades nas tarefas
- [ ] Notificações de lembrete automáticas
- [ ] Sistema de grupos/classes
- [ ] Integração com Google Calendar
- [ ] Dashboard web para visualização
- [ ] Backup automático do banco

---

**Desenvolvido com ❤️ pelo GOAT Rafael**
