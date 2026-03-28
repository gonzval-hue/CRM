const db = require('../config/database');

class Note {
  // Get all notes with filtering
  static async findAll(filters = {}) {
    const { entity_type, entity_id, owner_id, limit = 100, offset = 0 } = filters;
    let sql = 'SELECT n.*, u.name as author_name FROM notes n LEFT JOIN users u ON n.owner_id = u.id WHERE 1=1';
    const params = [];

    if (entity_type) {
      sql += ' AND n.entity_type = ?';
      params.push(entity_type);
    }

    if (entity_id) {
      sql += ' AND n.entity_id = ?';
      params.push(entity_id);
    }

    if (owner_id) {
      sql += ' AND n.owner_id = ?';
      params.push(owner_id);
    }

    sql += ' ORDER BY n.is_pinned DESC, n.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await db.query(sql, params);
  }

  // Get note by ID
  static async findById(id) {
    const sql = 'SELECT n.*, u.name as author_name FROM notes n LEFT JOIN users u ON n.owner_id = u.id WHERE n.id = ?';
    const results = await db.query(sql, [id]);
    return results[0] || null;
  }

  // Create new note
  static async create(data) {
    const { content, entity_type, entity_id, owner_id, is_pinned } = data;
    const sql = 'INSERT INTO notes (content, entity_type, entity_id, owner_id, is_pinned) VALUES (?, ?, ?, ?, ?)';
    const result = await db.query(sql, [content, entity_type, entity_id, owner_id, is_pinned || false]);
    return { id: result.insertId, ...data };
  }

  // Update note
  static async update(id, data) {
    const { content, is_pinned } = data;
    const sql = 'UPDATE notes SET content = ?, is_pinned = ? WHERE id = ?';
    await db.query(sql, [content, is_pinned, id]);
    return await this.findById(id);
  }

  // Delete note
  static async delete(id) {
    await db.query('DELETE FROM notes WHERE id = ?', [id]);
    return true;
  }

  // Get notes by entity
  static async findByEntity(entityType, entityId) {
    const sql = `
      SELECT n.*, u.name as author_name 
      FROM notes n 
      LEFT JOIN users u ON n.owner_id = u.id 
      WHERE n.entity_type = ? AND n.entity_id = ?
      ORDER BY n.is_pinned DESC, n.created_at DESC
    `;
    return await db.query(sql, [entityType, entityId]);
  }

  // Toggle pin status
  static async togglePin(id) {
    const sql = 'UPDATE notes SET is_pinned = NOT is_pinned WHERE id = ?';
    await db.query(sql, [id]);
    return await this.findById(id);
  }
}

module.exports = Note;
