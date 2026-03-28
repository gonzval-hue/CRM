# BidFlow AI CRM

CRM con capacidades AI para gestión de clientes y ventas.

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MariaDB (`crm_ingemedia`)
- **Hosting**: hPanel (shared hosting con Node.js)

## Estructura del Proyecto

```
CRM/
├── src/
│   ├── config/         # Configuración (database, etc.)
│   ├── controllers/    # Lógica de negocio
│   ├── middleware/     # Middleware (error handler, auth, etc.)
│   ├── models/         # Modelos de datos
│   ├── routes/         # Rutas API
│   ├── utils/          # Utilidades (logger, etc.)
│   └── index.js        # Entry point
├── database/           # Scripts SQL
├── logs/               # Logs de la aplicación
├── .env                # Variables de entorno (no commitear)
├── .env.example        # Ejemplo de variables
├── .gitignore
└── package.json
```

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de entorno (ya está configurado)
# .env tiene DB_NAME=crm_ingemedia
```

## Desarrollo

```bash
# Iniciar en modo desarrollo (con nodemon)
npm run dev

# Iniciar en modo producción
npm start
```

## Base de Datos

El schema está en `database/schema.sql`. Para actualizar con características adicionales:

```bash
# Ejecutar en MariaDB
mysql -u root -p < database/schema.sql
mysql -u root -p < database/schema_v2.sql
```

## API Endpoints

### Health Check
- `GET /health` - Verificar estado del servidor

### CRM Core
- `GET/POST /api/companies` - Gestión de empresas
- `GET/POST /api/contacts` - Gestión de contactos
- `GET/POST /api/deals` - Gestión de oportunidades
- `GET/POST /api/activities` - Gestión de actividades

### Dashboard
- `GET /api/dashboard/metrics` - Métricas del dashboard
- `GET /api/dashboard/contacts/status` - Contactos por estado
- `GET /api/dashboard/deals/summary` - Resumen de deals

### Tags
- `GET/POST /api/tags` - Gestión de etiquetas
- `GET /api/tags/entity/:type/:id` - Tags de una entidad
- `POST /api/tags/entity/:type/:id/add` - Agregar tag
- `POST /api/tags/entity/:type/:id/sync` - Sincronizar tags

### Notes
- `GET/POST /api/notes` - Gestión de notas
- `GET /api/notes/entity/:type/:id` - Notas de una entidad
- `POST /api/notes/:id/toggle-pin` - Fijar nota

### Email Templates
- `GET/POST /api/email-templates` - Plantillas de email
- `GET /api/email-templates/category/:category` - Por categoría

### Export/Import
- `GET /api/export/contacts` - Exportar contactos (CSV)
- `GET /api/export/companies` - Exportar empresas (CSV)
- `GET /api/export/deals` - Exportar deals (CSV)
- `POST /api/import/contacts` - Importar contactos (CSV)

## Variables de Entorno

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=crm_ingemedia
```

## Próximos Pasos

1. **Frontend Dashboard** - React + Bootstrap
2. **AI Integration** - Lead scoring, email drafting
3. **Authentication** - JWT + RBAC (antes de producción)
4. **Deploy** - hPanel
