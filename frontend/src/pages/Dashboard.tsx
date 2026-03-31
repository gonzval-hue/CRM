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
  const [viewMode, setViewMode] = useState<'split' | 'acv'>('split');

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

  const stagesInOrder = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  const chartData = stagesInOrder.map(stageName => {
    const items = metrics.dealsByStage.filter((s: any) => s.stage === stageName);
    const projectAmt = items.filter((s: any) => s.business_model !== 'service').reduce((sum, s: any) => sum + s.total_amount, 0);
    const serviceAmt = items.filter((s: any) => s.business_model === 'service').reduce((sum, s: any) => sum + s.total_amount, 0);
    
    return {
      name: stageName.charAt(0).toUpperCase() + stageName.slice(1),
      stage: stageName,
      project: projectAmt,
      service: serviceAmt,
      service_acv: serviceAmt * 12,
      acv: projectAmt + (serviceAmt * 12),
      count: items.reduce((sum, s: any) => sum + s.count, 0)
    };
  }).filter(d => d.stage !== 'shelved');

  // Calculate financial metrics helper
  const calcMetrics = (stagesArray: string[]) => {
    const items = metrics.dealsByStage.filter((s: any) => stagesArray.includes(s.stage));
    const project = items.filter((s: any) => s.business_model !== 'service').reduce((sum, s: any) => sum + s.total_amount, 0);
    const service = items.filter((s: any) => s.business_model === 'service').reduce((sum, s: any) => sum + s.total_amount, 0);
    return { project, service, acv: project + (service * 12) };
  };

  const pipeline = calcMetrics(['prospecting', 'qualification', 'proposal', 'negotiation']);
  const qualified = calcMetrics(['qualification', 'proposal', 'negotiation']);
  const revenue = calcMetrics(['closed_won']);

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
          const items = metrics.dealsByStage.filter(s => s.stage === stage.id);
          const count = items.reduce((sum, s) => sum + s.count, 0);
          
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
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pipeline de Ventas</h3>
                <span className="text-sm text-slate-500 font-medium">Por Monto Estimado (USD)</span>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'split' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Separado (MRR vs Único)
                </button>
                <button
                  onClick={() => setViewMode('acv')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'acv' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Anualizado (ACV)
                </button>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: any) => {
                      const translations: Record<string, string> = { project: 'Proyecto', service: 'Servicio (MRR)', service_acv: 'Servicio (ACV)', acv: 'ACV' };
                      return [formatCurrency(Number(value)), translations[String(name)] || String(name)];
                    }}
                  />
                  {viewMode === 'split' ? (
                    <>
                      <Bar dataKey="project" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="service" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </>
                  ) : (
                    <>
                      <Bar dataKey="project" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="service_acv" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </>
                  )}
                  <Legend 
                    iconType="circle" 
                    formatter={(v) => {
                      const translations: Record<string, string> = { 
                        project: 'Proyectos', 
                        service: 'Servicios (MRR)', 
                        service_acv: 'Servicios (ACV - Anualizado)' 
                      };
                      return translations[v] || v;
                    }} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Financial Summary Table */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                    <th className="pb-3 px-2">Categoría</th>
                    {viewMode === 'split' ? (
                      <>
                        <th className="pb-3 px-2 text-right">Proyectos (Único)</th>
                        <th className="pb-3 px-2 text-right">Servicios (MRR)</th>
                      </>
                    ) : (
                      <th className="pb-3 px-2 text-right">Valor Anualizado (ACV)</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">Pipeline</div>
                      <div className="text-[10px] text-slate-400 uppercase">Prospección + Calificación + Propuesta + Negociación</div>
                    </td>
                    {viewMode === 'split' ? (
                      <>
                        <td className="py-3 px-2 text-right font-bold text-indigo-600">{formatCurrency(pipeline.project)}</td>
                        <td className="py-3 px-2 text-right font-bold text-emerald-600">
                          {formatCurrency(pipeline.service)} <span className="text-[10px] font-normal text-slate-400">/mo</span>
                        </td>
                      </>
                    ) : (
                      <td className="py-3 px-2 text-right font-bold text-indigo-600">{formatCurrency(pipeline.acv)}</td>
                    )}
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">Pipeline Calificado</div>
                      <div className="text-[10px] text-slate-400 uppercase">Calificación + Propuesta + Negociación</div>
                    </td>
                    {viewMode === 'split' ? (
                      <>
                        <td className="py-3 px-2 text-right font-bold text-blue-600">{formatCurrency(qualified.project)}</td>
                        <td className="py-3 px-2 text-right font-bold text-emerald-600">
                          {formatCurrency(qualified.service)} <span className="text-[10px] font-normal text-slate-400">/mo</span>
                        </td>
                      </>
                    ) : (
                      <td className="py-3 px-2 text-right font-bold text-blue-600">{formatCurrency(qualified.acv)}</td>
                    )}
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-bold text-emerald-600">Revenue (Ventas)</div>
                      <div className="text-[10px] text-slate-400 uppercase">Todas las Ganadas</div>
                    </td>
                    {viewMode === 'split' ? (
                      <>
                        <td className="py-3 px-2 text-right font-bold text-emerald-600">{formatCurrency(revenue.project)}</td>
                        <td className="py-3 px-2 text-right font-bold text-emerald-600">
                          {formatCurrency(revenue.service)} <span className="text-[10px] font-normal text-slate-400">/mo</span>
                        </td>
                      </>
                    ) : (
                      <td className="py-3 px-2 text-right font-bold text-emerald-600">{formatCurrency(revenue.acv)}</td>
                    )}
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
                      (() => {
                        const items = metrics.dealsByStage.filter((s: any) => s.stage === 'closed_won');
                        const wonCount = items.reduce((sum: number, s: any) => sum + s.count, 0);
                        return { name: 'Ganadas', value: wonCount };
                      })(),
                      (() => {
                        const items = metrics.dealsByStage.filter((s: any) => s.stage === 'closed_lost');
                        const lostCount = items.reduce((sum: number, s: any) => sum + s.count, 0);
                        return { name: 'Perdidas', value: lostCount };
                      })()
                    ].filter((d: any) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      (() => {
                        const items = metrics.dealsByStage.filter((s: any) => s.stage === 'closed_won');
                        const wonCount = items.reduce((sum: number, s: any) => sum + s.count, 0);
                        return { name: 'Ganadas', value: wonCount };
                      })(),
                      (() => {
                        const items = metrics.dealsByStage.filter((s: any) => s.stage === 'closed_lost');
                        const lostCount = items.reduce((sum: number, s: any) => sum + s.count, 0);
                        return { name: 'Perdidas', value: lostCount };
                      })()
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
                const won = metrics.dealsByStage.filter((s: any) => s.stage === 'closed_won').reduce((sum: number, s: any) => sum + s.count, 0);
                const lost = metrics.dealsByStage.filter((s: any) => s.stage === 'closed_lost').reduce((sum: number, s: any) => sum + s.count, 0);
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
