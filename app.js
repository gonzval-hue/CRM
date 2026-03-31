/**
 * app.js — Entry point requerido por Hostinger Node.js
 * 
 * Hostinger busca este archivo por defecto al iniciar la aplicación.
 * Este archivo solo delega al servidor principal en src/index.js.
 * 
 * En desarrollo: usa `npm run dev` (que llama a src/index.js directamente)
 * En producción: Hostinger carga este archivo → carga src/index.js
 */
require('./src/index.js');
