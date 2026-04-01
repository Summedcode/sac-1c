const { GoogleGenerativeAI } = require("@google/generative-ai");
async function testConnection() {
  console.log("🔍 Iniciando teste de diagnóstico de API...");
  
  if (!process.env.GEMINI_KEY) {
    console.error("❌ ERRO: GEMINI_KEY não encontrada no process.env");
    return;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

  // Testando o modelo que estava dando 404
  const modelId = "gemini-2.5-flash-lite"; 
  
  try {
    console.log(`📡 Tentando conectar ao modelo: ${modelId}...`);
    const model = genAI.getGenerativeModel({ 
      model: modelId 
    }, { 
      apiVersion: 'v1beta' 
    });

    const prompt = "Responda apenas: 'Conexão estabelecida com sucesso!'";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("\n✅ SUCESSO!");
    console.log("🤖 Resposta da IA:", text);
    console.log("\n💡 O erro 404 foi resolvido. Você pode rodar o bot principal agora.");

  } catch (error) {
    console.error("\n❌ FALHA NO TESTE:");
    console.error("Mensagem de erro:", error.message);

    if (error.message.includes("404")) {
      console.log("\n⚠️ DIAGNÓSTICO: Erro 404 detectado.");
      console.log("Causas prováveis:");
      console.log("1. O nome do modelo '" + modelId + "' ainda não é reconhecido pela sua versão do SDK.");
      console.log("2. Verifique se não há erros de digitação (ex: 'modeels').");
      console.log("3. Tente trocar para 'gemini-1.5-flash' ou 'gemini-pro'.");
    }
  }
}

testConnection();