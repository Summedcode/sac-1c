#!/usr/bin/env node

/**
 * 🚀 GUIA RÁPIDO - GEMINI INTEGRADO
 * 
 * Tudo pronto! Siga os 5 passos abaixo:
 */

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🎉 GEMINI INTEGRADO AO SEU SAC-1C                     ║
║        Pronto para usar em 5 minutos!                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

📋 O QUE FOI CRIADO:
═══════════════════════════════════════════════════════════════

✅ src/api/routes/gemini.js
   → 3 endpoints novos para Gemini

✅ src/integracoes/gemini.js
   → Script pronto para executar

✅ GEMINI-SETUP.md
   → Documentação completa

✅ .env.example
   → Variáveis de configuração


🚀 5 PASSOS PARA COMEÇAR:
═══════════════════════════════════════════════════════════════

1️⃣  PEGAR API KEY (Gratuito)
    ─────────────────────────────────────────────────────────
    → Abra: https://makersuite.google.com/app/apikey
    → Login com Google
    → Clique "Create API Key"
    → Copie a key (tipo: AIzaSy...)


2️⃣  INSTALAR DEPENDÊNCIA
    ─────────────────────────────────────────────────────────
    npm install @google/generative-ai


3️⃣  CONFIGURAR .env
    ─────────────────────────────────────────────────────────
    echo "GEMINI_API_KEY=AIzaSy_sua_key" >> .env
    
    (Ou edite o arquivo direto)


4️⃣  RODAR (2 TERMINAIS)
    ─────────────────────────────────────────────────────────
    
    Terminal 1:
    node start.js
    
    Terminal 2:
    node src/integracoes/gemini.js


5️⃣  VER RESULTADO
    ─────────────────────────────────────────────────────────
    
    No seu WhatsApp:
    !hoje     → Ver novas tarefas geradas
    !semana   → Ver próximos 7 dias
    !stats    → Ver estatísticas


🤖 COMO FUNCIONA:
═══════════════════════════════════════════════════════════════

seu-banco.sqlite (50 tarefas)
           ↓
GET /api/gemini/progresso
           ↓
[Gemini analisa]
           ↓
POST /api/gemini/gerar-tarefas
           ↓
seu-banco.sqlite (55 tarefas)


📡 ENDPOINTS NOVOS:
═══════════════════════════════════════════════════════════════

GET  /api/gemini/progresso      → Dados para Gemini analisar
POST /api/gemini/gerar-tarefas  → Receber tarefas de Gemini
POST /api/gemini/webhook        → Para automação


🔄 RODAR AUTOMATICAMENTE (24/7):
═══════════════════════════════════════════════════════════════

Opção A: Cron Job (Linux/Mac)
────────────────────────────
crontab -e
0 * * * * node /seu/projeto/src/integracoes/gemini.js

Opção B: PM2 (Recomendado)
────────────────────────
npm install -g pm2
pm2 start src/integracoes/gemini.js --cron "0 */1 * * *"

Opção C: Railway (Cloud)
────────────────────────
Ver: GEMINI-SETUP.md (seção Deploy 24/7)


💡 DICAS:
═══════════════════════════════════════════════════════════════

✨ Gemini retorna tarefas inteligentes
   → Identifica lacunas no seu progresso
   → Prioriza matérias com baixo desempenho
   → Recebe as tarefas em 5 segundos

✨ Totalmente Free
   → API Key do Google: Gratuita
   → Limite: 15 requisições/minuto (supera sua necessidade)

✨ Sem token carrear
   → Rodando localmente: 0 custo
   → Rodando em Railway: ~$5/mês

✨ Fácil customizar
   → Edite src/integracoes/gemini.js para alterar o prompt
   → Mude frequência no cron
   → Adicione validações


🐛 SE DER ERRO:
═══════════════════════════════════════════════════════════════

"Module not found @google/generative-ai"
→ npm install @google/generative-ai

"GEMINI_API_KEY not found"
→ Verificar .env tem: GEMINI_API_KEY=AIzaSy...

"Cannot connect to localhost:3000"
→ API não está rodando: node start.js (outro terminal)

"Invalid JSON from Gemini"
→ Às vezes retorna markdown, trata com regex
→ Ver código em src/integracoes/gemini.js


📚 DOCUMENTAÇÃO:
═══════════════════════════════════════════════════════════════

Leia: GEMINI-SETUP.md (Tudo detalhado)

Sumário:
- Como usar
- Endpoints
- Deploy 24/7
- Código customizado
- FAQ


✅ CHECKLIST FINAL:
═══════════════════════════════════════════════════════════════

[ ] Peguei API key em makersuite.google.com
[ ] npm install @google/generative-ai
[ ] Adicionei GEMINI_API_KEY ao .env
[ ] node start.js (funcionando)
[ ] node src/integracoes/gemini.js (testei)
[ ] Vi tarefas geradas em !hoje
[ ] PRONTO PARA PRODUÇÃO!


═════════════════════════════════════════════════════════════════

                    🎉 VOCÊ ESTÁ PRONTO!

                    npm install @google/generative-ai
                    echo "GEMINI_API_KEY=sua_key" >> .env

                    node start.js           (Terminal 1)
                    node src/integracoes/gemini.js  (Terminal 2)

═════════════════════════════════════════════════════════════════

Desenvolvido para SAC-1C — 2025 🎓

`)
