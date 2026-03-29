
# 📡 SAC-1C API — Referência Rápida de Endpoints

**Base URL:** `http://localhost:3000`

---

## 🔍 Health Check

```http
GET /health
```

**Resposta:**
```json
{
  "status": "online",
  "timestamp": "2025-03-29T15:30:45.123Z",
  "banco": "conectado",
  "versao_banco": 1
}
```

---

## 📋 TAREFAS

### Listar todas
```http
GET /api/tarefas
```
**Query params:** `?status=pendente|concluida` (opcional)

### Tarefas de hoje
```http
GET /api/tarefas/hoje
```

### Próximos 7 dias
```http
GET /api/tarefas/semana
```

### Todas as provas
```http
GET /api/tarefas/provas
```

### Estatísticas
```http
GET /api/tarefas/stats
```

**Resposta:**
```json
{
  "total": 47,
  "concluidas": 12,
  "pendentes": 35,
  "por_materia": {
    "Matemática": 20,
    "Física": 15,
    "Português": 12
  }
}
```

### Tarefa específica
```http
GET /api/tarefas/:id
```

**Path:** `GET /api/tarefas/42`

### Criar tarefa
```http
POST /api/tarefas
Content-Type: application/json

{
  "descricao": "Estudar derivadas",
  "materia": "Matemática",
  "tipo": "tarefa",
  "data_vencimento": "2025-04-15",
  "prioridade": "alta",
  "criado_por": "usuario@wa"
}
```

**Obrigatório:** `descricao`
**Opcionais:** `materia` (padrão: geral), `tipo` (padrão: tarefa), `prioridade` (padrão: normal), `data_vencimento`

**Resposta:** `201 Created`
```json
{
  "sucesso": true,
  "id": 42,
  "mensagem": "Tarefa criada com sucesso"
}
```

### Atualizar tarefa
```http
PUT /api/tarefas/:id
Content-Type: application/json

{
  "prioridade": "normal",
  "descricao": "Estudar derivadas (cap 5-7)"
}
```

**Resposta:** `200 OK`
```json
{
  "sucesso": true,
  "mensagem": "Tarefa atualizada"
}
```

### Marcar como concluída
```http
POST /api/tarefas/:id/concluir
```

**Path:** `POST /api/tarefas/42/concluir`

**Resposta:** `200 OK`
```json
{
  "sucesso": true,
  "mensagem": "Tarefa marcada como concluída"
}
```

### Deletar tarefa
```http
DELETE /api/tarefas/:id
```

**Path:** `DELETE /api/tarefas/42`

**Resposta:** `200 OK`
```json
{
  "sucesso": true,
  "mensagem": "Tarefa deletada com sucesso"
}
```

---

## 🔔 LEMBRETES

### Listar lembretes
```http
GET /api/lembretes
```

**Resposta:**
```json
{
  "sucesso": true,
  "total": 3,
  "dados": [
    {
      "id": 1,
      "mensagem": "Estudar para prova",
      "criado_em": "2025-03-29T10:00:00Z"
    }
  ]
}
```

### Lembrete específico
```http
GET /api/lembretes/:id
```

### Criar lembrete
```http
POST /api/lembretes
Content-Type: application/json

{
  "mensagem": "Não esquecer de estudar",
  "criado_por": "usuario@wa"
}
```

**Obrigatório:** `mensagem`

**Resposta:** `201 Created`
```json
{
  "sucesso": true,
  "id": 5,
  "mensagem": "Lembrete criado"
}
```

### Deletar lembrete
```http
DELETE /api/lembretes/:id
```

**Path:** `DELETE /api/lembretes/5`

---

## 🤖 IA / LLM ⭐

### Enviar tarefas de IA

**Endpoint:** `POST /api/ia/gerar-tarefas`

```http
POST /api/ia/gerar-tarefas
Content-Type: application/json

{
  "modelo": "claude-3-opus",
  "origem": "seu_script_ou_bot",
  "tarefas": [
    {
      "descricao": "Fazer exercícios de Cálculo",
      "materia": "Matemática",
      "tipo": "tarefa",
      "prioridade": "alta",
      "data_vencimento": "2025-04-15"
    },
    {
      "descricao": "Ler cap 5 de Biologia",
      "materia": "Biologia",
      "tipo": "estudo",
      "prioridade": "normal"
    }
  ]
}
```

**Campos obrigatórios:**
- `modelo` (string) — Nome do modelo (claude-3, gpt-4, etc)
- `tarefas` (array) — Array de tarefas

**Campos de tarefa:**
- `descricao` ⭐ OBRIGATÓRIA (max 500 chars)
- `materia` (string, padrão: "geral")
- `tipo` (tarefa|prova|estudo, padrão: tarefa)
- `prioridade` (alta|normal|baixa, padrão: normal)
- `data_vencimento` (YYYY-MM-DD, optional)

**Resposta:** `201 Created`
```json
{
  "sucesso": true,
  "modelo": "claude-3-opus",
  "origem": "seu_script_ou_bot",
  "total_requisitado": 2,
  "criadas": 2,
  "erros": 0,
  "dados": {
    "criadas": [
      {"indice": 0, "id": 101, "descricao": "Fazer exercícios..."},
      {"indice": 1, "id": 102, "descricao": "Ler cap 5..."}
    ]
  }
}
```

---

### Analisar progresso

**Endpoint:** `POST /api/ia/analisar-progresso`

```http
POST /api/ia/analisar-progresso
```

Sem body necessário.

**Resposta:** `200 OK`
```json
{
  "sucesso": true,
  "dados": {
    "total": 47,
    "concluidas": 12,
    "pendentes": 35,
    "percentual": "25.5",
    "por_materia": [
      {
        "materia": "Física",
        "total": 15,
        "feitas": 3
      },
      {
        "materia": "Matemática",
        "total": 20,
        "feitas": 8
      }
    ]
  },
  "prompt_recomendado": "Baseado nesses dados de progresso... [prompt para copiar para IA]"
}
```

---

### Gerar resumo para IA

**Endpoint:** `POST /api/ia/gerar-resumo`

```http
POST /api/ia/gerar-resumo
Content-Type: application/json

{
  "tipo": "semana"
}
```

**Opções de `tipo`:**
- `hoje` — Tarefas de hoje
- `semana` — Próximos 7 dias (padrão)

**Resposta:** `200 OK`
```json
{
  "sucesso": true,
  "tipo": "semana",
  "total_tarefas": 8,
  "prompt": "# Tarefas de Estudo - SEMANA\n\n1. **FÍSICA** - estudo\n   - Descrição: Ler capítulos 3-5\n   - Vencimento: 2025-04-10\n   - Prioridade: alta\n\n2. **MATEMÁTICA** - tarefa\n   - Descrição: Fazer exercícios 1-20\n   - Vencimento: 2025-04-12\n   - Prioridade: normal\n\n... Por favor, gere um plano de estudos...",
  "dados_brutos": [...]
}
```

Copie o campo `prompt` inteiro e cole em Claude/ChatGPT!

---

## 🧪 EXEMPLOS COM cURL

### Listar tarefas
```bash
curl http://localhost:3000/api/tarefas
```

### Criar tarefa
```bash
curl -X POST http://localhost:3000/api/tarefas \
  -H "Content-Type: application/json" \
  -d '{
    "descricao": "Estudar Física",
    "materia": "Física",
    "tipo": "estudo",
    "prioridade": "alta",
    "data_vencimento": "2025-04-15"
  }'
```

### Enviar tarefas de IA
```bash
curl -X POST http://localhost:3000/api/ia/gerar-tarefas \
  -H "Content-Type: application/json" \
  -d '{
    "modelo": "claude",
    "origem": "teste_curl",
    "tarefas": [
      {
        "descricao": "Fazer lista de exercícios",
        "materia": "Matemática",
        "tipo": "tarefa",
        "prioridade": "alta",
        "data_vencimento": "2025-04-20"
      }
    ]
  }'
```

### Analisar progresso
```bash
curl -X POST http://localhost:3000/api/ia/analisar-progresso
```

### Gerar resumo
```bash
curl -X POST http://localhost:3000/api/ia/gerar-resumo \
  -H "Content-Type: application/json" \
  -d '{"tipo": "semana"}'
```

---

## 📊 CÓDIGOS HTTP ESPERADOS

| Código | Significado |
|--------|------------|
| 200 | OK — Sucesso (GET, PUT, POST com já existente) |
| 201 | Created — Tarefa/Lembrete criado com sucesso |
| 400 | Bad Request — Dados inválidos |
| 404 | Not Found — Tarefa/ID não existe |
| 500 | Internal Server Error — Erro no servidor |

---

## 🔒 HEADERS RECOMENDADOS

```
Content-Type: application/json
Authorization: Bearer USER_ID (implementar conforme necessário)
User-Agent: seu-app/1.0
```

---

## 📝 VALIDAÇÕES

**Data vencimento:**
- Formato: YYYY-MM-DD
- Não pode ser passado
- Máximo 2 anos no futuro

**ID:**
- Número inteiro > 0

**Descrição:**
- Mínimo 1 caractere
- Máximo 500 caracteres

**Prioridade:**
- Valores válidos: `alta`, `normal`, `baixa`

---

## 💡 DICA: Postman Collection

Importe os exemplos acima no **Postman** para testar facilmente:

1. Abra Postman
2. Crie nova coleção
3. Adicione um request POST para cada endpoint
4. Use os exemplos acima como base
5. Teste!

---

**Última atualização:** 2025-03-29  
**Versão API:** 1.0

Veja mais em: **README-COMPLETO.md**

