# 🏗️ IngMedia CRM — Arquitectura (v3 — Stack Node.js)

> **Stack:** Vite + React (Frontend) · Express.js (BFF + CRM Core) · MySQL · Hostinger  
> **Correcciones aplicadas:** DB separada · BFF solo enruta · Logic en CRM Core · Dominio explícito · Flujos E2E

---

## 1. Separación de Capas (Responsabilidades)

| Capa | Tecnología | Responsabilidad | **NO hace** |
|---|---|---|---|
| **Frontend** | Vite + React + TypeScript | Renderiza UI, gestiona estado local, llama al BFF | Lógica de negocio, acceso a DB |
| **BFF Orquestador** | Node.js + Express | Valida JWT, enruta requests, agrega respuestas N+1 | Reglas de negocio, transformaciones complejas |
| **CRM Core API** | Node.js + Express | **Toda la lógica de dominio.** Casos de uso, validaciones, reglas | Presentación, enrutamiento |
| **Evaluador** | Node.js + Express | Busca y filtra licitaciones de Mercado Público | Estado de oportunidades, facturación |
| **BidFlow AI (PHP)** | PHP (existente) | Genera propuestas con IA | Estado del pipeline, clientes |
| **CRM DB (MySQL)** | MySQL 8 | Datos de dominio del CRM | Datos de BidFlow (base separada) |
| **BidFlow DB (MySQL)** | MySQL 8 | Datos propios de BidFlow | Datos del CRM |

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND — Vite + React 18 + TypeScript + Tailwind          │
│  crm.ingemedia.cl  (build estático → Hostinger)              │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS + JWT Bearer
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  BFF — Node.js + Express                                     │
│  api.ingemedia.cl  (Node.js en Hostinger VPS)                │
│  • Valida JWT (no genera reglas de negocio)                  │
│  • Enruta al servicio correcto                               │
│  • Agrega respuestas multi-servicio (fan-out/fan-in)         │
└──────────┬──────────────┬─────────────────┬─────────────────┘
           │              │                 │
           ▼              ▼                 ▼
┌──────────────┐  ┌───────────────┐  ┌───────────────────────┐
│ CRM CORE API │  │ EVALUADOR API │  │    BIDFLOW AI API      │
│  (Node.js +  │  │  (Node.js +   │  │      (PHP)             │
│   Express)   │  │   Express)    │  │                        │
│ TODA la      │  │ Búsqueda de   │  │ Generación de          │
│ lógica de    │  │ licitaciones  │  │ propuestas con IA      │
│ dominio aquí │  │ (Mercado Pub.)│  │                        │
└──────┬───────┘  └──────┬────────┘  └──────────┬────────────┘
       │                 │                       │
       ▼                 ▼                       ▼
┌─────────────┐  ┌───────────────┐       ┌─────────────┐
│ CRM DB      │  │ JSON Data     │       │ BIDFLOW DB  │
│ (MySQL 8)   │  │ Lake (local)  │       │ (MySQL 8)   │
│ SEPARADA    │  │               │       │ SEPARADA    │
└─────────────┘  └───────────────┘       └─────────────┘
```

---

## 3. Modelo de Dominio

### Entidades centrales y sus relaciones

```
USUARIO (interno agencia)
 └── tiene ROL (admin | comercial | analista | visor)
 └── es responsable de → OPORTUNIDADES

CLIENTE (empresa o persona)
 ├── tiene muchos → CONTACTOS
 ├── tiene muchas → OPORTUNIDADES
 └── tiene muchas → FACTURAS

OPORTUNIDAD (el deal / tarjeta Kanban)
 ├── pertenece a → CLIENTE
 ├── tiene un → ESTADO (posición en pipeline)
 ├── puede tener → PROPUESTA (vinculada a BidFlow)
 ├── puede originarse en → LICITACIÓN (vinculada a Evaluador)
 ├── tiene muchas → ACTIVIDADES (historial)
 └── puede generar → FACTURA (si se gana)

ESTADO (etapa del pipeline — configurable)
 Secuencia default: Lead → Calificado → Propuesta → Negociación → Cerrado ✓ / ✗

PROPUESTA
 ├── referencia a RFP en BidFlow AI (ID externo)
 └── estado sincronizado desde BidFlow

FACTURA
 ├── pertenece a → CLIENTE
 ├── puede estar vinculada a → OPORTUNIDAD
 └── tiene muchos → ÍTEMS

ACTIVIDAD (log de todo lo que pasa en una Oportunidad)
 Tipos: nota | llamada | reunión | email | cambio_estado | propuesta_creada | factura_emitida
```

### Propiedades clave por entidad

| Entidad | Propiedades clave |
|---|---|
| **Cliente** | `id, nombre, rut, tipo(privado/publico), industria, email, propietario_id` |
| **Oportunidad** | `id, titulo, cliente_id, estado_id, responsable_id, valor_estimado, probabilidad, origen(manual/evaluador/bidflow), ganada(null/true/false)` |
| **Estado** | `id, nombre, orden, color, tipo(activo/ganado/perdido)` |
| **Propuesta** | `id, oportunidad_id, bidflow_rfp_id, estado_bidflow, sincronizado_en` |
| **Factura** | `id, numero, cliente_id, oportunidad_id, estado(borrador/emitida/pagada/vencida), total, fecha_vencimiento` |
| **Actividad** | `id, oportunidad_id, usuario_id, tipo, contenido, metadata(JSON), creado_en` |

---

## 4. Flujos End-to-End

### Flujo A — Licitación de Mercado Público

```
[Usuario]                [CRM Frontend]        [BFF]        [CRM Core]     [Evaluador]
   │                          │                  │               │               │
   │── 1. Busco licitaciones ──►                  │               │               │
   │                          │── GET /buscar ──►│               │               │
   │                          │                  │── GET /search ──────────────►│
   │                          │                  │               │ ◄── resultados┤
   │                          │ ◄── lista ────────│               │               │
   │ ◄── ve tarjetas ─────────│                  │               │               │
   │                          │                  │               │               │
   │── 2. "Importar al CRM" ──►                  │               │               │
   │                          │── POST /oportunidades/import ──►│               │
   │                          │                  │  [CRM Core crea Oportunidad]  │
   │                          │                  │  [Estado: "Lead"]             │
   │                          │                  │  [Origen: "evaluador"]        │
   │                          │ ◄── Oportunidad creada ─────────│               │
   │ ◄── Kanban actualizado ──│                  │               │               │
   │                          │                  │               │               │
   │── 3. Mover a "Propuesta" ►                  │               │               │
   │                          │── PATCH /oportunidades/{id}/estado ────────►    │
   │                          │                  │  [CRM Core valida transición] │
   │                          │                  │  [Registra Actividad]         │
   │                          │                  │               │               │
   │── 4. "Crear Propuesta" ──►                  │               │               │
   │                          │── POST /propuestas ─────────────►│               │
   │                          │                  │── POST /rfp ──┼──► [BidFlow]  │
   │                          │                  │  [BidFlow crea propuesta IA]  │
   │                          │                  │  [CRM Core guarda referencia] │
   │ ◄── URL a BidFlow ───────│                  │               │               │
   │                          │                  │               │               │
   │── 5. Resultado: "Ganado" ►                  │               │               │
   │                          │── PATCH /oportunidades/{id} ───►│               │
   │                          │                  │  [CRM Core: ganada=true]      │
   │                          │                  │  [Registra Actividad]         │
   │                          │                  │  [Sugiere crear Factura]      │
   │ ◄── Opción "Facturar" ───│                  │               │               │
   │                          │                  │               │               │
   │── 6. Generar Factura ────►                  │               │               │
   │                          │── POST /facturas ───────────────►│               │
   │                          │                  │  [CRM Core crea Factura]      │
   │                          │                  │  [Calcula IVA 19%]            │
   │ ◄── Factura PDF ready ───│                  │               │               │
```

---

### Flujo B — Cliente Privado Directo

```
[Usuario]           [CRM Frontend]       [BFF]        [CRM Core]
   │                      │                │               │
   │── 1. Crear cliente ──►                │               │
   │                      │── POST /clientes ─────────────►│
   │                      │                │  [Valida RUT, guarda en CRM DB]
   │ ◄── Cliente creado ──│                │               │
   │                      │                │               │
   │── 2. Nueva oportunidad ►              │               │
   │                      │── POST /oportunidades ─────────►│
   │                      │                │  [Estado inicial: "Lead"]
   │                      │                │  [Origen: "manual"]        │
   │ ◄── Tarjeta en Kanban│                │               │
   │                      │                │               │
   │── 3. Drag & Drop "Propuesta" ─────────►               │
   │                      │── PATCH /estado ───────────────►│
   │                      │                │  [Valida transición]
   │                      │                │  [Notifica responsable]
   │                      │                │               │
   │── 4. Crear propuesta en BidFlow ───────►              │
   │   (redirige a BidFlow con contexto del cliente)        │
   │                      │                │               │
   │── 5. BidFlow llama webhook ────────────►              │
   │                      │  POST /webhooks/bidflow ───────►│
   │                      │                │  [CRM Core actualiza propuesta_ref]
   │                      │                │  [Registra actividad]
   │ ◄── Oportunidad actualizada ──────────│               │
```

---

## 5. Esquema SQL — CRM DB (Base Separada)

> **Nombre de base:** `ingemedia_crm`  
> **BidFlow usa:** `bidflow_ai` — completamente separada  
> **Comunicación entre DBs:** cero. Solo referencias por ID externo.

```sql
-- ==========================================
-- USUARIOS Y ROLES
-- ==========================================
CREATE TABLE roles (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    permisos    JSON         NOT NULL DEFAULT ('{}'),
    creado_en   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rol_id        INT UNSIGNED NOT NULL,
    nombre        VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    activo        BOOLEAN      DEFAULT TRUE,
    ultimo_login  TIMESTAMP    NULL,
    creado_en     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- ==========================================
-- DOMINIO: ORÍGENES (normalizado)
-- ==========================================
CREATE TABLE origenes (
    id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE   -- 'manual', 'evaluador', 'bidflow'
);

-- ==========================================
-- DOMINIO: CLIENTES
-- ==========================================
CREATE TABLE clientes (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(200) NOT NULL,
    rut            VARCHAR(20)  UNIQUE,
    tipo           ENUM('privado','publico') DEFAULT 'privado',
    industria      VARCHAR(100),
    email          VARCHAR(150),
    telefono       VARCHAR(30),
    pais           VARCHAR(100),
    ciudad         VARCHAR(100),
    propietario_id INT UNSIGNED,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (propietario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE contactos (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id  INT UNSIGNED NOT NULL,
    nombre      VARCHAR(150) NOT NULL,
    cargo       VARCHAR(100),
    email       VARCHAR(150),
    telefono    VARCHAR(30),
    es_primario BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- ==========================================
-- DOMINIO: PIPELINE (KANBAN)
-- ==========================================
CREATE TABLE pipeline_estados (
    id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre   VARCHAR(100) NOT NULL,
    orden    TINYINT UNSIGNED NOT NULL,
    color    CHAR(7)      DEFAULT '#6366f1',
    tipo     ENUM('activo','ganado','perdido') DEFAULT 'activo'
);

CREATE TABLE oportunidades (
    id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id             INT UNSIGNED NOT NULL,
    estado_id              INT UNSIGNED NOT NULL,
    responsable_id         INT UNSIGNED,
    titulo                 VARCHAR(300) NOT NULL,
    descripcion            TEXT,
    valor_estimado         DECIMAL(14,2),
    moneda                 CHAR(3)          DEFAULT 'CLP',
    -- Probabilidad: manual (usuario) vs IA
    probabilidad_manual    TINYINT UNSIGNED DEFAULT 50,
    probabilidad_ia        TINYINT UNSIGNED,           -- calculada por modelo
    -- Score de priorización compuesto
    score_prioridad        INT              DEFAULT 0,
    fecha_cierre           DATE,
    -- Integración con servicios externos (solo IDs, sin JOIN cross-DB)
    origen_id              INT UNSIGNED,               -- FK a origenes.id
    origen_ref_id          VARCHAR(100),               -- ID externo en Evaluador/BidFlow
    -- Propuesta principal seleccionada
    propuesta_principal_id INT UNSIGNED,
    motivo_perdida         TEXT,
    creado_en              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id)     REFERENCES clientes(id),
    FOREIGN KEY (estado_id)      REFERENCES pipeline_estados(id),
    FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (origen_id)      REFERENCES origenes(id)
    -- propuesta_principal_id FK se agrega después de crear propuestas
);

-- Historial de cambios de estado (pipeline tracking)
CREATE TABLE oportunidad_historial_estados (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    oportunidad_id  INT UNSIGNED NOT NULL,
    estado_anterior INT UNSIGNED,
    estado_nuevo    INT UNSIGNED NOT NULL,
    cambiado_por    INT UNSIGNED,
    cambiado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (oportunidad_id)  REFERENCES oportunidades(id) ON DELETE CASCADE,
    FOREIGN KEY (estado_anterior) REFERENCES pipeline_estados(id),
    FOREIGN KEY (estado_nuevo)    REFERENCES pipeline_estados(id),
    FOREIGN KEY (cambiado_por)    REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE actividades (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    oportunidad_id INT UNSIGNED NOT NULL,
    usuario_id     INT UNSIGNED NOT NULL,
    tipo           ENUM('nota','llamada','reunion','email','cambio_estado',
                        'propuesta_creada','factura_emitida','tarea') NOT NULL,
    contenido      TEXT,
    metadata       JSON,    -- datos extra: estado_anterior, estado_nuevo, etc.
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (oportunidad_id) REFERENCES oportunidades(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id)     REFERENCES usuarios(id)
);

-- ==========================================
-- DOMINIO: AI INSIGHTS (por oportunidad)
-- ==========================================
CREATE TABLE ai_insights (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    oportunidad_id      INT UNSIGNED NOT NULL,
    complejidad         TINYINT UNSIGNED,           -- 1-10
    probabilidad_exito  TINYINT UNSIGNED,           -- 0-100
    recomendacion       ENUM('go','no_go'),
    resumen             TEXT,
    riesgos             TEXT,
    fortalezas          TEXT,
    creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (oportunidad_id) REFERENCES oportunidades(id) ON DELETE CASCADE
);

-- ==========================================
-- DOMINIO: PROPUESTAS (referencia a BidFlow)
-- ==========================================
CREATE TABLE propuestas (
    id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    oportunidad_id        INT UNSIGNED NOT NULL,
    -- Versionado
    version               INT          DEFAULT 1,
    -- Contenido generado
    contenido             LONGTEXT,
    generado_por          ENUM('ia','manual') DEFAULT 'ia',
    -- Métricas de generación IA
    prompt                TEXT,
    tokens_usados         INT,
    tiempo_generacion_ms  INT,
    -- Referencia EXTERNA a BidFlow AI (no join, no FK cross-DB)
    bidflow_rfp_id        INT UNSIGNED,
    bidflow_url           VARCHAR(500),
    estado                ENUM('borrador','enviada','aceptada','rechazada') DEFAULT 'borrador',
    sincronizado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_en             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (oportunidad_id) REFERENCES oportunidades(id) ON DELETE CASCADE
);

-- FK diferida: propuesta_principal_id en oportunidades
ALTER TABLE oportunidades
    ADD CONSTRAINT fk_propuesta_principal
    FOREIGN KEY (propuesta_principal_id) REFERENCES propuestas(id) ON DELETE SET NULL;

-- ==========================================
-- DOMINIO: FACTURACIÓN
-- ==========================================
CREATE TABLE facturas (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id        INT UNSIGNED NOT NULL,
    oportunidad_id    INT UNSIGNED,
    creada_por_id     INT UNSIGNED NOT NULL,
    numero_factura    VARCHAR(50)  UNIQUE NOT NULL,
    estado            ENUM('borrador','emitida','pagada','vencida','anulada') DEFAULT 'borrador',
    subtotal          DECIMAL(14,2) NOT NULL DEFAULT 0,
    iva               DECIMAL(14,2)          DEFAULT 0,
    total             DECIMAL(14,2) NOT NULL DEFAULT 0,
    moneda            CHAR(3)       DEFAULT 'CLP',
    fecha_emision     DATE          NOT NULL,
    fecha_vencimiento DATE,
    fecha_pago        DATE NULL,
    pdf_url           VARCHAR(500),
    creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id)      REFERENCES clientes(id),
    FOREIGN KEY (oportunidad_id)  REFERENCES oportunidades(id) ON DELETE SET NULL,
    FOREIGN KEY (creada_por_id)   REFERENCES usuarios(id)
);

CREATE TABLE factura_items (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factura_id  INT UNSIGNED NOT NULL,
    descripcion VARCHAR(300) NOT NULL,
    cantidad    DECIMAL(10,2) DEFAULT 1,
    precio_unit DECIMAL(14,2) NOT NULL,
    total       DECIMAL(14,2) NOT NULL,
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
);

-- ==========================================
-- CACHÉ DE LICITACIONES (Evaluador → CRM)
-- Solo almacena referencias, datos viven en Evaluador
-- ==========================================
CREATE TABLE licitaciones_cache (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo_mp       VARCHAR(100)  NOT NULL UNIQUE,  -- ID Mercado Público
    titulo          VARCHAR(500),
    organismo       VARCHAR(300),
    monto_estimado  DECIMAL(14,2),
    fecha_cierre    DATE,
    datos_snapshot  JSON,           -- snapshot al momento de importar
    oportunidad_id  INT UNSIGNED NULL,
    importada_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (oportunidad_id) REFERENCES oportunidades(id) ON DELETE SET NULL
);

-- ==========================================
-- CONTROL DE INGRESOS MENSUALES
-- ==========================================
CREATE TABLE ingresos_mensuales (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    anio            YEAR         NOT NULL,
    mes             TINYINT      NOT NULL,
    ingresos_reales DECIMAL(14,2) DEFAULT 0,
    meta_ingresos   DECIMAL(14,2) DEFAULT 0,
    deals_ganados   INT          DEFAULT 0,
    calculado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_periodo (anio, mes)
);

-- ==========================================
-- ÍNDICES DE PERFORMANCE (CORE)
-- ==========================================
CREATE INDEX idx_oportunidades_estado      ON oportunidades(estado_id);
CREATE INDEX idx_oportunidades_cliente     ON oportunidades(cliente_id);
CREATE INDEX idx_oportunidades_responsable ON oportunidades(responsable_id);
CREATE INDEX idx_oportunidades_fecha_cierre ON oportunidades(fecha_cierre);

CREATE INDEX idx_actividades_oportunidad   ON actividades(oportunidad_id);
CREATE INDEX idx_propuestas_oportunidad    ON propuestas(oportunidad_id);
CREATE INDEX idx_ai_insights_oportunidad   ON ai_insights(oportunidad_id);
CREATE INDEX idx_historial_oportunidad     ON oportunidad_historial_estados(oportunidad_id);

-- ==========================================
-- ÍNDICES PARA ANALYTICS / PRIORIZACIÓN
-- ==========================================
CREATE INDEX idx_oportunidades_score          ON oportunidades(score_prioridad);
CREATE INDEX idx_oportunidades_probabilidad_ia ON oportunidades(probabilidad_ia);

-- ==========================================
-- 1. CONSISTENCIA DE VERSIONES EN PROPUESTAS
-- ==========================================
ALTER TABLE propuestas
    ADD CONSTRAINT uk_oportunidad_version
    UNIQUE (oportunidad_id, version);

-- ==========================================
-- 2. AI INSIGHTS VERSIONABLE
-- ==========================================
ALTER TABLE ai_insights
    ADD COLUMN version   INT     DEFAULT 1,
    ADD COLUMN es_actual BOOLEAN DEFAULT TRUE;

CREATE INDEX idx_ai_insights_actual
    ON ai_insights(oportunidad_id, es_actual);

-- ==========================================
-- 3. SOFT DELETE (TABLAS CRÍTICAS)
-- ==========================================
ALTER TABLE clientes       ADD COLUMN eliminado_en TIMESTAMP NULL;
ALTER TABLE oportunidades  ADD COLUMN eliminado_en TIMESTAMP NULL;
ALTER TABLE propuestas     ADD COLUMN eliminado_en TIMESTAMP NULL;

-- ==========================================
-- 4. TRIGGER: valida propuesta_principal
--    pertenezca a la oportunidad correcta
-- ==========================================
DELIMITER $$

CREATE TRIGGER trg_validar_propuesta_principal
BEFORE UPDATE ON oportunidades
FOR EACH ROW
BEGIN
    IF NEW.propuesta_principal_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM propuestas
            WHERE id             = NEW.propuesta_principal_id
              AND oportunidad_id = NEW.id
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La propuesta principal no pertenece a la oportunidad';
        END IF;
    END IF;
END$$

DELIMITER ;

-- ==========================================
-- 5. HISTÓRICO DE SCORES (nivel pro)
-- ==========================================
CREATE TABLE IF NOT EXISTS oportunidad_scores (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    oportunidad_id INT UNSIGNED NOT NULL,
    score          INT,
    fuente         ENUM('ia','regla','usuario'),
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (oportunidad_id) REFERENCES oportunidades(id) ON DELETE CASCADE
);
```

---

## 6. Configuración de Entornos

```bash
# === CRM Core (FastAPI) ===
CRM_DATABASE_URL=mysql+pymysql://crm_user:pass@localhost:3306/ingemedia_crm
# NOTA: Usuario CRM NO tiene acceso a bidflow_ai DB

JWT_SECRET=<256-bit-random>
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=8

# === BFF (FastAPI) ===
BFF_DATABASE_URL=      # solo para sesiones de caché breve (Redis opcional)
CRM_CORE_URL=https://crm-core.ingemedia.cl
EVALUADOR_URL=https://propuestas.ingemedia.cl
BIDFLOW_URL=https://bidapp.ingemedia.cl/api
BIDFLOW_WEBHOOK_SECRET=<secret>

# === Frontend (Next.js) ===
NEXTAUTH_URL=https://crm.ingemedia.cl
NEXTAUTH_SECRET=<secret>
BFF_URL=https://api.ingemedia.cl
```

---

## 7. Capa de Servicios del CRM Core

```
crm-core/                        ← Node.js + Express
├── src/
│   ├── domain/
│   │   ├── models/          ← entidades puras (sin ORM)
│   │   │   ├── cliente.js
│   │   │   ├── oportunidad.js
│   │   │   ├── propuesta.js
│   │   │   └── factura.js
│   │   └── rules/           ← reglas de negocio
│   │       ├── pipelineTransitions.js  ← estados válidos
│   │       └── facturaCalculator.js    ← IVA, totales, descuentos
│   ├── application/
│   │   └── useCases/        ← casos de uso (la lógica que importa)
│   │       ├── importarLicitacion.js
│   │       ├── crearOportunidad.js
│   │       ├── cambiarEstado.js
│   │       └── emitirFactura.js
│   ├── infrastructure/
│   │   ├── db/
│   │   │   └── repositories/  ← acceso a MySQL (mysql2)
│   │   └── clients/
│   │       ├── bidflowClient.js    ← HTTP calls a BidFlow (axios)
│   │       └── evaluadorClient.js  ← HTTP calls a Evaluador
│   └── api/
│       └── routes/          ← Express routers (solo delegan a useCases)
├── package.json
└── .env

---

frontend/                        ← Vite + React 18 + TypeScript
├── src/
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   ├── services/          ← llamadas al BFF
│   └── store/             ← Zustand (estado cliente)
├── vite.config.ts
├── package.json
└── dist/                ← build estático (sube a Hostinger)
```

---

## 8. Roadmap por Fases

| Fase | Contenido | Semanas |
|---|---|---|
| **0 — Setup** | Repos, DBs separadas, Vite+Node.js base, Hostinger config | 1 |
| **1 — Auth** | JWT nativo, middleware BFF, roles | 2 |
| **2 — CRM Core MVP** | Kanban, Clientes, Oportunidades, Actividades | 3 |
| **3 — Integraciones** | Evaluador bridge + BidFlow webhook | 1.5 |
| **4 — Facturación** | Facturas, PDF, ingresos mensuales | 2 |
| **5 — Stats** | Dashboard KPIs, reportes, filtros | 1.5 |
| **6 — QA + Deploy** | Tests, hardening, `vite build` → Hostinger FTP | 1 |
| **Total** | | **~12 semanas** |

---

## 9. Deploy en Hostinger

| Capa | Tipo Hosting | Cómo • ó |
|---|---|---|
| **Frontend (Vite)** | Hosting Compartido | `npm run build` → sube `dist/` vía FTP/File Manager |
| **BFF + CRM Core** | VPS Hostinger | Node.js + PM2; proxy Nginx en puerto 80/443 |
| **Evaluador** | VPS Hostinger | Mismo VPS, puerto diferente, PM2 |
| **MySQL** | VPS Hostinger | MySQL 8 local en el VPS |

> **Dominio:** `crm.ingemedia.cl` → CNAME → Hostinger  
> **SSL:** Let’s Encrypt gratis (Certbot en VPS)  
> **Variables de entorno:** `.env` en el VPS, nunca en el repo
