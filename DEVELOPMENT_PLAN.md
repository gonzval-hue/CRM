# Development Plan - BidFlow AI CRM

## Infrastructure

- **Database**: `crm_ingemedia` (MariaDB) - Local development
- **Hosting**: hPanel (shared hosting con Node.js)
- **Architecture**: Full-stack CRM con capacidades AI

---

## Development Phases

### ✅ Paso 1: Project Setup & Foundation (COMPLETADO)
- [x] Initialize Node.js project with Express.js
- [x] Configure MariaDB connection
- [x] Set up project structure (MVC pattern)
- [x] Configure environment variables
- [x] Set up logging and error handling

### ✅ Paso 2: CRM Core (COMPLETADO)
- [x] Database schema (`crm_ingemedia`)
- [x] Contact management (CRUD)
- [x] Company management (CRUD)
- [x] Deal/Pipeline management
- [x] Activity tracking
- [x] REST API endpoints
- [x] Search and filtering

### ✅ Paso 3: Additional Features (COMPLETADO)
- [x] Dashboard metrics (`GET /api/dashboard/metrics`)
- [x] Tags/Labels system
- [x] Notes system
- [x] Email templates
- [x] CSV import/export

### ⏳ Paso 4: Frontend Dashboard (PENDIENTE)
- [ ] React + Bootstrap/Material Design
- [ ] Dashboard con métricas
- [ ] Contact management UI
- [ ] Company management UI
- [ ] Pipeline Kanban board
- [ ] Activity timeline

### ⏳ Paso 5: AI Integration (PENDIENTE)
- [ ] Lead scoring con AI
- [ ] Email drafting assistance
- [ ] Deal insights
- [ ] Natural language search

### ⏳ Paso 6: Authentication (MOVIDO AL FINAL) (PENDIENTE)
- [ ] User registration/login
- [ ] JWT authentication
- [ ] Role-based access control (RBAC)
- [ ] Protected routes

### ⏳ Paso 7: Testing & Deployment (PENDIENTE)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Deploy a hPanel
- [ ] Production configuration

---

## API Endpoints Disponibles

### CRM Core
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/companies` | Listar empresas |
| GET | `/api/companies/:id` | Obtener empresa |
| POST | `/api/companies` | Crear empresa |
| PUT | `/api/companies/:id` | Actualizar empresa |
| DELETE | `/api/companies/:id` | Eliminar empresa |
| GET | `/api/contacts` | Listar contactos |
| GET | `/api/contacts/:id` | Obtener contacto |
| POST | `/api/contacts` | Crear contacto |
| PUT | `/api/contacts/:id` | Actualizar contacto |
| DELETE | `/api/contacts/:id` | Eliminar contacto |
| GET | `/api/deals` | Listar oportunidades |
| GET | `/api/deals/stage/:stage` | Deals por etapa |
| GET | `/api/deals/pipeline/summary` | Resumen pipeline |
| GET | `/api/activities` | Listar actividades |
| POST | `/api/activities/:id/complete` | Completar actividad |

### Dashboard
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard/metrics` | Métricas del dashboard |
| GET | `/api/dashboard/contacts/status` | Contactos por estado |
| GET | `/api/dashboard/deals/summary` | Resumen deals won/lost |

### Tags
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tags` | Listar tags |
| POST | `/api/tags` | Crear tag |
| GET | `/api/tags/entity/:entityType/:entityId` | Tags de una entidad |
| POST | `/api/tags/entity/:entityType/:entityId/add` | Agregar tag |
| POST | `/api/tags/entity/:entityType/:entityId/sync` | Sincronizar tags |

### Notes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/notes` | Listar notas |
| POST | `/api/notes` | Crear nota |
| GET | `/api/notes/entity/:entityType/:entityId` | Notas de entidad |
| POST | `/api/notes/:id/toggle-pin` | Fijar nota |

### Email Templates
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/email-templates` | Listar plantillas |
| POST | `/api/email-templates` | Crear plantilla |
| GET | `/api/email-templates/category/:category` | Por categoría |

### Export/Import
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/export/contacts` | Exportar contactos CSV |
| GET | `/api/export/companies` | Exportar empresas CSV |
| GET | `/api/export/deals` | Exportar deals CSV |
| POST | `/api/import/contacts` | Importar contactos CSV |

---

## Tech Stack

| Capa | Tecnología |
|------|------------|
| Backend | Node.js + Express.js |
| Database | MariaDB |
| Frontend | React + Bootstrap (pendiente) |
| Auth | JWT (pendiente) |
| Hosting | hPanel |

---

## Notas

- Autenticación movida al final (Paso 6)
- CRM funcional sin auth para desarrollo rápido
- Agregar auth antes de producción
