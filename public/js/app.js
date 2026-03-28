// API Base URL
const API_URL = '';

// API Helper
async function api(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Error en la petición');
  }
  
  return await response.json();
}

// Navigation
document.querySelectorAll('[data-view]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const view = link.dataset.view;
    
    // Update active link
    document.querySelectorAll('[data-view]').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    
    // Show view
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');
    
    // Load data
    loadView(view);
  });
});

// Load view data
function loadView(view) {
  switch(view) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'companies':
      loadCompanies();
      break;
    case 'contacts':
      loadContacts();
      break;
    case 'deals':
      loadDeals();
      break;
    case 'activities':
      loadActivities();
      break;
  }
}

// Dashboard
async function loadDashboard() {
  try {
    const metrics = await api('/api/dashboard/metrics');
    const data = metrics.data;
    
    document.getElementById('stat-contacts').textContent = data.summary.contacts;
    document.getElementById('stat-companies').textContent = data.summary.companies;
    document.getElementById('stat-deals').textContent = data.summary.activeDeals;
    document.getElementById('stat-activities').textContent = data.summary.pendingActivities;
    
    // Pipeline
    const pipelineContainer = document.getElementById('pipeline-container');
    const stages = [
      { id: 'prospecting', label: 'Prospecting' },
      { id: 'qualification', label: 'Qualification' },
      { id: 'proposal', label: 'Proposal' },
      { id: 'negotiation', label: 'Negotiation' },
    ];
    
    pipelineContainer.innerHTML = stages.map(stage => {
      const stageData = data.dealsByStage.find(s => s.stage === stage.id) || { count: 0, total_amount: 0 };
      return `
        <div class="col-md-3">
          <div class="pipeline-stage">
            <div class="pipeline-stage-title">
              <span>${stage.label}</span>
              <span class="badge bg-secondary">${stageData.count || 0}</span>
            </div>
            <div class="text-muted small">
              $${formatNumber(stageData.total_amount || 0)}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Recent activities
    const activitiesContainer = document.getElementById('recent-activities');
    if (data.recentActivities && data.recentActivities.length > 0) {
      activitiesContainer.innerHTML = data.recentActivities.slice(0, 5).map(a => `
        <div class="d-flex align-items-start mb-3 pb-3 border-bottom">
          <div class="flex-shrink-0">
            <i class="bi bi-${getActivityIcon(a.type)} fs-5"></i>
          </div>
          <div class="flex-grow-1 ms-3">
            <div class="fw-medium">${a.subject || a.type}</div>
            <div class="text-muted small">${a.contact_name || 'Sin contacto'}</div>
            <div class="text-muted small">${formatDate(a.created_at)}</div>
          </div>
        </div>
      `).join('');
    } else {
      activitiesContainer.innerHTML = '<p class="text-muted">No hay actividades recientes</p>';
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

function getActivityIcon(type) {
  const icons = {
    call: 'telephone',
    email: 'envelope',
    meeting: 'people',
    task: 'check-circle',
    note: 'sticky',
  };
  return icons[type] || 'circle';
}

// Companies
async function loadCompanies() {
  try {
    const result = await api('/api/companies');
    const companies = result.data;
    
    const tbody = document.getElementById('companies-table');
    if (companies.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No hay empresas registradas</td></tr>';
      return;
    }
    
    tbody.innerHTML = companies.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.industry || '-'}</td>
        <td>${c.email || '-'}</td>
        <td>${c.phone || '-'}</td>
        <td>${c.city || '-'}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteCompany(${c.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading companies:', error);
  }
}

async function deleteCompany(id) {
  if (!confirm('¿Estás seguro de eliminar esta empresa?')) return;
  
  try {
    await api(`/api/companies/${id}`, { method: 'DELETE' });
    loadCompanies();
  } catch (error) {
    alert('Error al eliminar: ' + error.message);
  }
}

// Contacts
async function loadContacts() {
  try {
    const result = await api('/api/contacts');
    const contacts = result.data;
    
    const tbody = document.getElementById('contacts-table');
    if (contacts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No hay contactos registrados</td></tr>';
      return;
    }
    
    tbody.innerHTML = contacts.map(c => `
      <tr>
        <td><strong>${c.first_name} ${c.last_name}</strong></td>
        <td>${c.email || '-'}</td>
        <td>${c.phone || '-'}</td>
        <td>${c.position || '-'}</td>
        <td>${c.company_name || '-'}</td>
        <td><span class="badge bg-${getStatusColor(c.status)}">${c.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteContact(${c.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading contacts:', error);
  }
}

function getStatusColor(status) {
  const colors = {
    new: 'info',
    contacted: 'primary',
    qualified: 'success',
    unqualified: 'secondary',
    converted: 'success',
  };
  return colors[status] || 'secondary';
}

async function deleteContact(id) {
  if (!confirm('¿Estás seguro de eliminar este contacto?')) return;
  
  try {
    await api(`/api/contacts/${id}`, { method: 'DELETE' });
    loadContacts();
  } catch (error) {
    alert('Error al eliminar: ' + error.message);
  }
}

// Deals
async function loadDeals() {
  try {
    const result = await api('/api/deals');
    const deals = result.data;
    
    const tbody = document.getElementById('deals-table');
    if (deals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No hay oportunidades registradas</td></tr>';
      return;
    }
    
    tbody.innerHTML = deals.map(d => `
      <tr>
        <td><strong>${d.title}</strong></td>
        <td>${d.company_name || '-'}</td>
        <td>${d.first_name ? `${d.first_name} ${d.last_name}` : '-'}</td>
        <td>$${formatNumber(d.amount || 0)}</td>
        <td><span class="badge badge-stage badge-${d.stage}">${d.stage}</span></td>
        <td>${d.probability || 0}%</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteDeal(${d.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading deals:', error);
  }
}

async function deleteDeal(id) {
  if (!confirm('¿Estás seguro de eliminar esta oportunidad?')) return;
  
  try {
    await api(`/api/deals/${id}`, { method: 'DELETE' });
    loadDeals();
  } catch (error) {
    alert('Error al eliminar: ' + error.message);
  }
}

// Activities
async function loadActivities() {
  try {
    const result = await api('/api/activities');
    const activities = result.data;
    
    const tbody = document.getElementById('activities-table');
    if (activities.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No hay actividades registradas</td></tr>';
      return;
    }
    
    tbody.innerHTML = activities.map(a => `
      <tr>
        <td><i class="bi bi-${getActivityIcon(a.type)} me-1"></i> ${a.type}</td>
        <td>${a.subject || '-'}</td>
        <td>${a.description ? a.description.substring(0, 50) + '...' : '-'}</td>
        <td><span class="badge bg-${a.status === 'completed' ? 'success' : 'warning'}">${a.status}</span></td>
        <td>${formatDate(a.due_date)}</td>
        <td>
          ${a.status !== 'completed' ? `
            <button class="btn btn-sm btn-outline-success" onclick="completeActivity(${a.id})">
              <i class="bi bi-check-lg"></i>
            </button>
          ` : ''}
          <button class="btn btn-sm btn-outline-danger" onclick="deleteActivity(${a.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading activities:', error);
  }
}

async function completeActivity(id) {
  try {
    await api(`/api/activities/${id}/complete`, { method: 'POST' });
    loadActivities();
  } catch (error) {
    alert('Error al completar: ' + error.message);
  }
}

async function deleteActivity(id) {
  if (!confirm('¿Estás seguro de eliminar esta actividad?')) return;
  
  try {
    await api(`/api/activities/${id}`, { method: 'DELETE' });
    loadActivities();
  } catch (error) {
    alert('Error al eliminar: ' + error.message);
  }
}

// Forms
document.getElementById('companyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  try {
    await api('/api/companies', { method: 'POST', body: JSON.stringify(data) });
    bootstrap.Modal.getInstance(document.getElementById('companyModal')).hide();
    e.target.reset();
    loadCompanies();
    loadDashboard();
  } catch (error) {
    alert('Error al crear: ' + error.message);
  }
});

document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  try {
    await api('/api/contacts', { method: 'POST', body: JSON.stringify(data) });
    bootstrap.Modal.getInstance(document.getElementById('contactModal')).hide();
    e.target.reset();
    loadContacts();
    loadDashboard();
  } catch (error) {
    alert('Error al crear: ' + error.message);
  }
});

document.getElementById('dealForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  data.amount = parseFloat(data.amount) || 0;
  data.probability = parseInt(data.probability) || 0;
  
  try {
    await api('/api/deals', { method: 'POST', body: JSON.stringify(data) });
    bootstrap.Modal.getInstance(document.getElementById('dealModal')).hide();
    e.target.reset();
    loadDeals();
    loadDashboard();
  } catch (error) {
    alert('Error al crear: ' + error.message);
  }
});

document.getElementById('activityForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  try {
    await api('/api/activities', { method: 'POST', body: JSON.stringify(data) });
    bootstrap.Modal.getInstance(document.getElementById('activityModal')).hide();
    e.target.reset();
    loadActivities();
    loadDashboard();
  } catch (error) {
    alert('Error al crear: ' + error.message);
  }
});

// Utilities
function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Initial load
loadDashboard();
