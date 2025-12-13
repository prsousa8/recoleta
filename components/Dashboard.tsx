import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserStats } from '../types';
import { Leaf, Award, Recycle, TrendingUp, DollarSign, Zap, CloudRain } from 'lucide-react';

interface DashboardProps {
  stats: UserStats;
}

const data = [
  { name: 'Seg', reciclado: 2, lixo: 4 },
  { name: 'Ter', reciclado: 3, lixo: 3 },
  { name: 'Qua', reciclado: 5, lixo: 2 },
  { name: 'Qui', reciclado: 4, lixo: 3 },
  { name: 'Sex', reciclado: 6, lixo: 2 },
  { name: 'Sáb', reciclado: 8, lixo: 1 },
  { name: 'Dom', reciclado: 7, lixo: 1 },
];

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Painel de Impacto 🌍</h2>
          <p className="text-slate-500">Métricas de sustentabilidade e engajamento da comunidade.</p>
        </div>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">
          ONG Verde Vida: Parceiro Verificado
        </div>
      </header>

      {/* Main KPI Grid - Impact Focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
             <CloudRain size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-emerald-100">
              <CloudRain size={20} />
              <span className="text-sm font-medium">CO₂ Evitado</span>
            </div>
            <p className="text-3xl font-bold">{stats.co2Saved} kg</p>
            <p className="text-xs mt-2 text-emerald-200">Equivalente a {Math.floor(stats.co2Saved / 10)} km de carro</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-slate-500">
            <DollarSign size={20} className="text-yellow-600" />
            <span className="text-sm font-medium">Economia Pública</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">R$ 450,00</p>
          <p className="text-xs mt-2 text-green-600 flex items-center gap-1">
             <TrendingUp size={12} /> +12% vs mês anterior
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2 text-slate-500">
            <Recycle size={20} className="text-blue-600" />
            <span className="text-sm font-medium">Resíduos Desviados</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.recycledKg} kg</p>
           <p className="text-xs mt-2 text-slate-400">De aterros sanitários</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2 text-slate-500">
            <Zap size={20} className="text-orange-500" />
            <span className="text-sm font-medium">Energia Poupada</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.energySaved}</p>
          <p className="text-xs mt-2 text-slate-400">Suficiente para 4 casas/dia</p>
        </div>
      </div>

      {/* Chart & Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Coleta Diária (ONG View)</h3>
            <select className="text-sm border-slate-200 rounded-md bg-slate-50 p-1">
               <option>Esta Semana</option>
               <option>Mês Passado</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="reciclado" name="Reciclagem (kg)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="lixo" name="Resíduo Comum (kg)" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Status da Gamificação</h3>
          <div className="flex items-center gap-4 mb-6">
             <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl border-4 border-green-100">
                {stats.level}
             </div>
             <div>
                <p className="text-sm text-slate-500">Nível Atual</p>
                <p className="font-bold text-slate-800">Reciclador Expert</p>
             </div>
          </div>
          
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Distintivos Recentes</h4>
          <div className="grid grid-cols-2 gap-3">
            {stats.badges.map((badge, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg text-center border border-slate-100 hover:border-green-200 transition-colors">
                <div className="text-xl mb-1">🏅</div>
                <div className="text-xs font-medium text-slate-600 leading-tight">{badge}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;