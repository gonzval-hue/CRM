const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST (before anything else)
dotenv.config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const db = require('./config/database');

// ── Capturar crashes no manejados para que aparezcan en los logs de Hostinger ──
process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] unhandledRejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
// Puerto: Hostinger lo asigna via process.env.PORT dinámicamente.
// En desarrollo local, el .env define PORT=3000.
const PORT = process.env.PORT || 3000;

// ── Diagnóstico de startup (visible en logs de Hostinger) ──────────────────────
console.log('══════════════════════════════════════════');
console.log('  BidFlow CRM — Iniciando servidor...');
console.log('══════════════════════════════════════════');
console.log(`  NODE_ENV  : ${process.env.NODE_ENV || '(no definido)'}`);
console.log(`  PORT      : ${process.env.PORT || '(no definido, usando 3000)'}`);
console.log(`  DB_HOST   : ${process.env.DB_HOST || '(no definido)'}`);
console.log(`  DB_PORT   : ${process.env.DB_PORT || '(no definido)'}`);
console.log(`  DB_NAME   : ${process.env.DB_NAME || '(no definido)'}`);
console.log(`  DB_USER   : ${process.env.DB_USER || '(no definido)'}`);
console.log(`  DB_PASS   : ${process.env.DB_PASSWORD ? '***' : '(vacío/no definido)'}`);
console.log('──────────────────────────────────────────');

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined', { stream: logger.stream })); // HTTP logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Ruta absoluta al frontend compilado — independiente del CWD del proceso
// __dirname = .../nodejs/src/ → publicPath = .../nodejs/public/
const publicPath = path.join(__dirname, '../public');

// Serve static files from public folder
app.use(express.static(publicPath));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes - CRM Core
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/deals', require('./routes/dealRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));

// API Routes - Additional Features
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/tags', require('./routes/tagRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/email-templates', require('./routes/emailTemplateRoutes'));
app.use('/api/export', require('./routes/exportImportRoutes'));

// SPA Catch-all: sirve index.html para todas las rutas no-API
// Esto permite que React Router maneje rutas como /deals, /contacts, etc.
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  const indexPath = path.join(publicPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  
  // Test database connection
  db.testConnection();
});

module.exports = app;
