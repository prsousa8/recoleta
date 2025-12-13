
import React, { useState, useRef, useEffect } from 'react';
import { User, CollectionRequest, ItemCategory, ActionType } from '../types';
import { createRequest, getUserRequests, deleteRequest, updateRequest, updateRequestStatus } from '../services/requestService';
import { shareRequestAsPost } from '../services/communityService';
import { Camera, MapPin, Calendar, ArrowRight, ArrowLeft, CheckCircle2, Package, Loader2, Clock, Trash2, Upload, Pencil, X, Share2, Megaphone, ShieldCheck, Filter, User as UserIcon } from 'lucide-react';

interface RequestCollectionProps {
  user: User | null;
  onBackToHome: () => void;
}

const RequestCollection: React.FC<RequestCollectionProps> = ({ user, onBackToHome }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CollectionRequest[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  
  // Feedback state
  const [operationSuccess, setOperationSuccess] = useState<string | null>(null);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Data
  const [category, setCategory] = useState<ItemCategory>('Reciclável');
  const [actionType, setActionType] = useState<ActionType>('Descartar');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  
  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If Admin/Condo, default to History View (Management View)
    if (user?.role === 'organization') {
        setShowHistory(true);
        loadHistory();
    } else if (user && showHistory) {
        loadHistory();
    }
  }, [user, showHistory]);

  const loadHistory = async () => {
    if (!user) return;
    setViewLoading(true);
    try {
      const data = await getUserRequests(user);
      setHistory(data);
    } finally {
      setViewLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedImage(null);
    setCategory('Reciclável');
    setActionType('Descartar');
    setDescription('');
    setScheduledAt('');
    setIsEditing(false);
    setEditingId(null);
    setOperationSuccess(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleEdit = (req: CollectionRequest) => {
    setIsEditing(true);
    setEditingId(req.id);
    
    // Populate Form
    setSelectedImage(req.photoUrl);
    setCategory(req.category);
    setActionType(req.actionType);
    setDescription(req.description);
    if (req.scheduledAt) {
       try {
         const date = new Date(req.scheduledAt);
         const formatted = date.toISOString().slice(0, 16);
         setScheduledAt(formatted);
       } catch(e) {
         setScheduledAt('');
       }
    } else {
        setScheduledAt('');
    }

    setShowHistory(false);
    setStep(1);
  };

  const handleDelete = async (reqId: string) => {
    if (!user) return;
    if (!confirm("Tem certeza que deseja remover esta solicitação?")) return;
    
    setViewLoading(true);
    try {
        await deleteRequest(reqId, user);
        await loadHistory();
    } catch (e) {
        alert("Erro ao remover solicitação.");
    } finally {
        setViewLoading(false);
    }
  };

  const handleShare = async (req: CollectionRequest) => {
      if (!user) return;
      if (req.actionType === 'Descartar') {
          alert("Itens de descarte são enviados apenas para a administração do condomínio.");
          return;
      }
      if (!confirm("Reenviar este item para a comunidade?")) return;
      
      try {
          await shareRequestAsPost(req, user);
          alert("Item compartilhado com sucesso!");
      } catch (e) {
          alert("Erro ao compartilhar.");
      }
  };

  const handleMarkCollected = async (reqId: string) => {
      if (!user || user.role !== 'organization') return;

      setViewLoading(true);
      try {
          // Setting status to 'collected' triggers the ranking calculation in gamificationService
          await updateRequestStatus(reqId, 'collected');
          
          setOperationSuccess("Coleta confirmada! Ranking do morador atualizado.");
          setTimeout(() => setOperationSuccess(null), 4000);
          
          // Refresh list to show updated status
          await loadHistory();
      } catch (e) {
          alert("Erro ao atualizar status.");
      } finally {
          setViewLoading(false);
      }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        photoUrl: selectedImage || 'https://via.placeholder.com/300?text=Sem+Imagem',
        category,
        actionType,
        description,
        scheduledAt: scheduledAt || new Date().toISOString(),
        address: user.address || 'Endereço não informado'
      };

      let req: CollectionRequest;

      if (isEditing && editingId) {
        req = await updateRequest(editingId, payload, user);
      } else {
        req = await createRequest(payload, user);
      }
      
      if (!isEditing && (actionType === 'Doar' || actionType === 'Vender')) {
          await shareRequestAsPost(req, user);
      }
      
      setStep(4);
    } catch (e) {
      alert("Erro ao salvar solicitação");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-slate-100 text-slate-600';
      case 'queued': return 'bg-blue-100 text-blue-600';
      case 'in_route': return 'bg-amber-100 text-amber-700';
      case 'collected': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-red-100 text-red-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created': return 'Aguardando';
      case 'queued': return 'Na Fila';
      case 'in_route': return 'Em Rota';
      case 'collected': return 'Feito'; // Changed label to "Feito" as requested implicitly
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // --- View Mode: History / Management ---
  if (showHistory) {
    return (
      <div className="animate-fadeIn space-y-4 pb-20">
        <header className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-3">
             <button onClick={() => {
                 if (user?.role === 'organization') onBackToHome();
                 else setShowHistory(false);
             }} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <ArrowLeft size={20} className="text-slate-600" />
             </button>
             <div>
                <h2 className="text-xl font-bold text-slate-800">
                    {user?.role === 'organization' ? 'Gestão de Solicitações' : 'Minhas Solicitações'}
                </h2>
                <p className="text-xs text-slate-500">
                    {user?.role === 'organization' ? `Gerencie as coletas de ${user.region}` : 'Acompanhe seus descartes'}
                </p>
             </div>
           </div>
           {/* Only show "New" button in history view for residents */}
           {user?.role === 'resident' && (
             <button onClick={() => setShowHistory(false)} className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm">
                Nova Coleta
             </button>
           )}
        </header>
        
        {operationSuccess && (
            <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-scaleIn shadow-sm">
                <div className="bg-green-200 p-1 rounded-full"><CheckCircle2 size={16} className="text-green-700" /></div>
                <span className="font-medium text-sm">{operationSuccess}</span>
            </div>
        )}

        {viewLoading ? (
           <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={32} /></div>
        ) : history.length === 0 ? (
           <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100">
             <Package size={48} className="mx-auto mb-3 opacity-30" />
             <p>Nenhuma solicitação encontrada nesta região.</p>
           </div>
        ) : (
           <div className="space-y-4">
              {history.map(req => {
                 const isEditable = (req.status === 'created' || req.status === 'queued') && user?.role === 'resident';
                 const isPublic = req.actionType === 'Doar' || req.actionType === 'Vender';
                 const isAdmin = user?.role === 'organization';
                 const isCollected = req.status === 'collected';
                 
                 return (
                 <div key={req.id} className={`p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 group transition-all ${isCollected ? 'bg-green-50/50 border-green-200 opacity-80' : 'bg-white border-slate-100'}`}>
                    <div className="flex gap-4 flex-1">
                        <div className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                            <img src={req.photoUrl} alt="Item" className={`w-full h-full object-cover transition-all ${isCollected ? 'grayscale-[0.5]' : ''}`} />
                            {isCollected && (
                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="text-white drop-shadow-md" size={24} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`font-bold text-sm ${isCollected ? 'text-green-900' : 'text-slate-800'}`}>{req.category}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(req.status)}`}>
                                    {getStatusLabel(req.status)}
                                </span>
                            </div>
                            
                            {/* Admin View Details */}
                            {isAdmin && (
                                <div className="mb-2 bg-slate-50 p-2 rounded border border-slate-100">
                                    <p className="text-xs text-slate-800 font-bold flex items-center gap-1">
                                        <UserIcon size={12} className="text-slate-500" /> {req.userName}
                                    </p>
                                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                        <MapPin size={10} /> {req.address}
                                    </p>
                                </div>
                            )}

                            <p className="text-xs text-slate-500 mb-2 truncate">{req.description}</p>
                            
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Clock size={12}/> {new Date(req.createdAt).toLocaleDateString()}</span>
                                <span className={`font-medium px-1.5 py-0.5 rounded ${isPublic ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{req.actionType}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons Section */}
                    <div className="flex md:flex-col justify-end gap-2 md:border-l md:border-slate-100 md:pl-4">
                        {/* Admin Action: Mark Collected */}
                        {isAdmin && !isCollected && (
                            <button 
                                onClick={() => handleMarkCollected(req.id)}
                                className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 hover:shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                                <CheckCircle2 size={14} /> Aceitar Coleta
                            </button>
                        )}
                        {isAdmin && isCollected && (
                            <span className="flex-1 md:flex-none px-3 py-1.5 text-xs font-bold text-green-700 flex items-center justify-center gap-1 bg-green-50 rounded border border-green-100 shadow-sm whitespace-nowrap">
                                <CheckCircle2 size={12} /> Coletado
                            </span>
                        )}

                        {/* Edit/Delete/Share Actions */}
                        {isEditable && (
                            <div className="flex gap-2">
                                {isPublic && (
                                    <button onClick={() => handleShare(req)} className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100" title="Reenviar">
                                        <Share2 size={16} />
                                    </button>
                                )}
                                <button onClick={() => handleEdit(req)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Editar">
                                    <Pencil size={16} />
                                </button>
                                <button onClick={() => handleDelete(req.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Excluir">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                 </div>
              )})}
           </div>
        )}
      </div>
    );
  }

  // --- View Mode: Success (Only for Residents submitting) ---
  if (step === 4) {
    const isPublic = actionType === 'Doar' || actionType === 'Vender';
    
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fadeIn p-6">
         <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-scaleIn">
            <CheckCircle2 size={40} />
         </div>
         <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {isEditing ? 'Atualização Realizada!' : 'Solicitação Enviada!'}
         </h2>
         <p className="text-slate-500 mb-4 max-w-xs">
           {isEditing 
             ? 'Seus dados foram atualizados com sucesso.' 
             : 'Sua solicitação foi registrada.'}
         </p>
         
         <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8 max-w-xs w-full text-sm">
            {isPublic ? (
                <div className="flex items-start gap-3 text-left">
                    <Megaphone className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                        <p className="font-bold text-slate-800">Publicado na Comunidade</p>
                        <p className="text-slate-500 text-xs">Seu anúncio de "{actionType}" já está visível para os vizinhos no feed.</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 text-left">
                    <ShieldCheck className="text-green-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                        <p className="font-bold text-slate-800">Enviado para o Condomínio</p>
                        <p className="text-slate-500 text-xs">Sua solicitação de descarte será gerenciada pela administração.</p>
                    </div>
                </div>
            )}
         </div>

         <div className="flex flex-col w-full max-w-xs gap-3">
            <button 
              onClick={() => { 
                  resetForm();
                  setShowHistory(true); 
              }}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors"
            >
              Ver Minhas Solicitações
            </button>
            <button 
              onClick={onBackToHome}
              className="w-full py-3 text-slate-600 font-medium hover:text-slate-800 transition-colors"
            >
              Voltar ao Início
            </button>
         </div>
      </div>
    );
  }

  // --- View Mode: Wizard Form ---
  return (
    <div className="animate-fadeIn flex flex-col h-full">
       <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <button onClick={() => {
                if (isEditing) {
                    resetForm();
                    setShowHistory(true);
                } else {
                    onBackToHome();
                }
             }} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <ArrowLeft size={20} className="text-slate-600" />
             </button>
             <h2 className="text-xl font-bold text-slate-800">
                {isEditing ? 'Editar Coleta' : 'Nova Coleta'}
             </h2>
          </div>
          {!isEditing && (
             <button onClick={() => setShowHistory(true)} className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
               Histórico
             </button>
          )}
          {isEditing && (
             <button onClick={() => { resetForm(); setShowHistory(true); }} className="text-sm font-bold text-slate-400">
               Cancelar
             </button>
          )}
       </header>

       {/* Progress Bar */}
       <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => (
             <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= i ? 'bg-green-600' : 'bg-slate-200'}`} />
          ))}
       </div>

       <div className="flex-1 overflow-y-auto">
          {/* STEP 1: PHOTO */}
          {step === 1 && (
             <div className="space-y-6">
                <div className="text-center">
                   <h3 className="text-lg font-bold text-slate-800 mb-2">O que vamos coletar?</h3>
                   <p className="text-slate-500 text-sm">Tire uma foto ou faça upload para identificação.</p>
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />

                <div 
                   onClick={triggerFileInput}
                   className={`aspect-square w-full max-w-xs mx-auto rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
                     selectedImage ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                   }`}
                >
                   {loading ? (
                      <Loader2 className="animate-spin text-green-600" size={40} />
                   ) : selectedImage ? (
                      <>
                        <img src={selectedImage} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-bold text-sm">Trocar Foto</p>
                        </div>
                        <button 
                          onClick={clearImage}
                          className="absolute bottom-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                          title="Remover foto"
                        >
                           <Trash2 size={20} />
                        </button>
                      </>
                   ) : (
                      <>
                        <Camera size={48} className="text-slate-400 mb-2" />
                        <p className="text-sm font-medium text-slate-500">Tocar para fotografar</p>
                        <p className="text-xs text-slate-400 mt-1">ou enviar da galeria</p>
                      </>
                   )}
                </div>

                <div className="mt-8">
                   <button 
                     disabled={!selectedImage}
                     onClick={() => setStep(2)}
                     className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform active:scale-95"
                   >
                     Continuar <ArrowRight size={18} />
                   </button>
                </div>
             </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
             <div className="space-y-6">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Categoria do Item</label>
                   <div className="grid grid-cols-2 gap-3">
                      {(['Reciclável', 'Eletrônico', 'Móvel', 'Óleo', 'Outro'] as ItemCategory[]).map(cat => (
                         <button
                           key={cat}
                           onClick={() => setCategory(cat)}
                           className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                              category === cat ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                           }`}
                         >
                            {cat}
                         </button>
                      ))}
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">O que deseja fazer?</label>
                   <div className="flex gap-3">
                      {(['Descartar', 'Doar', 'Vender'] as ActionType[]).map(act => (
                         <button
                           key={act}
                           onClick={() => setActionType(act)}
                           className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                              actionType === act ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                           }`}
                         >
                            {act}
                         </button>
                      ))}
                   </div>
                   <p className="text-xs text-slate-500 mt-2">
                       {actionType === 'Descartar' 
                         ? 'Itens de descarte são enviados apenas para o condomínio.' 
                         : 'Itens para doação ou venda serão publicados na comunidade.'}
                   </p>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Descrição Breve</label>
                   <textarea 
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none text-sm"
                     placeholder="Ex: Sofá de 2 lugares, um pouco rasgado..."
                   />
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setStep(1)}
                        className="py-3.5 px-6 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Voltar
                    </button>
                    <button 
                        onClick={() => setStep(3)}
                        disabled={!description}
                        className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-95"
                    >
                        Continuar <ArrowRight size={18} />
                    </button>
                </div>
             </div>
          )}

          {/* STEP 3: SCHEDULE & ADDRESS */}
          {step === 3 && (
             <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                   <div className="w-16 h-16 bg-slate-200 rounded-lg flex-shrink-0 overflow-hidden">
                       {selectedImage && <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />}
                   </div>
                   <div>
                       <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Resumo</h4>
                       <p className="font-bold text-slate-800 text-sm">{category} • {actionType}</p>
                       <p className="text-xs text-slate-500 truncate max-w-[200px]">{description}</p>
                   </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Endereço de Retirada</h4>
                   <div className="flex items-start gap-3">
                      <MapPin className="text-green-600 mt-0.5" size={18} />
                      <div>
                         <p className="font-bold text-slate-800 text-sm">{user?.address || 'Endereço principal'}</p>
                         <p className="text-xs text-slate-500">{user?.region} - {user?.role === 'organization' ? 'Condomínio' : 'Residencial'}</p>
                      </div>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Agendar Data/Hora (Opcional)</label>
                   <input 
                     type="datetime-local" 
                     value={scheduledAt}
                     onChange={(e) => setScheduledAt(e.target.value)}
                     className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm"
                   />
                   <p className="text-xs text-slate-500 mt-2">
                      Se deixar em branco, entraremos em contato para agendar a melhor rota.
                   </p>
                </div>

                <div className="pt-4 flex gap-3">
                   <button 
                        onClick={() => setStep(2)}
                        className="py-3.5 px-6 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Voltar
                   </button>
                   <button 
                     onClick={handleSubmit}
                     disabled={loading}
                     className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-transform active:scale-95"
                   >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                      {isEditing ? 'Salvar Alterações' : 'Confirmar Solicitação'}
                   </button>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

export default RequestCollection;
