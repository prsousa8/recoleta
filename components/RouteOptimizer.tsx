import React, { useState, useEffect } from 'react';
import { optimizeRouteWithAI, predictZoneStatus } from '../services/geminiService';
import { getPointsByRegion, addPoint, deletePoint, updatePointStatus } from '../services/collectionPointService';
import { CollectionPoint, BinStatus, OptimizedRoute, User } from '../types';
import { MapPin, Truck, CheckCircle, BrainCircuit, Activity, Loader2, Map as MapIcon, List, Plus, X, Trash2, Navigation, Edit2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import * as L from 'leaflet';

// Fix for default Leaflet icons in React
const createCustomIcon = (status: BinStatus) => {
  let colorClass = '';
  switch (status) {
    case BinStatus.OVERFLOWING: colorClass = 'bg-red-600 border-red-800'; break;
    case BinStatus.FULL: colorClass = 'bg-orange-500 border-orange-700'; break;
    case BinStatus.HALF: colorClass = 'bg-yellow-500 border-yellow-700'; break;
    default: colorClass = 'bg-green-600 border-green-800'; break;
  }

  // Ensure L.divIcon is available
  if (!L || !L.divIcon) return undefined;

  return L.divIcon({
    className: 'custom-pin',
    html: `<div class="w-6 h-6 rounded-full border-2 border-white shadow-lg ${colorClass}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Component to handle map center updates
const MapRecenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [lat, lng, map]);
  return null;
};

// Component to handle map clicks
const MapClickHandler = ({ 
  isAddingMode, 
  onMapClick 
}: { 
  isAddingMode: boolean; 
  onMapClick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      if (isAddingMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

interface RouteOptimizerProps {
  user: User | null;
}

const RouteOptimizer: React.FC<RouteOptimizerProps> = ({ user }) => {
  const [points, setPoints] = useState<CollectionPoint[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  
  // Use passed user prop instead of fetching locally to ensure correct session state

  // Admin "Add Point" State
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newPointCoords, setNewPointCoords] = useState<{lat: number, lng: number} | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [newType, setNewType] = useState<'Reciclável' | 'Orgânico' | 'Vidro'>('Reciclável');
  const [submittingPoint, setSubmittingPoint] = useState(false);

  // Default Center (São Paulo Centro)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.550520, -46.633308]);

  useEffect(() => {
    const fetchPoints = async () => {
        let region = 'Centro';
        if (user) region = user.region;

        const regionPoints = await getPointsByRegion(region);
        setPoints(regionPoints);

        // Adjust map center if points exist
        if (regionPoints.length > 0 && regionPoints[0].lat && regionPoints[0].lng) {
            setMapCenter([regionPoints[0].lat, regionPoints[0].lng]);
        } else if (region === 'Vila Madalena') {
            setMapCenter([-23.5568, -46.6865]);
        }
    };
    fetchPoints();
  }, [user]);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const result = await optimizeRouteWithAI(points);
      setOptimizedRoute(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrediction = async () => {
    setPredicting(true);
    try {
      const updatedPoints = await predictZoneStatus(points);
      setPoints(updatedPoints);
    } catch (error) {
      console.error(error);
    } finally {
      setPredicting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: BinStatus) => {
    try {
        await updatePointStatus(id, newStatus);
        setPoints(prev => prev.map(p => {
            if (p.id === id) {
                // If set to empty, update last collected immediately in UI
                const updatedLastCollection = newStatus === BinStatus.EMPTY ? 'Hoje' : p.lastCollection;
                return { ...p, status: newStatus, lastCollection: updatedLastCollection };
            }
            return p;
        }));
    } catch (error) {
        console.error("Failed to update status", error);
        alert("Erro ao atualizar status");
    }
  };

  const handleAddPointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPointCoords) return;

    // Strict Admin Check
    if (user.role !== 'organization') {
      alert("Apenas administradores podem adicionar pontos de coleta.");
      return;
    }

    setSubmittingPoint(true);
    try {
        const added = await addPoint({
            address: newAddress,
            type: newType,
            status: BinStatus.EMPTY,
            region: user.region,
            lat: newPointCoords.lat,
            lng: newPointCoords.lng
        }, user);

        setPoints([...points, added]);
        setNewPointCoords(null);
        setNewAddress('');
        setIsAddingMode(false);
    } catch (error) {
        alert("Erro ao adicionar ponto");
    } finally {
        setSubmittingPoint(false);
    }
  };

  const handleDeletePoint = async (id: string) => {
      if (!user || user.role !== 'organization') return;
      if (!confirm("Remover este ponto de coleta?")) return;

      await deletePoint(id, user);
      setPoints(prev => prev.filter(p => p.id !== id));
  };

  const getStatusColor = (status: BinStatus) => {
    switch (status) {
      case BinStatus.OVERFLOWING: return 'text-red-600 bg-red-100 border-red-200';
      case BinStatus.FULL: return 'text-orange-600 bg-orange-100 border-orange-200';
      case BinStatus.HALF: return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-green-600 bg-green-100 border-green-200';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn h-[calc(100vh-140px)] flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="text-green-600" />
            Logística Inteligente
          </h2>
          <p className="text-slate-500 mt-1">
            Gestão de pontos de coleta e otimização de rotas.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <List size={16} /> Lista
            </button>
            <button 
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'map' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <MapIcon size={16} /> Mapa
            </button>
        </div>
      </header>

      {/* Main Content */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1 overflow-hidden">
            {/* Status atual dos pontos */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-full overflow-hidden">
            <div className="flex flex-wrap gap-3 justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-lg font-semibold">Monitoramento de Pontos</h3>
                <div className="flex gap-2">
                <button 
                    onClick={handlePrediction}
                    disabled={predicting}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 text-xs font-medium"
                >
                    {predicting ? <Loader2 className="animate-spin" size={14} /> : <BrainCircuit size={14} />}
                    Previsão IA
                </button>
                <button 
                    onClick={handleOptimize}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 text-xs font-medium"
                >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                    Otimizar Rota
                </button>
                </div>
            </div>
            
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                {points.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <MapIcon className="mx-auto mb-2 opacity-50" size={32} />
                        <p>Nenhum ponto de coleta registrado nesta região.</p>
                        {user?.role === 'organization' && <p className="text-xs mt-2 text-blue-500">Vá para a aba "Mapa" para adicionar pontos.</p>}
                    </div>
                ) : (
                    points.map((point) => (
                    <div key={point.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${point.type === 'Reciclável' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-800'}`}>
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-700 text-sm">{point.address}</p>
                                    <p className="text-xs text-slate-500">{point.type} • Coletado: {point.lastCollection}</p>
                                </div>
                            </div>
                            
                            {/* Admin Status Control (List View) */}
                            {user?.role === 'organization' ? (
                                <select
                                    value={point.status}
                                    onChange={(e) => handleStatusChange(point.id, e.target.value as BinStatus)}
                                    className={`px-2 py-1 rounded-md text-xs font-bold border outline-none cursor-pointer ${getStatusColor(point.status)} focus:ring-2 focus:ring-offset-1 focus:ring-slate-300`}
                                >
                                    {Object.values(BinStatus).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(point.status)}`}>
                                    {point.status}
                                </span>
                            )}
                        </div>
                        {point.predictedLevel && (
                            <div className="mt-2 flex items-center gap-2 text-xs bg-white p-2 rounded border border-purple-100 text-purple-700">
                                <Activity size={12} />
                                <span className="font-semibold">Previsão IA (24h):</span> 
                                {point.predictedLevel}
                            </div>
                        )}
                        {user?.role === 'organization' && (
                            <div className="mt-2 flex justify-end gap-2 border-t border-slate-200 pt-2">
                                <button onClick={() => handleDeletePoint(point.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                                    <Trash2 size={12} /> Remover
                                </button>
                            </div>
                        )}
                    </div>
                    ))
                )}
            </div>
            </div>

            {/* Resultado da Otimização */}
            <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6 flex flex-col h-full overflow-hidden">
                <h3 className="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2 flex-shrink-0">
                    <Navigation size={20} />
                    Rota Automática (ONG)
                </h3>
                
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <Loader2 className="animate-spin" size={48} />
                    <p>Calculando melhor trajeto com IA...</p>
                    </div>
                ) : optimizedRoute ? (
                    <div className="space-y-6 animate-fadeIn flex-1 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4 border-b border-slate-700 pb-4">
                            <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Tempo Estimado</p>
                            <p className="text-2xl font-bold">{optimizedRoute.estimatedTime}</p>
                            </div>
                            <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Economia Km</p>
                            <p className="text-2xl font-bold text-green-400">{optimizedRoute.distanceSaved}</p>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex gap-3">
                            <div className="mt-1"><BrainCircuit size={16} className="text-purple-400" /></div>
                            <p className="text-sm text-slate-300 italic">"{optimizedRoute.reasoning}"</p>
                        </div>

                        <div className="space-y-4 relative pl-4 border-l-2 border-green-500/30 pb-4">
                            {optimizedRoute.points.map((point, idx) => (
                            <div key={point.id} className="relative group">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                <p className="text-sm font-semibold text-slate-200">{idx + 1}. {point.address}</p>
                                <p className="text-xs text-slate-400">Prioridade: {point.status}</p>
                            </div>
                            ))}
                            <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-500 rounded-full border-2 border-slate-900"></div>
                            <p className="text-sm font-semibold text-slate-500">Retorno à base (Cooperativa)</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-60 border-2 border-dashed border-slate-700 rounded-xl m-4">
                    <Truck size={48} className="mb-2" />
                    <p>Selecione 'Otimizar Rota' para iniciar</p>
                    </div>
                )}
            </div>
        </div>
      ) : (
          /* REAL MAP VIEW USING LEAFLET */
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative flex-1 flex flex-col z-0">
              {/* Map Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center z-10 flex-shrink-0">
                  <div className="flex items-center gap-2 text-slate-600">
                      <MapPin size={18} />
                      <span className="font-bold text-sm">Região: {user?.region || 'Carregando...'}</span>
                  </div>
                  {user?.role === 'organization' && (
                      <button 
                        onClick={() => {
                            setIsAddingMode(!isAddingMode);
                            setNewPointCoords(null);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors ${isAddingMode ? 'bg-red-100 text-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                          {isAddingMode ? <X size={14} /> : <Plus size={14} />}
                          {isAddingMode ? 'Cancelar Adição' : 'Adicionar Ponto'}
                      </button>
                  )}
              </div>
              
              {/* React Leaflet Map */}
              <div className="flex-1 relative z-0">
                 {isAddingMode && user?.role === 'organization' && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-4 py-2 rounded-full shadow-lg pointer-events-none animate-bounce z-[1000] flex items-center gap-2">
                          <MapPin size={14} />
                          Clique no mapa para posicionar o novo ponto
                      </div>
                 )}
                 
                 <MapContainer 
                    center={mapCenter} 
                    zoom={14} 
                    style={{ height: '100%', width: '100%' }}
                 >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    <MapRecenter lat={mapCenter[0]} lng={mapCenter[1]} />
                    
                    <MapClickHandler 
                        isAddingMode={isAddingMode && user?.role === 'organization'} 
                        onMapClick={(lat, lng) => setNewPointCoords({ lat, lng })}
                    />

                    {points.map(point => {
                        if (!point.lat || !point.lng) return null;
                        
                        const icon = createCustomIcon(point.status);
                        if (!icon) return null;

                        return (
                            <Marker 
                                key={point.id} 
                                position={[point.lat, point.lng]}
                                icon={icon}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-1 min-w-[150px]">
                                        <h3 className="font-bold text-slate-800 text-sm mb-1">{point.address}</h3>
                                        <div className="text-xs space-y-1">
                                            <p className="text-slate-600">Tipo: <b>{point.type}</b></p>
                                            
                                            <div className="text-slate-600 flex flex-col gap-1">
                                                <span>Status:</span> 
                                                {/* Admin Status Control (Map Popup) */}
                                                {user?.role === 'organization' ? (
                                                    <select
                                                        value={point.status}
                                                        onChange={(e) => handleStatusChange(point.id, e.target.value as BinStatus)}
                                                        className={`w-full px-1 py-1 rounded text-xs border cursor-pointer ${getStatusColor(point.status)}`}
                                                    >
                                                        {Object.values(BinStatus).map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`px-1 rounded text-[10px] border w-fit ${getStatusColor(point.status)}`}>
                                                        {point.status}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <p className="text-slate-400 mt-1">Coletado: {point.lastCollection}</p>
                                            
                                            {user?.role === 'organization' && (
                                                <button 
                                                    onClick={() => handleDeletePoint(point.id)}
                                                    className="mt-2 text-red-600 underline w-full text-left"
                                                >
                                                    Remover Ponto
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {newPointCoords && L.divIcon && (
                        <Marker 
                            position={[newPointCoords.lat, newPointCoords.lng]}
                            icon={createCustomIcon(BinStatus.EMPTY)!}
                        />
                    )}
                 </MapContainer>
              </div>

              {/* Add Point Form Modal (Overlay) - Strict Admin Check */}
              {newPointCoords && user?.role === 'organization' && (
                  <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-white p-5 rounded-2xl shadow-2xl border border-slate-200 z-[1001] animate-scaleIn">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2">
                             <MapPin size={18} className="text-blue-600" />
                             Novo Ponto
                          </h4>
                          <button onClick={() => setNewPointCoords(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full"><X size={16} /></button>
                      </div>
                      <form onSubmit={handleAddPointSubmit} className="space-y-4">
                          <div className="bg-slate-50 p-2 rounded text-xs text-slate-500 mb-2">
                              Lat: {newPointCoords.lat.toFixed(5)}, Lng: {newPointCoords.lng.toFixed(5)}
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 mb-1 block">Endereço / Referência</label>
                              <input 
                                type="text" required autoFocus
                                value={newAddress} onChange={e => setNewAddress(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ex: Esquina da Padaria"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 mb-1 block">Tipo de Resíduo</label>
                              <select 
                                value={newType} onChange={e => setNewType(e.target.value as any)}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-white"
                              >
                                  <option value="Reciclável">Reciclável</option>
                                  <option value="Orgânico">Orgânico</option>
                                  <option value="Vidro">Vidro</option>
                              </select>
                          </div>
                          <button 
                            type="submit" 
                            disabled={submittingPoint}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-transform active:scale-95"
                          >
                             {submittingPoint ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                             Confirmar Localização
                          </button>
                      </form>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default RouteOptimizer;