
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("🚀 SmartShop AI: Inicializando...");

const container = document.getElementById('root');

if (!container) {
  throw new Error("Elemento #root não encontrado no HTML.");
}

try {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("✅ SmartShop AI: Renderizado com sucesso.");
} catch (error) {
  console.error("❌ SmartShop AI: Erro na renderização:", error);
  container.innerHTML = `
    <div style="padding: 20px; color: #ef4444; text-align: center;">
      <h3>Erro Fatal</h3>
      <p>${error instanceof Error ? error.message : "Erro desconhecido"}</p>
    </div>
  `;
}
