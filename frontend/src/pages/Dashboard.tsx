import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  CalendarCheck,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../services/api';
import type { DashboardMetrics } from '../types';
import { StatCard } from '../components/StatCard';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response: any = await api.get('/api/dashboard/metrics');
        setMetrics(response.data);
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

  const chartData = metrics.dealsByStage.map(stage => ({
    name: stage.stage.charAt(0).toUpperCase() + stage.stage.slice(1),
    amount: stage.total_amount,
    count: stage.count
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Bienvenido al CRM</h1>
        <p className="text-slate-500">Aquí tienes un resumen de tu actividad comercial.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Contactos" 
          value={metrics.summary.contacts} 
          icon={Users} 
          variant="blue" 
        />
        <StatCard 
          title="Empresas" 
          value={metrics.summary.companies} 
          icon={Building2} 
          variant="green" 
        />
        <StatCard 
          title="Oportunidades" 
          value={metrics.summary.activeDeals} 
          icon={TrendingUp} 
          variant="purple" 
        />
        <StatCard 
          title="Actividades" 
          value={metrics.summary.pendingActivities} 
          icon={CalendarCheck} 
          variant="orange" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pipeline Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Pipeline de Ventas</h3>
            <span className="text-sm text-slate-500 font-medium">Por Monto Estimado (USD)</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Actividades Recientes</h3>
            <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-6">
            {metrics.recentActivities.length > 0 ? (
              metrics.recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="mt-1">
                    <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{activity.subject || activity.type}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.contact_name || 'Sin contacto'}</p>
                    <time className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-2 block">
                      {new Date(activity.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </time>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-8">No hay actividades registradas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
