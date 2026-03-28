const db = require('../config/database');

class EmailTemplate {
  // Get all templates
  static async findAll(filters = {}) {
    const { category, is_active, owner_id } = filters;
    let sql = 'SELECT * FROM email_templates WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(is_active);
    }

    if (owner_id) {
      sql += ' AND (owner_id = ? OR owner_id IS NULL)';
      params.push(owner_id);
    }

    sql += ' ORDER BY category, name';
    params.push();

    return await db.query(sql, params);
  }

  // Get template by ID
  static async findById(id) {
    const results = await db.query('SELECT * FROM email_templates WHERE id = ?', [id]);
    return results[0] || null;
  }

  // Create new template
  static async create(data) {
    const { name, subject, body, category, owner_id } = data;
    const sql = 'INSERT INTO email_templates (name, subject, body, category, owner_id) VALUES (?, ?, ?, ?, ?)';
    const result = await db.query(sql, [name, subject, body, category || 'general', owner_id]);
    return { id: result.insertId, ...data };
  }

  // Update template
  static async update(id, data) {
    const { name, subject, body, category, is_active } = data;
    const sql = 'UPDATE email_templates SET name = ?, subject = ?, body = ?, category = ?, is_active = ? WHERE id = ?';
    await db.query(sql, [name, subject, body, category, is_active !== undefined ? is_active : true, id]);
    return await this.findById(id);
  }

  // Delete template
  static async delete(id) {
    await db.query('DELETE FROM email_templates WHERE id = ?', [id]);
    return true;
  }

  // Get templates by category
  static async findByCategory(category) {
    const sql = 'SELECT * FROM email_templates WHERE category = ? AND is_active = TRUE ORDER BY name';
    return await db.query(sql, [category]);
  }
}

module.exports = EmailTemplate;
