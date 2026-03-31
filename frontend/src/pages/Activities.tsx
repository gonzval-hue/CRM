import React, { useEffect, useState } from 'react';
import { 
  CalendarCheck,
  Search,
  Plus,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import type { Activity } from '../types';
import { cn } from '../lib/utils';
import { Modal } from '../components/Modal';
import { ActivityForm } from '../components/ActivityForm';

const iconMap: Record<string, any> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  task: CheckCircle2,
  note: Clock,
};

// Helper for robust date formatting
const formatDateTime = (dateValue: any) => {
  if (!dateValue) return 'Sin fecha';
  let date: Date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    const isoString = dateValue.includes(' ') ? dateValue.replace(' ', 'T') : dateValue;
    date = new Date(isoString);
  } else {
    date = new Date(dateValue);
  }

  if (isNaN(date.getTime())) return 'Fecha inválida';
  
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const fetchActivities = async () => {
    try {
      const response: any = await api.get('/api/activities');
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleOpenModal = (activity: Activity | null = null) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActivity(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta actividad?')) return;
    try {
      await api.delete(`/api/activities/${id}`);
      fetchActivities();
    } catch (error) {
      alert('Error al eliminar la actividad');
    }
  };

  const handleSubmit = async (data: Partial<Activity>) => {
    try {
      if (selectedActivity) {
        await api.put(`/api/activities/${selectedActivity.id}`, data);
      } else {
        await api.post('/api/activities', data);
      }
      handleCloseModal();
      fetchActivities();
    } catch (error) {
      alert('Error al guardar la actividad');
    }
  };

  // Dynamic Summary Calculations
  const today = new Date().toDateString();
  const todayActivities = activities.filter(a => {
    if (!a.due_date) return false;
    const date = new Date(typeof a.due_date === 'string' ? a.due_date.replace(' ', 'T') : a.due_date);
    return date.toDateString() === today;
  });

  // Group by type
  const typeLabels: Record<string, string> = {
    call: 'Llamadas',
    phone: 'Llamadas',
    meeting: 'Reuniones',
    email: 'Emails',
    task: 'Tareas',
    note: 'Notas'
  };

  const activityCounts = todayActivities.reduce((acc: Record<string, number>, curr) => {
    const label = typeLabels[curr.type] || 'Otras';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  // All pending activities (regardless of date)
  const allPendingActivities = activities.filter(a => a.status === 'scheduled');
  const allPendingCounts = allPendingActivities.reduce((acc: Record<string, number>, curr) => {
    const label = typeLabels[curr.type] || 'Otras';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const completedToday = todayActivities.filter(a => a.status === 'completed').length;
  const totalToday = todayActivities.length;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Actividades</h1>
          <p className="text-slate-500">Seguimiento de tareas, reuniones y llamadas.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nueva Actividad
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar actividades..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 rounded-lg text-sm transition-all outline-none"
              />
            </div>
            <select className="bg-slate-50 border-transparent text-sm font-medium text-slate-600 rounded-lg px-3 outline-none focus:bg-white focus:border-indigo-500">
              <option>Todas las actividades</option>
              <option>Pendientes</option>
              <option>Completadas</option>
            </select>
          </div>

          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="relative pl-12 animate-pulse">
                  <div className="absolute left-0 w-10 h-10 bg-slate-100 rounded-full border-4 border-white shadow-sm"></div>
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="h-4 bg-slate-100 rounded w-1/4 mb-4"></div>
                    <div className="h-3 bg-slate-50 rounded w-full"></div>
                  </div>
                </div>
              ))
            ) : activities.length > 0 ? (
              activities.map((activity) => {
                const Icon = iconMap[activity.type] || CalendarCheck;
                return (
                  <div key={activity.id} className="relative pl-12 group">
                    <div className={cn(
                      "absolute left-0 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-110",
                      activity.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                      {activity.status === 'completed' && (
                        <div className="absolute top-0 right-0 p-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-20" />
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <div 
                          className="cursor-pointer group/title"
                          onClick={() => handleOpenModal(activity)}
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activity.type}</span>
                          <h3 className="font-bold text-slate-900 group-hover/title:text-indigo-600 transition-colors flex items-center gap-2">
                            {activity.subject || activity.type}
                            <Edit2 className="w-3 h-3 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                          </h3>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleOpenModal(activity)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(activity.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">{activity.description || 'Sin descripción adicional'}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold">JD</div>
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{activity.contact_name || 'Sin contacto'}</span>
                        </div>
                        <time className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDateTime(activity.due_date)}
                        </time>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-400 font-medium">No hay actividades registradas</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 p-6 rounded-xl text-white shadow-lg shadow-indigo-200">
            <h4 className="font-bold mb-2">Tu actividad hoy</h4>
            <div className="space-y-4 mt-6">
              {Object.keys(activityCounts).length > 0 ? (
                Object.entries(activityCounts).map(([label, count]) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="opacity-80">{label}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs opacity-60 text-center py-2">Sin actividades para hoy</p>
              )}
              
              <div className="w-full bg-indigo-500 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-1000 rounded-full shadow-sm shadow-white/20"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest text-center mt-2">
                {progressPercent}% completado
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Total Pendientes
            </h4>
            <div className="space-y-3">
              {Object.keys(allPendingCounts).length > 0 ? (
                Object.entries(allPendingCounts).map(([label, count]) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-full">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">No hay actividades pendientes</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedActivity ? 'Editar Actividad' : 'Nueva Actividad'}
        size="lg"
      >
        <ActivityForm 
          initialData={selectedActivity}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};
