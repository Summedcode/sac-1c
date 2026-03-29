# 🎯 GUIA DIDÁTICO - ONDE RODAR CADA COMANDO

**Orientação:** Siga a ordem de 1 a 5. Não pule etapas!

---

## 1️⃣ PEGAR API KEY DO GOOGLE (Gratuito)

### 📍 ONDE FAZER:
- **Programa:** 🌐 **NAVEGADOR** (Chrome, Firefox, Edge)
- **O que fazer:** Clicar em links, NÃO é comando de terminal

### 📋 PASSO A PASSO:

```
1. Abra seu navegador (Chrome, Firefox, Edge)
   
2. Cole a url na barra de endereços:
   https://makersuite.google.com/app/apikey

3. Clique em "Sign in" e entre com sua conta Google

4. Clique no botão: "Create API Key" (laranja/azul)

5. Selecione: "Create new secret API key in new Google Cloud project"
   OU se tiver projeto: escolha o projeto existente

6. Copie a chave que aparece (exemplo: AIzaSy...)
   - Ela começa com "AIzaSy"
   - Clique em "Copy" ou Ctrl+C

7. Guarde em algum lugar (bloco de notas, por enquanto)
```

**⏱️ Tempo:** 2-3 minutos

**✅ Resultado esperado:**
```
AIzaSyDxic0p_nF8UrLWr9pQyRYyNI3_XYZ...
```

---

## 2️⃣ EDITAR O ARQUIVO .env (Configuração)

### 📍 ONDE FAZER:
- **Programa:** 💻 **VS CODE** (o editor onde você está programando)
- **arquivo:** `.env` (na pasta raiz do projeto)

### 📋 PASSO A PASSO:

**OPÇÃO A - FÁCIL (Recomendado):**

```
1. Abra VS Code

2. No lado esquerdo, veja a lista de arquivos ("Explorer")

3. Procure pelo arquivo: .env
   (Se não ver .env, clique em "Abrir Pasta" e escolha c:\Users\lucia\sac-1c)

4. Clique 1x no arquivo .env para abrir

5. Você vai ver algo como:
   ──────────────────────────────────
   API_PORT=3000
   DATABASE_PATH=./data/database.sqlite
   NODE_ENV=development
   ──────────────────────────────────

6. No FINAL do arquivo (depois da última linha), clique e pressione ENTER

7. Cole esta linha:
   GEMINI_API_KEY=AIzaSy_COLE_SUA_CHAVE_AQUI

   Exemplo (com uma chave fake):
   GEMINI_API_KEY=AIzaSyDxic0p_nF8UrLWr9pQyRYyNI3_XYZ123abc

8. Salve o arquivo: Ctrl+S (ou File > Save)
```

**OPÇÃO B - Se não encontrar .env:**

```
1. No VS Code, vê se tem um arquivo chamado: .env.example

2. Se sim, faça uma cópia:
   - Clique direito em .env.example
   - Escolha: "Copy"
   - Clique direito na pasta
   - "Paste"
   - Renomeie para: .env

3. Agora abra o .env e adicione a linha GEMINI_API_KEY
   (mesmo processo da OPÇÃO A, passo 6-8)
```

**⏱️ Tempo:** 1 minuto

**✅ Resultado esperado:**
```
Arquivo .env com a linha:
GEMINI_API_KEY=AIzaSy_sua_chave_aqui
```

---

## 3️⃣ INSTALAR A DEPENDÊNCIA (@google/generative-ai)

### 📍 ONDE FAZER:
- **Programa:** 🖥️ **POWERSHELL** ou **CMD** (terminal do Windows)
- **Pasta:** Raiz do projeto: `c:\Users\lucia\sac-1c\`

### 🔴 ATENÇÃO:
**Você precisa estar NA PASTA CORRETA antes de rodar o comando!**

### 📋 PASSO A PASSO:

**MÉTODO 1 - Usar Terminal do VS Code (MAIS FÁCIL):**

```
1. No VS Code, clique em: Terminal > New Terminal
   (ou aperte Ctrl+`)

2. Você vera na parte de baixo uma janela preta com algo como:
   ───────────────────────────────────────────────
   PS C:\Users\lucia\sac-1c> ← Você está no lugar certo!
   ───────────────────────────────────────────────

3. Cole este comando e aperte ENTER:
   npm install @google/generative-ai

4. Aguarde (vai demorar 30 segundos a 2 minutos)
   Você vai ver mensagens como:
   - "added 50 packages"
   - "found 0 vulnerabilities"

5. Quando terminar, volta a mostrar o >
```

**MÉTODO 2 - Abrir PowerShell Manualmente:**

```
1. Aperte: Windows + R (abre "Executar")

2. Digite: powershell

3. Aperte ENTER

4. Você tem uma janela azul com:
   PS C:\Users\lucia\>

5. Agora precisa ir para a pasta do projeto. Digite:
   cd c:\Users\lucia\sac-1c

6. Aperte ENTER. Agora você vai ver:
   PS C:\Users\lucia\sac-1c>

7. Cole o comando:
   npm install @google/generative-ai

8. Aperte ENTER e aguarde terminar
```

**⏱️ Tempo:** 1-2 minutos

**✅ Resultado esperado:**
```
Added 50 packages in 45s
found 0 vulnerabilities
```

---

## 4️⃣ RODAR A API (Terminal 1)

### 📍 ONDE FAZER:
- **Programa:** 🖥️ **POWERSHELL** (na pasta do projeto)
- **Pasta:** `c:\Users\lucia\sac-1c\`
- ⚠️ **IMPORTANTE:** Este terminal FICA ABERTO rodando sempre!

### 📋 PASSO A PASSO:

```
1. Abra um NOVO PowerShell (ou terminal do VS Code)
   (Não use o mesmo que instalou a dependência!)

2. Certifique-se que está na pasta certa:
   PS C:\Users\lucia\sac-1c>

3. Se não estiver, digite:
   cd c:\Users\lucia\sac-1c

4. Agora cole este comando e aperte ENTER:
   node start.js

5. Você vai ver mensagens como:
   ──────────────────────────────────
   ✅ API iniciada na porta 3000
   ✅ Banco de dados conectado
   ✅ WhatsApp conectado
   ──────────────────────────────────

6. ⚠️ DEIXE ESTE TERMINAL ABERTO!
   Não feche, não minimize DEMAIS
   Ele precisa ficar rodando enquanto você usa
```

**⏱️ Tempo:** 5-10 segundos

**✅ Resultado esperado:**
```
API rodando em http://localhost:3000
WhatsApp wa-automate conectado
```

**🚨 SE DER ERRO:**
```
"Cannot find module..."
→ npm install (rode sem filtro)

"Port 3000 already in use"
→ Feche o outro terminal que estava rodando antes
```

---

## 5️⃣ RODAR O GEMINI (Terminal 2)

### 📍 ONDE FAZER:
- **Programa:** 🖥️ **POWERSHELL NOVO** (outro terminal, não o mesmo)
- **Pasta:** `c:\Users\lucia\sac-1c\`
- ⚠️ **IMPORTANTE:** Abra DEPOIS que o Terminal 1 estiver rodando!

### 📋 PASSO A PASSO:

```
1. Você já tem Terminal 1 rodando com: node start.js
   (Deixe rodando, não feche!)

2. Abra um NOVO PowerShell (completamente novo)
   - Windows + R
   - Digite: powershell
   - Aperte ENTER

3. Você tem uma janela azul totalmente nova

4. Vá para a pasta do projeto:
   cd c:\Users\lucia\sac-1c

5. Aperte ENTER

6. Cole este comando:
   node src/integracoes/gemini.js

7. Aperte ENTER

8. Você vai ver mensagens como:
   ──────────────────────────────────
   🔄 Conectando ao Gemini...
   📊 Obtendo progresso...
   🤖 Enviando para Gemini...
   ✅ 3 tarefas criadas com sucesso!
   ──────────────────────────────────

9. Pronto! Gemini rodou 1x. Agora pode fechar.
   (Para rodar de novo, cole o comando novamente)
```

**⏱️ Tempo:** 5 segundos

**✅ Resultado esperado:**
```
✅ 3 tarefas criadas com sucesso!
✅ Salvas no banco de dados
```

---

## 🎯 RESUMO VISUAL

```
┌─────────────────────────────────────────────────────────┐
│ 1️⃣  NAVEGADOR (Chrome)                                  │
│    https://makersuite.google.com/app/apikey            │
│    → Copie: AIzaSy...                                   │
└─────────────────────────────────────────────────────────┘
                         ⬇️
                      (2-3 min)
                         ⬇️
┌─────────────────────────────────────────────────────────┐
│ 2️⃣  VS CODE (.env file)                                 │
│    Adicione: GEMINI_API_KEY=AIzaSy...                   │
│    Salve: Ctrl+S                                        │
└─────────────────────────────────────────────────────────┘
                         ⬇️
                      (1 min)
                         ⬇️
┌─────────────────────────────────────────────────────────┐
│ 3️⃣  POWERSHELL                                          │
│    npm install @google/generative-ai                    │
│    Aguarde terminar                                     │
└─────────────────────────────────────────────────────────┘
                         ⬇️
                    (1-2 min)
                         ⬇️
    ┌──────────────────────────┬──────────────────────────┐
    │ 4️⃣  TERMINAL 1           │ 5️⃣  TERMINAL 2           │
    │    node start.js         │    node src/integ...    │
    │    [DEIXE RODANDO]       │    [Execute 1x]         │
    │    (Ctrl+C para parar)   │    (Pode fechar depois) │
    └──────────────────────────┴──────────────────────────┘
                         ⬇️
                 VER RESULTADO
                         ⬇️
                WhatsApp: !hoje
            (Vê as tarefas criadas)
```

---

## 📱 TESTAR RESULTADO

### Depois que tudo estiver rodando:

```
1. Abra o WhatsApp Web (web.whatsapp.com)

2. Envie estas mensagens para o seu número (ou grupo):
   
   !hoje
   → Mostra tarefas de hoje (incluindo as do Gemini)
   
   !semana
   → Mostra próximos 7 dias
   
   !stats
   → Mostra estatísticas

3. Se vir novas tarefas aparecendo, FUNCIONOU! ✅
```

---

## 🛑 PARAR TUDO

**Para parar Terminal 1 (API):**
```
1. Clique na janela do Terminal 1
2. Aperte: Ctrl + C
3. Pergunta "Terminatecpp job?", digite: y
4. Aperte ENTER
```

**Para parar Terminal 2 (Gemini):**
```
1. Clique na janela do Terminal 2
2. Aperte: Ctrl + C ou feche a janela
```

---

## ❓ DÚVIDAS COMUNS

**P: Qual a diferença entre PowerShell e CMD?**
R: PowerShell é mais novo e melhor. Use PowerShell.

**P: Posso rodar tudo em um só terminal?**
R: Não. Terminal 1 fica preso enquanto roda node start.js, por isso precisa de um segundo.

**P: E se não tiver .env?**
R: Crie! No VS Code, File > New File, salve como ".env" na raiz do projeto.

**P: Preciso deixar os 2 terminais abertos o tempo todo?**
R: Sim, enquanto estiver usando. Quando quiser parar tudo, aperte Ctrl+C em ambos.

**P: Posso rodar no CMD em vez de PowerShell?**
R: Sim, mas PowerShell é melhor. Os comandos são os mesmos.

---

## ✅ CHECKLIST FINAL

```
[ ] 1️⃣  Peguei API Key do Google (começando com AIzaSy)
[ ] 2️⃣  Adicionei ao .env: GEMINI_API_KEY=AIzaSy...
[ ] 3️⃣  Rodei: npm install @google/generative-ai (terminou sem erro)
[ ] 4️⃣  Terminal 1: node start.js (está rodando, vê "API iniciada")
[ ] 5️⃣  Terminal 2: node src/integracoes/gemini.js (vê "tarefas criadas")
[ ] 6️⃣  Testei no WhatsApp: !hoje (aparecem tarefas)
[ ] ✅ PRONTO PARA USAR!
```

---

**Desenvolvido para SAC-1C — 2025**
