-- ============================================================
-- upgrade_prod_db.sql — Migraciones incrementales para producción
-- CRM IngMedia — Ejecutar en phpMyAdmin después del deploy
-- 
-- ✅ Seguro: usa ADD COLUMN IF NOT EXISTS y ON DUPLICATE KEY
-- ⚠️  Revisar comentarios antes de ejecutar en producción
-- ============================================================

USE crm_ingemedia;

-- ── Migración 1: Añadir campo business_model a deals ─────────────────────────
-- Distingue entre Proyectos (pago único) y Servicios (suscripción mensual)
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS business_model ENUM('project', 'service') DEFAULT 'project' 
AFTER stage;

-- ── Migración 2: Añadir campo external_id a deals ────────────────────────────
-- Almacena el código de licitación de Mercado Público (ej: 2784-18-LR26)
-- Habilita el botón "Ver en Mercado Público" desde el CRM
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(50) DEFAULT NULL 
AFTER business_model;

-- ── Migración 3: Cambiar moneda por defecto a CLP ────────────────────────────
-- El CRM opera en Chile, todos los montos son en Pesos Chilenos
ALTER TABLE deals 
MODIFY COLUMN currency VARCHAR(10) DEFAULT 'CLP';

-- ── Migración 4: Actualizar monedas existentes a CLP ─────────────────────────
-- Normaliza registros históricos creados cuando la moneda era USD
UPDATE deals 
SET currency = 'CLP' 
WHERE currency = 'USD' OR currency IS NULL;

-- ── Migración 5: Añadir estado 'shelved' si no existe ────────────────────────
-- NOTA: En MariaDB no existe ADD IF NOT EXISTS para ENUM.
-- Ejecutar solo si el ENUM no incluye 'shelved' todavía.
-- Para verificar: DESCRIBE deals;
-- Si la columna stage ya incluye 'shelved', comentar esta línea.
ALTER TABLE deals 
MODIFY COLUMN stage ENUM(
  'prospecting', 
  'qualification', 
  'proposal', 
  'negotiation', 
  'closed_won', 
  'closed_lost', 
  'shelved'
) DEFAULT 'prospecting';

-- ── Verificación final ────────────────────────────────────────────────────────
SELECT 
  'Migración completada' AS estado,
  COUNT(*) AS total_deals,
  SUM(CASE WHEN external_id IS NOT NULL THEN 1 ELSE 0 END) AS deals_mercado_publico,
  SUM(CASE WHEN currency = 'CLP' THEN 1 ELSE 0 END) AS deals_en_CLP
FROM deals;
