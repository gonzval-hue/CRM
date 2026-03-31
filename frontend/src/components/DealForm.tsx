import React, { useState, useEffect } from 'react';
import type { Deal, Company, Contact } from '../types';
import api from '../services/api';

interface DealFormProps {
  initialData?: Deal | null;
  onSubmit: (data: Partial<Deal>) => Promise<void>;
  onCancel: () => void;
}

const stages = [
  { id: 'prospecting', label: 'Prospecting' },
  { id: 'qualification', label: 'Qualification' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'closed_won', label: 'Closed Won' },
  { id: 'closed_lost', label: 'Closed Lost' },
];

export const DealForm: React.FC<DealFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel 
}) => {
  const getSafeDate = (val: any) => {
    if (!val) return '';
    try {
      const dateStr = String(val);
      // If it's already YYYY-MM-DD, just return the first 10 characters
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr.split(/[T ]/)[0];
      }
      const d = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return '';
      // Local YYYY-MM-DD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  const [formData, setFormData] = useState<Partial<Deal>>({
    title: '',
    company_id: undefined,
    contact_id: undefined,
    amount: 0,
    stage: 'prospecting',
    probability: 20,
    description: '',
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, contactsRes]: any = await Promise.all([
          api.get('/api/companies'),
          api.get('/api/contacts'),
        ]);
        setCompanies(companiesRes.data);
        setContacts(contactsRes.data);
      } catch (error) {
        console.error('Error fetching relational data:', error);
      }
    };
    fetchData();

    if (initialData) {
      setFormData({
        ...initialData,
        expected_close_date: getSafeDate(initialData.expected_close_date)
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
    let finalValue: any = value;
    
    if (name === 'company_id' || name === 'contact_id') {
      finalValue = value ? parseInt(value) : undefined;
    } else if (name === 'amount' || name === 'probability') {
      finalValue = value ? parseFloat(value) : 0;
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-1">Título de la Oportunidad *</label>
          <input
            required
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            placeholder="Ej: Renovación Licencias 2024"
          />
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
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Contacto Principal</label>
          <select
            name="contact_id"
            value={formData.contact_id || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none"
          >
            <option value="">Seleccionar contacto...</option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>{contact.first_name} {contact.last_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Monto (USD)</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Etapa</label>
          <select
            name="stage"
            value={formData.stage}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none"
          >
            {stages.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Probabilidad (%)</label>
          <input
            type="number"
            name="probability"
            value={formData.probability}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            min="0"
            max="100"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Fecha de Cierre Prevista *</label>
          <input
            required
            type="date"
            name="expected_close_date"
            value={getSafeDate(formData.expected_close_date)}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-1">Descripción / Notas</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all min-h-[100px]"
            placeholder="Detalles sobre la negociación..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 active:scale-95"
        >
          {loading ? 'Guardando...' : initialData ? 'Actualizar Oportunidad' : 'Crear Oportunidad'}
        </button>
      </div>
    </form>
  );
};
