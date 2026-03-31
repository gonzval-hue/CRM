import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import api from '../services/api';
import type { Deal } from '../types';
import { cn } from '../lib/utils';
import { Modal } from '../components/Modal';
import { DealForm } from '../components/DealForm';
import { Edit2, Plus, Search, DollarSign, Calendar, Building2 } from 'lucide-react';

const stages = [
  { id: 'prospecting', label: 'Prospecting', color: 'bg-blue-500' },
  { id: 'qualification', label: 'Qualification', color: 'bg-amber-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-indigo-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-500' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-emerald-500' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-rose-500' },
];

export const Deals: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const fetchDeals = async () => {
    try {
      const response: any = await api.get('/api/deals');
      // The API returns { success: true, data: [...] }
      // If using axios interceptor that returns response.data, then we need response.data
      if (response && response.success) {
        setDeals(response.data);
      } else if (Array.isArray(response)) {
        setDeals(response);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleOpenModal = (deal: Deal | null = null) => {
    setSelectedDeal(deal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDeal(null);
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const stageId = destination.droppableId as Deal['stage'];
    
    // Optimistic UI Update
    setDeals(prevDeals => prevDeals.map(deal => {
      if (String(deal.id) === draggableId) {
        return { ...deal, stage: stageId };
      }
      return deal;
    }));

    try {
      await api.put(`/api/deals/${draggableId}`, { stage: stageId });
    } catch (error) {
      console.error('Error updating deal stage:', error);
      alert('Error al actualizar el estado de la oportunidad. Revirtiendo...');
      fetchDeals(); // revert optimistic on error
    }
  };

  const handleSubmit = async (data: Partial<Deal>) => {
    try {
      if (selectedDeal) {
        await api.put(`/api/deals/${selectedDeal.id}`, data);
      } else {
        await api.post('/api/deals', data);
      }
      handleCloseModal();
      fetchDeals();
    } catch (error) {
      alert('Error al guardar la oportunidad');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'Sin fecha';
    try {
      // If it's already a Date object (common with MariaDB driver)
      const d = dateVal instanceof Date ? dateVal : new Date(String(dateVal).replace(' ', 'T'));
      
      if (isNaN(d.getTime())) return 'F. Inválida';
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (error) {
      console.error('Date rendering error:', error);
      return 'F. Inválida';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Oportunidades</h1>
          <p className="text-slate-500">Visualiza y gestiona tu pipeline de ventas.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar oportunidades..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none w-64"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nueva Oportunidad
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide items-start">
          {stages.map((stage) => {
            const stageDeals = deals.filter(d => d.stage === stage.id);
            const totalAmount = stageDeals.reduce((sum, d) => sum + d.amount, 0);

            return (
              <div key={stage.id} className="flex-shrink-0 w-80 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", stage.color)}></div>
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{stage.label}</h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{formatCurrency(totalAmount)}</span>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "bg-slate-100/50 p-2 rounded-xl min-h-[500px] border-2 border-dashed transition-colors",
                        snapshot.isDraggingOver ? "border-indigo-300 bg-indigo-50/50" : "border-slate-200"
                      )}
                    >
                      {loading ? (
                        <div className="space-y-3">
                          {[...Array(2)].map((_, i) => (
                            <div key={i} className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
                              <div className="h-4 bg-slate-100 rounded w-3/4 mb-3"></div>
                              <div className="h-3 bg-slate-50 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3 min-h-[10px]">
                          {stageDeals.map((deal, index) => (
                            <Draggable key={deal.id} draggableId={String(deal.id)} index={index}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    "bg-white p-4 rounded-lg shadow-sm border border-slate-200 transition-all group",
                                    !snapshot.isDragging && "hover:border-indigo-300 cursor-pointer",
                                    snapshot.isDragging && "shadow-xl border-indigo-400 rotate-2 scale-105 opacity-90 cursor-grabbing"
                                  )}
                                  onClick={() => {
                                    if (!snapshot.isDragging) {
                                      handleOpenModal(deal);
                                    }
                                  }}
                                  style={provided.draggableProps.style}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                      {deal.title}
                                    </h4>
                                    <Edit2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all" />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                      <Building2 className="w-3 h-3" />
                                      {deal.company_name || 'Sin empresa'}
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                      <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                        {formatCurrency(deal.amount).replace('$', '')}
                                      </div>
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(deal.expected_close_date)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                      <div 
                                        className={cn("h-full rounded-full transition-all duration-1000", stage.color)} 
                                        style={{ width: `${deal.probability}%` }}
                                      ></div>
                                    </div>
                                    <span className="ml-3 text-[10px] font-bold text-slate-500">{deal.probability}%</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedDeal ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
        size="lg"
      >
        <DealForm 
          initialData={selectedDeal}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};
