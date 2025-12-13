import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Calendar, AlertCircle, ShieldAlert, CheckCircle2, Megaphone, Info, AlertTriangle, XCircle, Send, Loader2, Pencil, X, MapPin, Recycle, Leaf, GlassWater, Trash } from 'lucide-react';
import { User, Alert } from '../types';
import { getAlerts, createAlert, deleteAlert, updateAlert } from '../services/alertService';
import { getNextCollectionSlot, NextCollectionInfo } from '../services/scheduleService';

interface AlertsPanelProps {
  user: User | null;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ user }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [nextCollection, setNextCollection] = useState<NextCollectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'organization';

  // Form State for Admins
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'critical'>('info');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Edit/Delete State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [alertsData, nextSlot] = await Promise.all([
        getAlerts(user),
        getNextCollectionSlot(user.region)
      ]);
      setAlerts(alertsData);
      setNextCollection(nextSlot);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (alert: Alert) => {
    setEditingId(alert.id);
    setTitle(alert.title);
    setMessage(alert.message);
    setType(alert.type);
    
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
    setType('info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    
    setSending(true);
    try {
      if (editingId) {
        // Update Logic
        await updateAlert(editingId, { title, message, type });
        setSuccessMsg('Alerta atualizado com sucesso!');
        setEditingId(null);
      } else {
        // Create Logic
        await createAlert(title, message, type, user);
        setSuccessMsg('Alerta enviado com sucesso para todos os moradores!');
      }
      
      setTitle('');
      setMessage('');
      setType('info');
      
      // Reload alerts only
      const alertsData = await getAlerts(user);
      setAlerts(alertsData);
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Tem certeza que deseja remover este comunicado?")) return;

    setDeletingId(id);
    try {
      await deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      
      // If deleting the item currently being edited, cancel edit
      if (editingId === id) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Erro ao deletar", error);
    } finally {
      setDeletingId(null);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="text-red-600" size={24} />;
      case 'warning': return <AlertTriangle className="text-amber-600" size={24} />;
      default: return <Info className="text-blue-600" size={24} />;
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getWasteIcon = (type: string) => {
    switch (type) {
      case 'Reciclável': return <Recycle className="text-green-400" size={24} />;
      case 'Orgânico': return <Leaf className="text-green-400" size={24} />;
      case 'Vidro': return <GlassWater className="text-green-400" size={24} />;
      default: return <Trash className="text-green-400" size={24} />;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
             <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
               {isAdmin ? 'Central de Transmissão' : 'Alertas Oficiais'}
               {isAdmin && <ShieldAlert className="text-green-600" size={28} />}
             </h2>
             <p className="text-slate-500">
               {isAdmin 
                 ? `Gerencie comunicados para a região: ${user?.region}` 
                 : `Atualizações para a comunidade: ${user?.region}`}
             </p>
           </div>
           {user && (
             <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
               <MapPin size={14} /> {user.region}
             </div>
           )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Admin Creation/Edit Area */}
        {isAdmin && (
          <div className="lg:col-span-1">
             <div className={`bg-white p-6 rounded-xl shadow-lg border transition-colors ${editingId ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    {editingId ? <Pencil size={20} className="text-amber-600" /> : <Megaphone size={20} />} 
                    {editingId ? 'Editar Comunicado' : 'Novo Comunicado'}
                  </h3>
                  {editingId && (
                    <button onClick={handleCancelEdit} className="text-xs flex items-center gap-1 text-slate-500 hover:text-red-600 bg-slate-100 px-2 py-1 rounded">
                      <X size={14} /> Cancelar
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Título do Alerta</label>
                    <input 
                      type="text" 
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Ex: Atraso na Coleta"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Urgência</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setType('info')}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${type === 'info' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                      >
                        Informativo
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('warning')}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${type === 'warning' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                      >
                        Atenção
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('critical')}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${type === 'critical' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                      >
                        Crítico
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
                    <textarea 
                      required
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={4}
                      placeholder="Descreva o detalhe do aviso..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={sending}
                    className={`w-full text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 ${
                      editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    {sending ? <Loader2 className="animate-spin" /> : editingId ? <CheckCircle2 size={18} /> : <Send size={18} />}
                    {editingId ? 'Salvar Alterações' : `Emitir para ${user?.region}`}
                  </button>
                </form>

                {successMsg && (
                  <div className="mt-4 p-3 bg-green-100 text-green-700 text-sm rounded-lg flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 size={16} /> {successMsg}
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Alerts List (For Everyone) */}
        <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">Quadro de Avisos - {user?.region}</h3>
                 <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600 font-medium">
                   {alerts.length} Ativos
                 </span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="p-8 flex justify-center text-slate-400">
                    <Loader2 className="animate-spin" size={32} />
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <CheckCircle2 size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Nenhum alerta ativo para sua região no momento.</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className={`p-6 hover:bg-slate-50 transition-colors border-l-4 relative group ${
                      alert.type === 'critical' ? 'border-l-red-500' : alert.type === 'warning' ? 'border-l-amber-500' : 'border-l-blue-500'
                    } ${editingId === alert.id ? 'bg-amber-50' : ''}`}>
                      <div className="flex items-start gap-4 pr-8">
                        <div className={`p-2 rounded-full flex-shrink-0 ${getAlertStyles(alert.type)}`}>
                           {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                             <div className="flex items-center gap-2">
                               <h4 className="font-bold text-slate-800 text-lg">{alert.title}</h4>
                               {isAdmin && <span className="text-[10px] uppercase bg-slate-100 px-1 rounded text-slate-500">{alert.region}</span>}
                             </div>
                             <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{alert.createdAt}</span>
                          </div>
                          <p className="text-slate-600 mb-3 leading-relaxed">{alert.message}</p>
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                             <ShieldAlert size={12} />
                             Emitido por: {alert.createdBy}
                             {editingId === alert.id && <span className="text-amber-600 font-bold ml-2">(Editando...)</span>}
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="absolute top-4 right-4 flex gap-1">
                          <button 
                            onClick={() => handleEditClick(alert)}
                            disabled={editingId === alert.id}
                            className={`p-1 transition-colors ${editingId === alert.id ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}
                            title="Editar comunicado"
                          >
                             <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteAlert(alert.id)}
                            disabled={deletingId === alert.id}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="Remover comunicado"
                          >
                            {deletingId === alert.id ? <Loader2 size={18} className="animate-spin text-red-500" /> : <Trash2 size={18} />}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
           </div>

           {/* Dynamic Next Collection Card */}
           <div className="mt-6 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl text-white shadow-lg flex flex-col md:flex-row justify-between items-center transition-all animate-fadeIn">
               {nextCollection ? (
                 <>
                   <div className="mb-4 md:mb-0 flex items-center gap-4">
                     <div className="bg-white/10 p-3 rounded-full">
                       {getWasteIcon(nextCollection.wasteType)}
                     </div>
                     <div>
                       <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                         <Calendar size={18} className="text-green-400" />
                         Próxima Coleta Regular
                       </h3>
                       <p className="text-sm text-slate-300">
                         {nextCollection.wasteType} • {nextCollection.sector}
                       </p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-3xl font-bold text-green-400">{nextCollection.dayLabel}</p>
                     <p className="text-sm text-slate-400">{nextCollection.timeRange}</p>
                   </div>
                 </>
               ) : (
                 <div className="flex items-center gap-3 w-full justify-center opacity-70">
                    <Info size={24} />
                    <p>Nenhuma coleta agendada para os próximos dias nesta região.</p>
                 </div>
               )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default AlertsPanel;