const fs = require('fs');
const path = require('path');
const db = require('../config/database');

class ExportImport {
  // Export contacts to CSV
  static async exportContacts(filters = {}) {
    const { owner_id, status, lead_source } = filters;
    let sql = `
      SELECT c.first_name, c.last_name, c.email, c.phone, c.mobile, 
             c.position, c.lead_source, c.status, c.notes,
             co.name as company_name
      FROM contacts c
      LEFT JOIN companies co ON c.company_id = co.id
      WHERE 1=1
    `;
    const params = [];

    if (owner_id) {
      sql += ' AND c.owner_id = ?';
      params.push(owner_id);
    }
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    if (lead_source) {
      sql += ' AND c.lead_source = ?';
      params.push(lead_source);
    }

    sql += ' ORDER BY c.created_at DESC';

    const contacts = await db.query(sql, params);
    
    // Convert to CSV
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Mobile', 'Position', 'Lead Source', 'Status', 'Notes', 'Company'];
    const rows = contacts.map(c => [
      c.first_name, c.last_name, c.email, c.phone, c.mobile, c.position, c.lead_source, c.status, c.notes || '', c.company_name || ''
    ]);

    return this.convertToCSV(headers, rows);
  }

  // Export companies to CSV
  static async exportCompanies(filters = {}) {
    const { owner_id } = filters;
    let sql = 'SELECT * FROM companies WHERE 1=1';
    const params = [];

    if (owner_id) {
      sql += ' AND owner_id = ?';
      params.push(owner_id);
    }

    sql += ' ORDER BY created_at DESC';

    const companies = await db.query(sql, params);
    
    const headers = ['ID', 'Name', 'Industry', 'Website', 'Phone', 'Email', 'Address', 'City', 'Country'];
    const rows = companies.map(c => [c.id, c.name, c.industry, c.website, c.phone, c.email, c.address, c.city, c.country]);

    return this.convertToCSV(headers, rows);
  }

  // Export deals to CSV
  static async exportDeals(filters = {}) {
    const { owner_id, stage } = filters;
    let sql = `
      SELECT d.title, d.description, d.amount, d.currency, d.stage, 
             d.probability, d.expected_close_date,
             c.first_name, c.last_name,
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

    sql += ' ORDER BY d.created_at DESC';

    const deals = await db.query(sql, params);
    
    const headers = ['Title', 'Description', 'Amount', 'Currency', 'Stage', 'Probability', 'Close Date', 'Contact', 'Company'];
    const rows = deals.map(d => [d.title, d.description, d.amount, d.currency, d.stage, d.probability, d.expected_close_date, `${d.first_name} ${d.last_name}`, d.company_name]);

    return this.convertToCSV(headers, rows);
  }

  // Import contacts from CSV
  static async importContacts(csvData, ownerId) {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have headers and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const requiredFields = ['first_name', 'last_name'];
    
    for (const field of requiredFields) {
      if (!headers.includes(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const inserted = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        const data = {};
        
        headers.forEach((header, index) => {
          data[header] = values[index] || null;
        });

        const sql = `
          INSERT INTO contacts 
          (first_name, last_name, email, phone, mobile, position, company_id, owner_id, lead_source, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(sql, [
          data.first_name,
          data.last_name,
          data.email || null,
          data.phone || null,
          data.mobile || null,
          data.position || null,
          data.company_id || null,
          ownerId,
          data.lead_source || 'other',
          data.status || 'new',
          data.notes || null
        ]);

        inserted.push({ row: i + 1, data });
      } catch (error) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    return { inserted: inserted.length, errors };
  }

  // Helper: Convert array to CSV string
  static convertToCSV(headers, rows) {
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerRow = headers.map(escapeCSV).join(',');
    const dataRows = rows.map(row => row.map(escapeCSV).join(','));
    
    return [headerRow, ...dataRows].join('\n');
  }

  // Helper: Parse CSV line handling quoted values
  static parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
}

module.exports = ExportImport;
