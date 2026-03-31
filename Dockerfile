FROM ghcr.io/puppeteer/puppeteer:latest

USER root

# Configura fuso horário de Brasília e instala dependências de fontes
RUN apt-get update && apt-get install -y tzdata fonts-liberation && \
    ln -fs /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata

# Instala dependências extras de fontes para o Chrome não bugar o QR Code
RUN apt-get install -y libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Cria a pasta de dados e garante permissões para o usuário do puppeteer
RUN mkdir -p /app/data && chown -R pptruser:pptruser /app

EXPOSE 3000
CMD ["node", "start.js"]