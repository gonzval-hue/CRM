const db = require('../config/database');

class Company {
  // Get all companies with optional filtering
  static async findAll(filters = {}) {
    const { owner_id, search, limit = 100, offset = 0 } = filters;
    let sql = 'SELECT * FROM companies WHERE 1=1';
    const params = [];

    if (owner_id) {
      sql += ' AND owner_id = ?';
      params.push(owner_id);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR industry LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await db.query(sql, params);
  }

  // Get company by ID
  static async findById(id) {
    const results = await db.query('SELECT * FROM companies WHERE id = ?', [id]);
    return results[0] || null;
  }

  // Create new company
  static async create(data) {
    const {
      name, industry, website, phone, email, address, city, country, owner_id
    } = data;

    const sql = `
      INSERT INTO companies 
      (name, industry, website, phone, email, address, city, country, owner_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query(sql, [
      name, industry, website, phone, email, address, city, country, owner_id
    ]);

    return { id: result.insertId, ...data };
  }

  static ALLOWED_FIELDS = [
    'name', 'industry', 'website', 'phone', 'email', 
    'address', 'city', 'country', 'owner_id'
  ];

  // Update company
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
    const sql = `UPDATE companies SET ${fields.join(', ')} WHERE id = ?`;
    await db.query(sql, values);

    return await this.findById(id);
  }

  // Delete company
  static async delete(id) {
    await db.query('DELETE FROM companies WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Company;
