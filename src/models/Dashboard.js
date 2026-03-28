const db = require('../config/database');

class Dashboard {
  // Get dashboard metrics
  static async getMetrics(filters = {}) {
    const { owner_id } = filters;
    const ownerFilter = owner_id ? 'AND owner_id = ?' : '';
    const params = owner_id ? [owner_id] : [];

    // Total counts
    const [contactsResult, companiesResult, dealsResult, activitiesResult] = await Promise.all([
      db.query(`SELECT COUNT(*) as total FROM contacts WHERE 1=1 ${ownerFilter}`, params),
      db.query(`SELECT COUNT(*) as total FROM companies WHERE 1=1 ${ownerFilter}`, params),
      db.query(`SELECT COUNT(*) as total FROM deals WHERE stage NOT IN ('closed_won', 'closed_lost') ${ownerFilter}`, params),
      db.query(`SELECT COUNT(*) as total FROM activities WHERE status = 'scheduled' ${ownerFilter}`, params),
    ]);

    // Deals by stage
    const dealsByStage = await db.query(`
      SELECT stage, COUNT(*) as count, SUM(amount) as total_amount
      FROM deals
      WHERE 1=1 ${ownerFilter}
      GROUP BY stage
      ORDER BY FIELD(stage, 'prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')
    `, params);

    // Recent activities
    const recentActivities = await db.query(`
      SELECT a.*, c.first_name, c.last_name, co.name as company_name
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN companies co ON a.company_id = co.id
      WHERE 1=1 ${ownerFilter}
      ORDER BY a.created_at DESC
      LIMIT 10
    `, params);

    // Top deals (by amount)
    const topDeals = await db.query(`
      SELECT d.*, c.first_name, c.last_name, co.name as company_name
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN companies co ON d.company_id = co.id
      WHERE d.stage NOT IN ('closed_won', 'closed_lost') ${ownerFilter}
      ORDER BY d.amount DESC
      LIMIT 5
    `, params);

    // Monthly trend (new contacts)
    const monthlyTrend = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM contacts
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);

    return {
      summary: {
        contacts: contactsResult[0]?.total || 0,
        companies: companiesResult[0]?.total || 0,
        activeDeals: dealsResult[0]?.total || 0,
        pendingActivities: activitiesResult[0]?.total || 0,
      },
      dealsByStage,
      recentActivities,
      topDeals,
      monthlyTrend,
    };
  }

  // Get contacts by status distribution
  static async getContactsByStatus() {
    const result = await db.query(`
      SELECT status, COUNT(*) as count
      FROM contacts
      GROUP BY status
      ORDER BY FIELD(status, 'new', 'contacted', 'qualified', 'unqualified', 'converted')
    `);
    return result;
  }

  // Get deals won/lost summary
  static async getDealsSummary() {
    const result = await db.query(`
      SELECT 
        stage,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM deals
      WHERE stage IN ('closed_won', 'closed_lost')
      GROUP BY stage
    `);
    return result;
  }
}

module.exports = Dashboard;
