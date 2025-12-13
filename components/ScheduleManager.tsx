import React, { useState, useEffect } from 'react';
import { User, CollectionSchedule } from '../types';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../services/scheduleService';
import { CalendarClock, Plus, Pencil, Trash2, Clock, MapPin, Loader2, Save, X, Trash, Leaf, Recycle, GlassWater } from 'lucide-react';

interface Props {
  user: User | null;
}

const DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
const TYPES = ['Reciclável', 'Orgânico', 'Vidro', 'Geral'];

const ScheduleManager: React.FC<Props> = ({ user }) => {
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dayOfWeek: DAYS[0],
    startTime: '08:00',
    endTime: '12:00',
    wasteType: TYPES[0] as any,
    sector: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, [user]);

  const loadSchedules = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getSchedules(user.region);
      setSchedules(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      dayOfWeek: DAYS[0],
      startTime: '08:00',
      endTime: '12:00',
      wasteType: TYPES[0] as any,
      sector: ''
    });
    setEditingId(null);
    setIsEditing(false);
  };

  const handleEditClick = (schedule: CollectionSchedule) => {
    setFormData({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      wasteType: schedule.wasteType,
      sector: schedule.sector
    });
    setEditingId(schedule.id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'organization') return;

    setSubmitting(true);
    try {
      if (editingId) {
        await updateSchedule(editingId, formData, user);
      } else {
        await createSchedule(formData, user);
      }
      await loadSchedules();
      resetForm();
    } catch (error) {
      alert("Erro ao salvar horário.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || user.role !== 'organization') return;
    if (!confirm("Remover este horário?")) return;

    try {
      await deleteSchedule(id, user);
      setSchedules(prev => prev.filter(s => s.id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      alert("Erro ao remover.");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Reciclável': return <Recycle className="text-blue-500" />;
      case 'Orgânico': return <Leaf className="text-green-500" />;
      case 'Vidro': return <GlassWater className="text-teal-500" />;
      default: return <Trash className="text-slate-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Reciclável': return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'Orgânico': return 'border-green-200 bg-green-50 text-green-800';
      case 'Vidro': return 'border-teal-200 bg-teal-50 text-teal-800';
      default: return 'border-slate-200 bg-slate-50 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarClock className="text-green-600" />
            Horários de Coleta
          </h2>
          <p className="text-slate-500">Confira a programação semanal para {user?.region}.</p>
        </div>
        {user?.role === 'organization' && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-900 transition-colors shadow-md"
          >
            <Plus size={16} /> Adicionar Horário
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Admin Form */}
        {user?.role === 'organization' && isEditing && (
          <div className="lg:col-span-1">
            <div className={`bg-white p-6 rounded-xl shadow-lg border-2 ${editingId ? 'border-amber-300' : 'border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  {editingId ? <Pencil size={18} className="text-amber-600" /> : <Plus size={18} />}
                  {editingId ? 'Editar Horário' : 'Novo Horário'}
                </h3>
                <button onClick={resetForm} className="text-slate-400 hover:text-red-500 p-1">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Dia da Semana</label>
                  <select 
                    value={formData.dayOfWeek}
                    onChange={e => setFormData({...formData, dayOfWeek: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Início</label>
                    <input 
                      type="time" 
                      required
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fim</label>
                    <input 
                      type="time" 
                      required
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Resíduo</label>
                  <select 
                    value={formData.wasteType}
                    onChange={e => setFormData({...formData, wasteType: e.target.value as any})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Setor / Abrangência</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Ruas Pares, Todo o Bairro..."
                    value={formData.sector}
                    onChange={e => setFormData({...formData, sector: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className={`w-full py-2.5 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2 ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {editingId ? 'Salvar Alterações' : 'Criar Horário'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Schedule List */}
        <div className={user?.role === 'organization' && isEditing ? "lg:col-span-2" : "lg:col-span-3"}>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={32} /></div>
          ) : schedules.length === 0 ? (
             <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
               <CalendarClock size={48} className="mx-auto mb-2 opacity-30" />
               <p>Nenhum horário cadastrado para esta região.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow relative group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-lg text-slate-800">{schedule.dayOfWeek}</span>
                    <div className={`px-2 py-1 rounded text-xs font-bold border flex items-center gap-1 ${getTypeColor(schedule.wasteType)}`}>
                      {getTypeIcon(schedule.wasteType)}
                      {schedule.wasteType}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock size={16} className="text-slate-400" />
                      <span className="font-medium">{schedule.startTime} - {schedule.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <MapPin size={16} className="text-slate-400" />
                      <span>{schedule.sector}</span>
                    </div>
                  </div>

                  {user?.role === 'organization' && (
                    <div className="absolute top-4 right-4 hidden group-hover:flex gap-1 bg-white shadow-sm p-1 rounded-lg border border-slate-100">
                      <button 
                        onClick={() => handleEditClick(schedule)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(schedule.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleManager;