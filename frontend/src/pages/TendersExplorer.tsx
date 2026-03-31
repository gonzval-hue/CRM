import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  X, 
  Plus
} from 'lucide-react';
import { fetchActiveTenders, searchTenders, getTenderDetail } from '../services/evaluador';
import type { EvaluadorTender, TenderDetail } from '../services/evaluador';
import api from '../services/api';

export const TendersExplorer: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<EvaluadorTender[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  
  // Modal state
  const [selectedTender, setSelectedTender] = useState<TenderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Error/Success state
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleRefresh = async () => {
    setLoadingRefresh(true);
    setNotification(null);
    try {
      await fetchActiveTenders();
      setNotification({ type: 'success', message: 'Datos actualizados desde Mercado Público' });
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
      
      // Re-fetch automatically to show the new updated list
      handleSearch(keyword);
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Error al actualizar base de datos' });
    } finally {
      setLoadingRefresh(false);
    }
  };

  const handleSearch = async (overrideKeyword?: string) => {
    const k = overrideKeyword !== undefined ? overrideKeyword : keyword;
    
    setLoadingSearch(true);
    try {
      const data = await searchTenders(k);
      setResults(data);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error realizando la búsqueda' });
    } finally {
      setLoadingSearch(false);
    }
  };

  useEffect(() => {
    // Load all open tenders on initial mount
    handleSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = async (tenderId: string) => {
    setIsModalOpen(true);
    setLoadingDetail(true);
    setSelectedTender(null);
    try {
      const data = await getTenderDetail(tenderId);
      setSelectedTender(data);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error cargando detalle de la licitación' });
      setIsModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTender(null);
  };

  const handleImportToCRM = async (tender: EvaluadorTender | TenderDetail) => {
    try {
      // 1. Crear Empresa
      let companyId;
      if (tender.Comprador && tender.Comprador.NombreOrganismo) {
        try {
          const cRes: any = await api.post('/api/companies', { 
            name: tender.Comprador.NombreOrganismo,
            address: tender.Comprador.DireccionUnidad || '',
            city: tender.Comprador.ComunaUnidad || '',
            country: tender.Comprador.RegionUnidad || '',
            owner_id: 1 
          });
          // Axios response interceptor in api.ts returns response.data directly
          if (cRes && cRes.success && cRes.data) {
            companyId = Number(cRes.data.id);
          }
        } catch (e) { console.error('Error creating company', e); }
      }

      // 2. Crear Contacto
      let contactId;
      if (tender.Comprador && tender.Comprador.NombreUsuario) {
        try {
          // Split first and last name simply
          const nameParts = tender.Comprador.NombreUsuario.split(' ');
          const fName = nameParts[0] || 'Desconocido';
          const lName = nameParts.slice(1).join(' ') || '';
          
          const ctRes: any = await api.post('/api/contacts', { 
            first_name: fName, 
            last_name: lName || fName, 
            position: tender.Comprador.CargoUsuario || '',
            company_id: companyId,
            owner_id: 1 
          });
          if (ctRes && ctRes.success && ctRes.data) {
            contactId = Number(ctRes.data.id);
          }
        } catch (e) { console.error('Error creating contact', e); }
      }

      // 3. Preparar descripción detallada
      let detallesExtra = '';
      if (tender.Items && tender.Items.Cantidad > 0 && tender.Items.Listado && tender.Items.Listado.length > 0) {
        const item = tender.Items.Listado[0];
        detallesExtra += `\n\n📌 **Detalles del Producto/Servicio:**\n`;
        if (item.Categoria) detallesExtra += `- Categoría: ${item.Categoria}\n`;
        if (item.NombreProducto) detallesExtra += `- Producto: ${item.NombreProducto}\n`;
        if (item.Descripcion) detallesExtra += `- Descripción: ${item.Descripcion}\n`;
        if (item.UnidadMedida) detallesExtra += `- Unidad Medida: ${item.UnidadMedida}\n`;
        if (item.Cantidad) detallesExtra += `- Cantidad: ${item.Cantidad}\n`;
      }

      if (tender.Fechas) {
        detallesExtra += `\n📅 **Fechas Clave:**\n`;
        if (tender.Fechas.FechaInicio) detallesExtra += `- Inicio: ${tender.Fechas.FechaInicio.replace('T', ' ')}\n`;
        if (tender.Fechas.FechaFinal) detallesExtra += `- Final: ${tender.Fechas.FechaFinal.replace('T', ' ')}\n`;
        if (tender.Fechas.FechaPubRespuestas) detallesExtra += `- Pub. Respuestas: ${tender.Fechas.FechaPubRespuestas.replace('T', ' ')}\n`;
      }
      
      const payload = {
        title: tender.title || tender.Nombre,
        amount: tender.MontoEstimado || 0,
        business_model: 'project',
        stage: 'prospecting',
        probability: 20,
        company_id: companyId,
        contact_id: contactId,
        owner_id: 1,
        external_id: tender.id || tender.CodigoExterno,
        description: `Importado desde Mercado Publico.\nLicitación: ${tender.id || tender.CodigoExterno}\n\n${tender.Descripcion || ''}${detallesExtra}`,
        expected_close_date: (tender.Fechas?.FechaFinal || tender.close_date || tender.FechaCierre) 
          ? String(tender.Fechas?.FechaFinal || tender.close_date || tender.FechaCierre).split('T')[0] 
          : null
      };
      
      await api.post('/api/deals', payload);
      setNotification({ type: 'success', message: `Licitación ${tender.id || tender.CodigoExterno} importada a Oportunidades exitosamente.` });
      // Close modal if open
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error al importar la oportunidad al CRM.' });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper for dates
  const formatDateDetailed = (isoString?: string | null) => {
    if(!isoString) return 'No disponible';
    try {
      const d = new Date(isoString);
      if(isNaN(d.getTime())) return isoString.split('T')[0];
      return d.toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    } catch(e) { return 'No disponible'; }
  };

  return (
    <div className="space-y-6 text-slate-100 bg-slate-900 min-h-[calc(100vh-4rem)] p-8 rounded-xl border border-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Buscador Mercado Publico
          </h1>
          <p className="text-slate-400 mt-1">Explora y analiza licitaciones de Mercado Público con facilidad.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={loadingRefresh}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-70"
        >
          {loadingRefresh ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Actualizar propuestas activas
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-lg mb-4 ${notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {notification.message}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-slate-400">Título</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Filtro específico en título..." 
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
            />
          </div>
        </div>
        <button 
          onClick={() => handleSearch()}
          disabled={loadingSearch}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loadingSearch ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Buscar
        </button>
      </div>

      {/* RESULTS HEADER */}
      <div className="flex items-center gap-3 pt-4">
        <h2 className="text-xl font-bold text-white">Resultados</h2>
        <span className="bg-blue-500/20 text-blue-400 py-0.5 px-2.5 rounded-full text-sm font-medium">
          {results.length}
        </span>
      </div>

      {/* RESULTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {results.map((tender, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-all flex flex-col group cursor-pointer" onClick={() => openModal(tender.id || tender.CodigoExterno)}>
            <div className="text-xs text-slate-500 font-mono mb-2">{tender.id || tender.CodigoExterno}</div>
            <h3 className="text-white font-medium text-[15px] leading-tight flex-1 mb-4 line-clamp-3 group-hover:text-blue-400 transition-colors">
              {tender.title || tender.Nombre}
            </h3>
            
            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-700/50 pt-3 mt-auto">
              <span>Cierre:</span>
              <span className="font-medium text-slate-300">{formatDateDetailed(tender.close_date || tender.FechaCierre).split(',')[0]}</span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); handleImportToCRM(tender); }}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-medium text-sm transition-colors opacity-0 group-hover:opacity-100"
            >
              <Plus className="w-4 h-4" /> Importar al CRM
            </button>
          </div>
        ))}
        
        {!loadingSearch && results.length === 0 && keyword && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No se encontraron resultados para "{keyword}"
          </div>
        )}
      </div>

      {/* MODAL DETALLE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0f1115] border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 relative">
            
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {loadingDetail ? (
              <div className="p-12 flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-slate-400">Cargando detalles desde Mercado Público...</p>
              </div>
            ) : selectedTender ? (
              <div className="p-8">
                {/* Modal Header */}
                <div className="mb-6">
                  <div className="text-sm font-mono text-slate-500 mb-2">{selectedTender.CodigoExterno}</div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">
                    {selectedTender.Nombre}
                  </h2>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <strong className="text-slate-400">Comprador:</strong> 
                      {selectedTender.Comprador?.NombreOrganismo || 'Desconocido'}
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <strong className="text-emerald-500">Monto Est.:</strong> 
                      ${(selectedTender.MontoEstimado || 0).toLocaleString('es-CL')}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mt-2 border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-2 text-slate-400">
                      <strong>Publicada:</strong> 
                      {selectedTender.Fechas ? formatDateDetailed(selectedTender.Fechas.FechaPublicacion) : 'No disponible'}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <strong>Cierre:</strong> 
                      {selectedTender.Fechas ? formatDateDetailed(selectedTender.Fechas.FechaCierre) : formatDateDetailed(selectedTender.FechaCierre)}
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-blue-400 mb-3 tracking-wider uppercase">Descripción</h4>
                    <div className="bg-[#15181e] border border-slate-800/50 rounded-xl p-5 text-sm text-slate-300 leading-relaxed font-light">
                      {selectedTender.Descripcion || 'Sin descripción detallada.'}
                    </div>
                  </div>
                </div>

                {/* Modal Footer / Actions */}
                <div className="mt-8 flex items-center gap-3">
                  <button 
                    onClick={() => window.open(`https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${selectedTender.CodigoExterno}`, '_blank')}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver en Mercado Público
                  </button>
                  <button 
                    onClick={() => handleImportToCRM({id: selectedTender.CodigoExterno, title: selectedTender.Nombre, ...selectedTender})}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Importar Oportunidad
                  </button>
                  <button 
                    onClick={closeModal}
                    className="flex items-center gap-2 bg-[#1a1d24] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    Volver
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                No se pudo cargar la información.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
