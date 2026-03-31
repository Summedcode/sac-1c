FROM ghcr.io/puppeteer/puppeteer:latest

USER root

# Configura fuso horário e instala dependências mínimas necessárias
RUN apt-get update && apt-get install -y tzdata fonts-liberation && \
    ln -fs /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Garante que o diretório de dados e o arquivo de QR Code tenham permissões corretas
RUN mkdir -p /app/data/session && touch /app/data/qr.png && chown -R pptruser:pptruser /app

USER pptruser

EXPOSE 3000
CMD ["node", "start.js"]