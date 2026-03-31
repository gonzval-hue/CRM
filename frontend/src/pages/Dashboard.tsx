import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  CalendarCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../services/api';
import type { DashboardMetrics } from '../types';
import { StatCard } from '../components/StatCard';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper to handle MySQL dates robustly
const formatDate = (dateValue: any) => {
  if (!dateValue) return 'Sin fecha';
  
  let date: Date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    // Replace space with 'T' to make it a valid ISO 8601 string for all JS engines
    // but only if it matches the 'YYYY-MM-DD HH:mm:ss' pattern
    const isoString = dateValue.includes(' ') ? dateValue.replace(' ', 'T') : dateValue;
    date = new Date(isoString);
  } else {
    date = new Date(dateValue);
  }

  if (isNaN(date.getTime())) return 'Fecha inválida';
  
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};


export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response: any = await api.get('/api/dashboard/metrics');
        const data = response.data || {};
        
        // Normalize data with extreme safety
        const normalized = {
          ...data,
          recentActivities: data.recentActivities || [],
          dealsByStage: (data.dealsByStage || []).map((s: any) => ({
            ...s,
            stage: String(s.stage || '').toLowerCase(),
            count: Number(s.count || 0),
            total_amount: Number(s.total_amount || 0)
          }))
        };
        setMetrics(normalized);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!metrics) return null;

  const chartData = metrics.dealsByStage.map((stage: any) => ({
    name: stage.stage.charAt(0).toUpperCase() + stage.stage.slice(1),
    amount: stage.total_amount,
    count: stage.count
  }));

  // Calculate financial metrics
  const pipelineTotal = metrics.dealsByStage
    .filter(s => ['prospecting', 'qualification', 'proposal', 'negotiation'].includes(s.stage))
    .reduce((sum, s) => sum + s.total_amount, 0);

  const qualifiedPipeline = metrics.dealsByStage
    .filter(s => ['qualification', 'proposal', 'negotiation'].includes(s.stage))
    .reduce((sum, s) => sum + s.total_amount, 0);

  const revenueTotal = metrics.dealsByStage
    .filter(s => s.stage === 'closed_won')
    .reduce((sum, s) => sum + s.total_amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Bienvenido al CRM</h1>
        <p className="text-slate-500">Aquí tienes un resumen de tu actividad comercial.</p>
      </header>

      {/* Stats Grid - Fixed Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { id: 'prospecting', label: 'Prospección', color: 'blue' },
          { id: 'qualification', label: 'Calificación', color: 'amber' },
          { id: 'proposal', label: 'Propuesta', color: 'indigo' },
          { id: 'negotiation', label: 'Negociación', color: 'purple' },
          { id: 'closed_won', label: 'Ganadas', color: 'green' },
        ].map((stage) => {
          const dealData = metrics.dealsByStage.find(s => s.stage === stage.id);
          const count = dealData ? dealData.count : 0;
          
          return (
            <StatCard 
              key={stage.id}
              title={stage.label} 
              value={count} 
              icon={TrendingUp} 
              variant={stage.color as any} 
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pipeline Chart & Pie Chart */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Pipeline de Ventas</h3>
              <span className="text-sm text-slate-500 font-medium">Por Monto Estimado (USD)</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.filter((d: any) => d.name !== 'Shelved')}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Financial Summary Table */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                    <th className="pb-3 px-2">Categoría</th>
                    <th className="pb-3 px-2 text-right">Monto Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">Pipeline</div>
                      <div className="text-[10px] text-slate-400 uppercase">Prospección + Calificación + Propuesta + Negociación</div>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-indigo-600">{formatCurrency(pipelineTotal)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">Pipeline Calificado</div>
                      <div className="text-[10px] text-slate-400 uppercase">Calificación + Propuesta + Negociación</div>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-blue-600">{formatCurrency(qualifiedPipeline)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-bold text-emerald-600">Revenue (Ventas)</div>
                      <div className="text-[10px] text-slate-400 uppercase">Todas las Ganadas</div>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-emerald-600">{formatCurrency(revenueTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pie Chart Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Efectividad de Cierre</h3>
              <span className="text-sm text-slate-500 font-medium">Ganadas vs Perdidas</span>
            </div>
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Ganadas', value: metrics.dealsByStage.find((s: any) => s.stage === 'closed_won')?.count || 0 },
                      { name: 'Perdidas', value: metrics.dealsByStage.find((s: any) => s.stage === 'closed_lost')?.count || 0 }
                    ].filter((d: any) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: 'Ganadas', value: metrics.dealsByStage.find((s: any) => s.stage === 'closed_won')?.count || 0 },
                      { name: 'Perdidas', value: metrics.dealsByStage.find((s: any) => s.stage === 'closed_lost')?.count || 0 }
                    ].filter((d: any) => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Ganadas' ? '#10b981' : '#ef4444'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Central Percentage Display */}
              {(() => {
                const won = metrics.dealsByStage.find((s: any) => s.stage === 'closed_won')?.count || 0;
                const lost = metrics.dealsByStage.find((s: any) => s.stage === 'closed_lost')?.count || 0;
                const total = won + lost;
                const percentage = total > 0 ? Math.round((won / total) * 100) : 0;
                
                if (total === 0) return null;
                
                return (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-2xl font-bold text-emerald-600">{percentage}%</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Éxito</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Pending Activities List */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Actividades Pendientes</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {metrics.recentActivities.length}
            </span>
          </div>
          <div className="space-y-6 overflow-y-auto pr-2 max-h-[600px] custom-scrollbar">
            {metrics.recentActivities.length > 0 ? (
              metrics.recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex gap-4 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <div className="mt-1">
                    <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{activity.subject || activity.type}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activity.contact_name || activity.company_name || 'Sin contacto'}
                    </p>
                    <time className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-2 block">
                      {formatDate(activity.due_date)}
                    </time>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-8">No hay actividades pendientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
