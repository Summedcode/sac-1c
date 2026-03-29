# Integração com IA/LLM - Exemplos de Uso

## 🚀 Como Usar a API para Alimentar dados de IA

### 1. **POST /api/ia/gerar-tarefas** — Receber tarefas geradas por IA

Seu modelo IA (Claude, GPT, etc) gera tarefas e envia para a API:

```bash
curl -X POST http://localhost:3000/api/ia/gerar-tarefas \
  -H "Content-Type: application/json" \
  -d '{
    "modelo": "claude-3-opus",
    "origem": "resumo_de_aula_fisica",
    "tarefas": [
      {
        "descricao": "Ler e resumir capítulos 3-5 sobre Termodinâmica",
        "materia": "Física",
        "tipo": "estudo",
        "prioridade": "alta",
        "data_vencimento": "2025-04-15"
      },
      {
        "descricao": "Resolver exercícios 1-20 página 143",
        "materia": "Física",
        "tipo": "tarefa",
        "prioridade": "normal",
        "data_vencimento": "2025-04-12"
      }
    ]
  }'
```

**Resposta sucesso:**
```json
{
  "sucesso": true,
  "modelo": "claude-3-opus",
  "origem": "resumo_de_aula_fisica",
  "total_requisitado": 2,
  "criadas": 2,
  "erros": 0,
  "dados": {
    "criadas": [
      {
        "indice": 0,
        "id": 42,
        "descricao": "Ler e resumir capítulos 3-5..."
      },
      {
        "indice": 1,
        "id": 43,
        "descricao": "Resolver exercícios 1-20 pág..."
      }
    ]
  }
}
```

---

### 2. **POST /api/ia/analisar-progresso** — IA consulta suas métricas

Use isso para a IA ver como você está indo:

```bash
curl -X POST http://localhost:3000/api/ia/analisar-progresso
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
      {
        "materia": "Física",
        "total": 15,
        "feitas": 3
      },
      {
        "materia": "Matemática",
        "total": 20,
        "feitas": 8
      },
      {
        "materia": "geral",
        "total": 12,
        "feitas": 1
      }
    ]
  },
  "prompt_recomendado": "Baseado nesses dados... [prompt para enviar para IA]"
}
```

---

### 3. **POST /api/ia/gerar-resumo** — Formatar tarefas para IA processar

Gera um resumo formatado que você pode copiar/colar em Claude, ChatGPT:

```bash
curl -X POST http://localhost:3000/api/ia/gerar-resumo \
  -H "Content-Type: application/json" \
  -d '{"tipo": "semana"}'
```

**Resposta:**
```json
{
  "sucesso": true,
  "tipo": "semana",
  "total_tarefas": 8,
  "prompt": "# Tarefas de Estudo - SEMANA\n\n1. **FÍSICA** - estudo\n   - Descrição: Ler capítulos 3-5\n   ...",
  "dados_brutos": [...]
}
```

---

## 💡 Fluxo Recomendado

### Opção A: IA Automática (Melhor para integração)

```
1. Você envia: POST /api/ia/analisar-progresso
   ↓
2. Você copia o "prompt_recomendado" gerado
   ↓
3. Você envia para Claude/GPT: "Baseado nesses dados, gere 5 tarefas"
   ↓
4. IA retorna tarefas em JSON
   ↓
5. Você usa: POST /api/ia/gerar-tarefas com a resposta da IA
   ↓
6. Tarefas aparecem no WhatsApp (!hoje, !semana, etc)
```

### Opção B: Manual + Cópia

```
1. Você chama: POST /api/ia/gerar-resumo
   ↓
2. Você copia o campo "prompt" da resposta
   ↓
3. Você cola no ChatGPT/Claude: "Aqui estão minhas tarefas... [prompt]"
   ↓
4. IA processa e gera recomendações em texto
   ↓
5. Você formata em JSON e envia: POST /api/ia/gerar-tarefas
```

---

## 🔧 Exemplo Node.js (JavaScript)

```javascript
// Função para enviar tarefas geradas pela IA
async function enviarTarefasGeradas(tarefas, modelo = 'claude') {
  const response = await fetch('http://localhost:3000/api/ia/gerar-tarefas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelo,
      origem: 'gerado_automaticamente',
      tarefas: tarefas.map(t => ({
        descricao: t.descricao,
        materia: t.materia,
        tipo: t.tipo || 'tarefa',
        prioridade: t.prioridade || 'normal',
        data_vencimento: t.data_vencimento
      }))
    })
  })

  const resultado = await response.json()
  console.log(`✅ ${resultado.criadas} tarefas criadas`)
  return resultado
}

// Uso
const tarefasGeradas = [
  {
    descricao: 'Fazer lista de exercícios capítulo 5',
    materia: 'Matemática',
    tipo: 'tarefa',
    prioridade: 'alta',
    data_vencimento: '2025-04-20'
  }
]

enviarTarefasGeradas(tarefasGeradas, 'claude-3-opus')
```

---

## 🔐 Notas Importantes

1. **Rastreamento**: Todas as tarefas criadas via IA são registradas no log com `criado_por: "ia:modelo-name"`
2. **Validação**: Campos obrigatórios: `descricao`. Opcionais: `materia` (padrão=geral), `tipo` (padrão=tarefa)
3. **Limite**: Máximo 500 caracteres por descrição de tarefa
4. **Segurança**: Garanta que a IA não envia dados maliciosos (a API faz sanitização, mas cuidado!)
5. **Formato de Date**: Use ISO 8601: `YYYY-MM-DD`

---

## 📊 Fluxo Completo com Claude

```
┌─────────────────────────────────────┐
│   Seu Banco de Dados                │
│   (tarefas, lembretes)              │
└──────────────┬──────────────────────┘
               │
        GET /api/ia/analisar-progresso
               │
┌──────────────▼──────────────────────┐
│   API Extrai Estatísticas            │
│   {total, concluidas, por_materia}   │
└──────────────┬──────────────────────┘
               │
        Copia "prompt_recomendado"
               │
     ┌─────────▼──────────┐
     │ Seu Claude/ChatGPT │
     │ "Baseado nesses ... │  ← Você manda o prompt
     │  gere 5 tarefas"   │
     └─────────┬──────────┘
               │
     Claude retorna:
     {tarefas: [{desc, materia, ...}]}
               │
┌──────────────▼──────────────────────┐
│  POST /api/ia/gerar-tarefas          │
│  {modelo: claude, tarefas: [...]}    │
└──────────────┬──────────────────────┘
               │
        Tarefas inseridas no banco
               │
        ✅ Aparecem em !hoje, !semana
```

