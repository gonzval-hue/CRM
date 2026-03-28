import React, { useState, useEffect } from 'react';
import type { Activity, Contact, Company } from '../types';
import api from '../services/api';
import { CalendarCheck } from 'lucide-react';

interface ActivityFormProps {
  initialData?: Activity | null;
  onSubmit: (data: Partial<Activity>) => Promise<void>;
  onCancel: () => void;
}

const types = [
  { id: 'call', label: 'Llamada' },
  { id: 'email', label: 'Email' },
  { id: 'meeting', label: 'Reunión' },
  { id: 'task', label: 'Tarea' },
  { id: 'note', label: 'Nota' },
];

const statuses = [
  { id: 'scheduled', label: 'Programada' },
  { id: 'completed', label: 'Completada' },
  { id: 'cancelled', label: 'Cancelada' },
];

export const ActivityForm: React.FC<ActivityFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<Partial<Activity>>({
    type: 'call',
    subject: '',
    description: '',
    status: 'scheduled',
    due_date: new Date().toISOString().slice(0, 16),
    contact_id: undefined,
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactsRes, companiesRes, dealsRes]: any = await Promise.all([
          api.get('/api/contacts'),
          api.get('/api/companies'),
          api.get('/api/deals'),
        ]);
        setContacts(contactsRes.data);
        setCompanies(companiesRes.data);
        setDeals(dealsRes.data);
      } catch (error) {
        console.error('Error fetching relational data:', error);
      }
    };
    fetchData();

    if (initialData) {
      let dateValue = '';
      if (initialData.due_date) {
        try {
          const d = new Date(String(initialData.due_date).replace(' ', 'T'));
          if (!isNaN(d.getTime())) {
            // Adjust for timezone offset to get local YYYY-MM-DDTHH:MM
            const offset = d.getTimezoneOffset() * 60000;
            dateValue = new Date(d.getTime() - offset).toISOString().slice(0, 16);
          }
        } catch (e) {
          console.error('Error parsing activity date:', e);
        }
      }
      
      setFormData({
        ...initialData,
        due_date: dateValue
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const skipParsing = ['subject', 'description', 'type', 'status', 'due_date'];
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: skipParsing.includes(name) ? value : (value ? parseInt(value) : undefined)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-1">Asunto *</label>
          <input
            required
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            placeholder="Ej: Llamada de seguimiento"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none"
          >
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Estado</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none"
          >
            {statuses.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Contacto</label>
          <select
            name="contact_id"
            value={formData.contact_id || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none"
          >
            <option value="">Seleccionar contacto...</option>
            {contacts.map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Empresa</label>
          <select
            name="company_id"
            value={formData.company_id || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none"
          >
            <option value="">Seleccionar empresa...</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Oportunidad</label>
          <select
            name="deal_id"
            value={formData.deal_id || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none"
          >
            <option value="">Seleccionar oportunidad...</option>
            {deals.map(d => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Fecha y Hora *</label>
          <input
            required
            type="datetime-local"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all min-h-[100px]"
            placeholder="Notas adicionales..."
          />
        </div>
      </div>

      <div className="sticky bottom-0 bg-white pt-6 pb-2 border-t border-slate-100 flex justify-end gap-3 -mx-6 px-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center gap-2"
        >
          <CalendarCheck className="w-4 h-4" />
          {loading ? 'Guardando...' : initialData ? 'Actualizar Actividad' : 'Crear Actividad'}
        </button>
      </div>
    </form>
  );
};
