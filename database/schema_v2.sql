-- ============================================
-- Tags/Labels System
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Entity Tags (Many-to-Many for contacts and companies)
-- ============================================
CREATE TABLE IF NOT EXISTS entity_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('contact', 'company', 'deal') NOT NULL,
  entity_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_entity_tag (entity_type, entity_id, tag_id),
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Notes System
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content TEXT NOT NULL,
  entity_type ENUM('contact', 'company', 'deal') NOT NULL,
  entity_id INT NOT NULL,
  owner_id INT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Email Templates
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  category ENUM('general', 'follow_up', 'proposal', 'welcome', 'other') DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  owner_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Audit Log
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action ENUM('create', 'update', 'delete', 'view', 'export', 'import') NOT NULL,
  entity_type ENUM('contact', 'company', 'deal', 'activity', 'note', 'tag') NOT NULL,
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert default tags
-- ============================================
INSERT INTO tags (name, color) VALUES
('VIP', '#EF4444'),
('Lead Caliente', '#F59E0B'),
('Cliente', '#10B981'),
('Prospecto', '#3B82F6'),
('Seguimiento', '#8B5CF6'),
('Inactivo', '#6B7280');

-- ============================================
-- Insert default email templates
-- ============================================
INSERT INTO email_templates (name, subject, body, category) VALUES
('Primer Contacto', 'Bienvenido a Ingemedia - {{contact.first_name}}', 
 'Hola {{contact.first_name}},\n\nGracias por contactarnos. Nos gustaría agendar una reunión para conocer más sobre tus necesidades.\n\nSaludos,\nEquipo Ingemedia', 'welcome'),
('Seguimiento', 'Seguimiento - {{contact.first_name}}', 
 'Hola {{contact.first_name}},\n\nEspero que estés bien. Quería hacer seguimiento a nuestra última conversación.\n\n¿Tienes disponibilidad esta semana?\n\nSaludos', 'follow_up'),
('Propuesta Comercial', 'Propuesta - {{deal.title}}', 
 'Estimado/a {{contact.first_name}},\n\nAdjunto encontrarás nuestra propuesta comercial para {{deal.title}}.\n\nQuedo a tu disposición para cualquier consulta.\n\nSaludos', 'proposal');
