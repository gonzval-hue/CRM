const db = require('../config/database');

class Activity {
  // Get all activities with optional filtering
  static async findAll(filters = {}) {
    const { owner_id, type, status, contact_id, company_id, deal_id, limit = 100, offset = 0 } = filters;
    let sql = `
      SELECT a.*, 
             CONCAT(c.first_name, ' ', c.last_name) as contact_name,
             co.name as company_name,
             d.title as deal_title
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN companies co ON a.company_id = co.id
      LEFT JOIN deals d ON a.deal_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (owner_id) {
      sql += ' AND a.owner_id = ?';
      params.push(owner_id);
    }

    if (type) {
      sql += ' AND a.type = ?';
      params.push(type);
    }

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (contact_id) {
      sql += ' AND a.contact_id = ?';
      params.push(contact_id);
    }

    if (company_id) {
      sql += ' AND a.company_id = ?';
      params.push(company_id);
    }

    if (deal_id) {
      sql += ' AND a.deal_id = ?';
      params.push(deal_id);
    }

    sql += ' ORDER BY a.due_date DESC, a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await db.query(sql, params);
  }

  // Get activity by ID
  static async findById(id) {
    const sql = `
      SELECT a.*, 
             CONCAT(c.first_name, ' ', c.last_name) as contact_name,
             co.name as company_name,
             d.title as deal_title
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN companies co ON a.company_id = co.id
      LEFT JOIN deals d ON a.deal_id = d.id
      WHERE a.id = ?
    `;
    const results = await db.query(sql, [id]);
    return results[0] || null;
  }

  // Create new activity
  static async create(data) {
    const {
      type, subject, description, status, contact_id, company_id, deal_id, owner_id
    } = data;
    let { due_date } = data;

    if (due_date && typeof due_date === 'string') {
      due_date = due_date.replace('T', ' ');
    }

    const sql = `
      INSERT INTO activities 
      (type, subject, description, status, due_date,
       contact_id, company_id, deal_id, owner_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query(sql, [
      type, subject, description, status || 'scheduled',
      due_date, contact_id, company_id, deal_id, owner_id
    ]);

    return { id: result.insertId, ...data };
  }

  static ALLOWED_FIELDS = [
    'type', 'subject', 'description', 'status', 'due_date',
    'contact_id', 'company_id', 'deal_id', 'owner_id'
  ];

  // Update activity
  static async update(id, data) {
    const fields = [];
    const values = [];

    for (let [key, value] of Object.entries(data)) {
      if (this.ALLOWED_FIELDS.includes(key)) {
        // Convert empty strings to null
        if (value === '') value = null;
        
        if (key === 'due_date' && value && typeof value === 'string') {
          value = value.replace('T', ' ');
        }
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `UPDATE activities SET ${fields.join(', ')} WHERE id = ?`;
    await db.query(sql, values);

    return await this.findById(id);
  }

  // Delete activity
  static async delete(id) {
    await db.query('DELETE FROM activities WHERE id = ?', [id]);
    return true;
  }

  // Mark activity as completed
  static async complete(id) {
    const sql = `
      UPDATE activities 
      SET status = 'completed', completed_at = NOW() 
      WHERE id = ?
    `;
    await db.query(sql, [id]);
    return await this.findById(id);
  }

  // Get upcoming activities
  static async getUpcoming(ownerId, limit = 10) {
    const sql = `
      SELECT a.*, 
             CONCAT(c.first_name, ' ', c.last_name) as contact_name,
             co.name as company_name
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN companies co ON a.company_id = co.id
      WHERE a.owner_id = ? 
        AND a.status = 'scheduled'
        AND a.due_date >= NOW()
      ORDER BY a.due_date ASC
      LIMIT ?
    `;
    return await db.query(sql, [ownerId, limit]);
  }
}

module.exports = Activity;
