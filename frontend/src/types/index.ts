export interface Company {
  id: number;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  owner_id?: number;
  created_at?: string;
}

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  company_id?: number;
  company_name?: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
}

export interface Deal {
  id: number;
  title: string;
  amount: number;
  business_model: 'project' | 'service';
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'shelved';
  probability: number;
  company_id?: number;
  contact_id?: number;
  company_name?: string;
  contact_name?: string;
  description?: string;
  expected_close_date?: string;
  created_at?: string;
}

export interface Activity {
  id: number;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  due_date: string;
  contact_id?: number;
  company_id?: number;
  deal_id?: number;
  contact_name?: string;
  company_name?: string;
  created_at?: string;
}

export interface DashboardMetrics {
  summary: {
    contacts: number;
    companies: number;
    activeDeals: number;
    pendingActivities: number;
  };
  dealsByStage: Array<{ stage: string; business_model: string; count: number; total_amount: number }>;
  recentActivities: Activity[];
}
