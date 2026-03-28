import React, { useState, useEffect } from 'react';
import type { Company } from '../types';

interface CompanyFormProps {
  initialData?: Company | null;
  onSubmit: (data: Partial<Company>) => Promise<void>;
  onCancel: () => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Empresa *</label>
          <input
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            placeholder="Ej: Acme Corp"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Industria</label>
          <input
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            placeholder="Ej: Tecnología"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Sitio Web</label>
          <input
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Email Corporativo</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            placeholder="contacto@empresa.com"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            placeholder="+1 234 567 890"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-1">Dirección</label>
          <input
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            placeholder="Calle Falsa 123"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Ciudad</label>
          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            placeholder="Madrid"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">País</label>
          <input
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            placeholder="España"
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
          {loading ? 'Guardando...' : initialData ? 'Actualizar Empresa' : 'Crear Empresa'}
        </button>
      </div>
    </form>
  );
};
