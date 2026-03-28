const db = require('../config/database');

class Tag {
  // Get all tags
  static async findAll() {
    return await db.query('SELECT * FROM tags ORDER BY name');
  }

  // Get tag by ID
  static async findById(id) {
    const results = await db.query('SELECT * FROM tags WHERE id = ?', [id]);
    return results[0] || null;
  }

  // Create new tag
  static async create(data) {
    const { name, color } = data;
    const sql = 'INSERT INTO tags (name, color) VALUES (?, ?)';
    const result = await db.query(sql, [name, color || '#6B7280']);
    return { id: result.insertId, ...data };
  }

  // Update tag
  static async update(id, data) {
    const { name, color } = data;
    const sql = 'UPDATE tags SET name = ?, color = ? WHERE id = ?';
    await db.query(sql, [name, color, id]);
    return await this.findById(id);
  }

  // Delete tag
  static async delete(id) {
    await db.query('DELETE FROM tags WHERE id = ?', [id]);
    return true;
  }

  // Get tags by entity
  static async findByEntity(entityType, entityId) {
    const sql = `
      SELECT t.* FROM tags t
      INNER JOIN entity_tags et ON t.id = et.tag_id
      WHERE et.entity_type = ? AND et.entity_id = ?
    `;
    return await db.query(sql, [entityType, entityId]);
  }

  // Add tag to entity
  static async addToEntity(entityType, entityId, tagId) {
    const sql = 'INSERT INTO entity_tags (entity_type, entity_id, tag_id) VALUES (?, ?, ?)';
    await db.query(sql, [entityType, entityId, tagId]);
    return true;
  }

  // Remove tag from entity
  static async removeFromEntity(entityType, entityId, tagId) {
    const sql = 'DELETE FROM entity_tags WHERE entity_type = ? AND entity_id = ? AND tag_id = ?';
    await db.query(sql, [entityType, entityId, tagId]);
    return true;
  }

  // Sync tags for entity (remove all and add new ones)
  static async syncForEntity(entityType, entityId, tagIds) {
    // Remove existing tags
    await db.query('DELETE FROM entity_tags WHERE entity_type = ? AND entity_id = ?', [entityType, entityId]);
    
    // Add new tags
    if (tagIds && tagIds.length > 0) {
      const values = tagIds.map(id => [entityType, entityId, id]);
      const sql = 'INSERT INTO entity_tags (entity_type, entity_id, tag_id) VALUES ?';
      await db.query(sql, [values]);
    }
    
    return true;
  }
}

module.exports = Tag;
