const db = require('../config/database');

class Contact {
  // Get all contacts with optional filtering
  static async findAll(filters = {}) {
    const { owner_id, company_id, status, lead_source, search, limit = 100, offset = 0 } = filters;
    let sql = `
      SELECT c.*, co.name as company_name 
      FROM contacts c 
      LEFT JOIN companies co ON c.company_id = co.id 
      WHERE 1=1
    `;
    const params = [];

    if (owner_id) {
      sql += ' AND c.owner_id = ?';
      params.push(owner_id);
    }

    if (company_id) {
      sql += ' AND c.company_id = ?';
      params.push(company_id);
    }

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    if (lead_source) {
      sql += ' AND c.lead_source = ?';
      params.push(lead_source);
    }

    if (search) {
      sql += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await db.query(sql, params);
  }

  // Get contact by ID
  static async findById(id) {
    const sql = `
      SELECT c.*, co.name as company_name, co.email as company_email
      FROM contacts c 
      LEFT JOIN companies co ON c.company_id = co.id 
      WHERE c.id = ?
    `;
    const results = await db.query(sql, [id]);
    return results[0] || null;
  }

  // Create new contact
  static async create(data) {
    const {
      first_name, last_name, email, phone, mobile, position,
      company_id, owner_id, lead_source, status, notes
    } = data;

    const sql = `
      INSERT INTO contacts 
      (first_name, last_name, email, phone, mobile, position, 
       company_id, owner_id, lead_source, status, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query(sql, [
      first_name, last_name, email, phone, mobile, position,
      company_id, owner_id, lead_source || 'other', status || 'new', notes
    ]);

    return { id: result.insertId, ...data };
  }

  static ALLOWED_FIELDS = [
    'first_name', 'last_name', 'email', 'phone', 'mobile',
    'position', 'company_id', 'owner_id', 'lead_source', 'status', 'notes'
  ];

  // Update contact
  static async update(id, data) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (this.ALLOWED_FIELDS.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`;
    await db.query(sql, values);

    return await this.findById(id);
  }

  // Delete contact
  static async delete(id) {
    await db.query('DELETE FROM contacts WHERE id = ?', [id]);
    return true;
  }

  // Get contacts by company
  static async findByCompanyId(companyId) {
    const sql = 'SELECT * FROM contacts WHERE company_id = ? ORDER BY last_name, first_name';
    return await db.query(sql, [companyId]);
  }
}

module.exports = Contact;
