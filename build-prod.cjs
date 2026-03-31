/**
 * build-prod.cjs — Script de Deploy para CRM IngMedia
 * 
 * Genera 2 paquetes ZIP para despliegue en Hostinger:
 *   - frontend.zip → Subir a public_html/ (File Manager)
 *   - backend.zip  → Subir en "Settings & Redeploy" de la app Node.js
 * 
 * Uso: npm run deploy
 * 
 * ⚠️  Las variables de entorno se configuran DIRECTAMENTE en el panel 
 *     de Hostinger. NO se incluye el archivo .env en el paquete.
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

// ─── 🔧 CONSTANTES DE CONFIGURACIÓN ──────────────────────────────────────────
const ROOT         = __dirname;
const FRONTEND_DIR = path.join(ROOT, 'frontend');
const FRONTEND_DIST = path.join(FRONTEND_DIR, 'dist');
const BACKEND_SRC  = path.join(ROOT, 'src');
const DATABASE_DIR = path.join(ROOT, 'database');
const OUTPUT_DIR   = path.join(ROOT, 'deploy_output');
const BACKEND_TEMP = path.join(OUTPUT_DIR, '_backend_temp');

// ✅ Archivos/carpetas del BACKEND a incluir (whitelist = más seguro)
// Si agregas una nueva carpeta al backend, añádela aquí.
const BACKEND_INCLUDE = [
  'src',           // Toda la lógica del backend (controllers, models, routes, etc.)
  'app.js',        // Entry point para Hostinger ← OBLIGATORIO
  'package.json',
  'package-lock.json',
];

// ❌ Nunca empaquetar estos (aunque estén dentro de carpetas incluidas)
const EXCLUDE = new Set([
  'node_modules',
  '.env',
  '.env.local',
  '.env.production',
  'logs',
  '__tests__',
  '.git',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, label, cwd = ROOT) {
  console.log(`\n▶  ${label}...`);
  execSync(cmd, { stdio: 'inherit', cwd });
  console.log(`✓  ${label} completado.`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest, excluded) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      if (!excluded.has(file) && !file.endsWith('.log')) {
        copyRecursive(path.join(src, file), path.join(dest, file), excluded);
      }
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function createZip(sourcePath, destZip) {
  if (fs.existsSync(destZip)) fs.unlinkSync(destZip);

  if (process.platform === 'win32') {
    const psCmd = `Compress-Archive -Path '${sourcePath}' -DestinationPath '${destZip}' -Force`;
    const candidates = [
      `powershell -Command "${psCmd}"`,
      `"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "${psCmd}"`,
      `pwsh -Command "${psCmd}"`,
    ];
    let lastError = null;
    for (const cmd of candidates) {
      try {
        execSync(cmd, { cwd: ROOT });
        return;
      } catch (e) {
        lastError = e;
      }
    }
    console.error(`\n❌ Error al crear ZIP: ${lastError.message}`);
    process.exit(1);
  } else {
    // Linux / macOS
    const srcDir = path.dirname(sourcePath);
    execSync(`cd "${srcDir}" && zip -r "${destZip}" .`, { cwd: ROOT });
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════');
console.log('  🚀 CRM IngMedia — Build & Package para Producción    ');
console.log('═══════════════════════════════════════════════════════\n');

// ── PASO 1: Build del Frontend (React + Vite) ─────────────────────────────────
run('npm run build', 'Compilando frontend (Vite + TypeScript)', FRONTEND_DIR);

// ── PASO 2: Preparar carpeta de salida ───────────────────────────────────────
ensureDir(OUTPUT_DIR);
if (fs.existsSync(BACKEND_TEMP)) fs.rmSync(BACKEND_TEMP, { recursive: true });
fs.mkdirSync(BACKEND_TEMP, { recursive: true });

// ── PASO 3: frontend.zip → para public_html/ ─────────────────────────────────
console.log('\n▶  Empaquetando frontend.zip (para public_html/)...');
const frontendZip = path.join(OUTPUT_DIR, 'frontend.zip');
createZip(`${FRONTEND_DIST}${path.sep}*`, frontendZip);
console.log('✓  frontend.zip creado.');

// ── PASO 4: Integrar frontend compilado dentro del backend como /public ────────
//   Esto permite que el SPA catch-all de Express sirva index.html en producción
const publicDest = path.join(BACKEND_TEMP, 'public');
ensureDir(publicDest);
copyRecursive(FRONTEND_DIST, publicDest, new Set());
console.log('✓  Frontend integrado en backend/public (SPA catch-all).');

// ── PASO 5: Copiar archivos del backend (whitelist) ───────────────────────────
console.log('\n▶  Copiando archivos del backend...');
for (const item of BACKEND_INCLUDE) {
  const src = path.join(ROOT, item);
  const dest = path.join(BACKEND_TEMP, item);
  copyRecursive(src, dest, EXCLUDE);
  if (fs.existsSync(src)) {
    console.log(`   ✓  ${item}`);
  } else {
    console.log(`   ⚠️  Advertencia: ${item} no encontrado, se omite.`);
  }
}

// ── PASO 6: Incluir script de migración SQL ────────────────────────────────────
const upgradeSql = path.join(DATABASE_DIR, 'upgrade_prod_db.sql');
if (fs.existsSync(upgradeSql)) {
  const destSql = path.join(BACKEND_TEMP, 'upgrade_prod_db.sql');
  fs.copyFileSync(upgradeSql, destSql);
  console.log('✓  upgrade_prod_db.sql incluido (ejecutar en phpMyAdmin si hay cambios de BD).');
} else {
  console.log('   ℹ️  No se encontró upgrade_prod_db.sql, se omite.');
}

// ── PASO 7: Incluir el .env.example como guía (NO el .env real) ───────────────
const envExample = path.join(ROOT, '.env.example');
if (fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, path.join(BACKEND_TEMP, '.env.example'));
  console.log('✓  .env.example incluido (referencia para variables de entorno en Hostinger).');
}

// ── PASO 8: backend.zip → para carpeta Node.js en Hostinger ──────────────────
console.log('\n▶  Empaquetando backend.zip (para subir en "Settings & Redeploy")...');
const backendZip = path.join(OUTPUT_DIR, 'backend.zip');
createZip(`${BACKEND_TEMP}${path.sep}*`, backendZip);
fs.rmSync(BACKEND_TEMP, { recursive: true }); // Limpiar carpeta temporal
console.log('✓  backend.zip creado y carpeta temporal eliminada.');

// ── RESUMEN FINAL ─────────────────────────────────────────────────────────────
const frontendSize = (fs.statSync(frontendZip).size / 1024).toFixed(1);
const backendSize  = (fs.statSync(backendZip).size  / 1024).toFixed(1);

console.log('\n═══════════════════════════════════════════════════════');
console.log('  ✅ PAQUETES LISTOS en /deploy_output/                ');
console.log('═══════════════════════════════════════════════════════');
console.log(`\n  🟢 frontend.zip  (${frontendSize} KB)`);
console.log('     → Subir en Hostinger File Manager');
console.log('     → Extraer en: public_html/');
console.log(`\n  🔵 backend.zip   (${backendSize} KB)`);
console.log('     → Subir en hPanel → Node.js → Settings & Redeploy');
console.log('     → Hostinger ejecutará npm install y reiniciará la app');
console.log('\n  ⚙️  Variables de entorno: configurar en el panel de Hostinger');
console.log('  📋 Referencia: .env.example (incluido en backend.zip)');
console.log('\n  🗄️  Base de Datos (solo si hay cambios de esquema):');
console.log('     → phpMyAdmin → Ejecutar upgrade_prod_db.sql');
console.log('\n═══════════════════════════════════════════════════════\n');
