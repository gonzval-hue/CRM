const db = require('../config/database');

class Deal {
  // Get all deals with optional filtering
  static async findAll(filters = {}) {
    const { owner_id, stage, company_id, contact_id, search, limit = 100, offset = 0 } = filters;
    let sql = `
      SELECT d.id, d.title, d.description, d.amount, d.currency, d.stage, d.probability,
             DATE_FORMAT(d.expected_close_date, '%Y-%m-%d') as expected_close_date,
             d.contact_id, d.company_id, d.owner_id, d.created_at, d.updated_at,
             CONCAT(c.first_name, ' ', c.last_name) as contact_name, 
             co.name as company_name
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN companies co ON d.company_id = co.id
      WHERE 1=1
    `;
    const params = [];

    if (owner_id) {
      sql += ' AND d.owner_id = ?';
      params.push(owner_id);
    }

    if (stage) {
      sql += ' AND d.stage = ?';
      params.push(stage);
    }

    if (company_id) {
      sql += ' AND d.company_id = ?';
      params.push(company_id);
    }

    if (contact_id) {
      sql += ' AND d.contact_id = ?';
      params.push(contact_id);
    }

    if (search) {
      sql += ' AND (d.title LIKE ? OR d.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await db.query(sql, params);
  }

  // Get deal by ID
  static async findById(id) {
    const sql = `
      SELECT d.id, d.title, d.description, d.amount, d.currency, d.stage, d.probability,
             DATE_FORMAT(d.expected_close_date, '%Y-%m-%d') as expected_close_date,
             d.contact_id, d.company_id, d.owner_id, d.created_at, d.updated_at,
             CONCAT(c.first_name, ' ', c.last_name) as contact_name, c.email as contact_email,
             co.name as company_name
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN companies co ON d.company_id = co.id
      WHERE d.id = ?
    `;
    const results = await db.query(sql, [id]);
    return results[0] || null;
  }

  // Create new deal
  static async create(data) {
    const {
      title, description, amount, currency, stage, probability,
      expected_close_date, contact_id, company_id, owner_id
    } = data;

    const sql = `
      INSERT INTO deals 
      (title, description, amount, currency, stage, probability,
       expected_close_date, contact_id, company_id, owner_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query(sql, [
      title, description, amount || 0, currency || 'USD',
      stage || 'prospecting', probability || 0,
      expected_close_date, contact_id, company_id, owner_id
    ]);

    return { id: result.insertId, ...data };
  }

  static ALLOWED_FIELDS = [
    'title', 'description', 'amount', 'currency', 'stage',
    'probability', 'expected_close_date', 'contact_id', 'company_id', 'owner_id'
  ];

  // Update deal
  static async update(id, data) {
    const fields = [];
    const values = [];

    for (let [key, value] of Object.entries(data)) {
      if (this.ALLOWED_FIELDS.includes(key)) {
        // Convert empty strings to null
        if (value === '') value = null;
        
        // Normalize date format (remove time if present for DATE column)
        if (key === 'expected_close_date' && value && typeof value === 'string') {
          value = value.split(/[T ]/)[0];
        }

        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `UPDATE deals SET ${fields.join(', ')} WHERE id = ?`;
    await db.query(sql, values);

    return await this.findById(id);
  }

  // Delete deal
  static async delete(id) {
    await db.query('DELETE FROM deals WHERE id = ?', [id]);
    return true;
  }

  // Get deals by stage (for pipeline view)
  static async findByStage(stage) {
    const sql = `
      SELECT d.id, d.title, d.description, d.amount, d.currency, d.stage, d.probability,
             DATE_FORMAT(d.expected_close_date, '%Y-%m-%d') as expected_close_date,
             d.contact_id, d.company_id, d.owner_id, d.created_at, d.updated_at,
             CONCAT(c.first_name, ' ', c.last_name) as contact_name, 
             co.name as company_name
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN companies co ON d.company_id = co.id
      WHERE d.stage = ?
      ORDER BY d.created_at DESC
    `;
    return await db.query(sql, [stage]);
  }

  // Get pipeline summary
  static async getPipelineSummary() {
    const sql = `
      SELECT stage, 
             COUNT(*) as count, 
             SUM(amount) as total_amount,
             AVG(amount) as avg_amount
      FROM deals
      WHERE stage NOT IN ('closed_won', 'closed_lost')
      GROUP BY stage
      ORDER BY FIELD(stage, 'prospecting', 'qualification', 'proposal', 'negotiation')
    `;
    return await db.query(sql);
  }
}

module.exports = Deal;
