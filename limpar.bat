@echo off
echo Limpando processos...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM chrome.exe /T 2>nul
taskkill /F /IM chromium.exe /T 2>nul
echo Processos limpos!
echo Iniciando SAC-1C...
node start.js
