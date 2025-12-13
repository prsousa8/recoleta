import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { getAllUsers, deleteUser } from '../services/authService';
import { Trash2, User as UserIcon, Shield, Search, Loader2, AlertCircle, MapPin } from 'lucide-react';

interface UserManagementProps {
  currentUser: User | null;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Erro ao carregar usuários", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingId(userId);
    try {
      const success = await deleteUser(userId);
      if (success) {
        setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
      } else {
        alert("Não foi possível encontrar o usuário para remoção.");
      }
    } catch (error) {
      console.error("Erro na remoção:", error);
      alert("Erro ao remover usuário. Tente recarregar a página.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtragem estrita por Região do Admin + Termo de Busca
  const filteredUsers = useMemo(() => {
    let result = users;

    // 1. Filtrar estritamente pela Região do Admin
    if (currentUser) {
      result = result.filter(u => u.region === currentUser.region);
    }

    // 2. Filtrar pelo Termo de Busca
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(user => {
        const name = (user.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        return name.includes(term) || email.includes(term);
      });
    }

    return result;
  }, [users, searchTerm, currentUser]);

  const residents = filteredUsers.filter(u => u.role === 'resident');
  const admins = filteredUsers.filter(u => u.role === 'organization');

  return (
    <div className="space-y-6 animate-fadeIn">
      <header>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              Gestão de Usuários
            </h2>
            <p className="text-slate-500">
              Gerencie moradores e acessos da sua região.
            </p>
          </div>
          {currentUser && (
             <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-blue-200">
               <MapPin size={14} /> Região: {currentUser.region}
             </div>
          )}
        </div>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 outline-none text-sm text-slate-700 bg-transparent placeholder-slate-400"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          
          {/* Residents List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserIcon className="text-blue-500" size={20} />
                Moradores ({residents.length})
              </h3>
            </div>
            
            {residents.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                {searchTerm ? 'Nenhum morador encontrado.' : `Nenhum morador cadastrado na região ${currentUser?.region}.`}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {residents.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800">{user.name}</p>
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 flex items-center gap-1 border border-slate-200">
                             <MapPin size={10} /> {user.region}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDelete(user.id, user.name)}
                      disabled={deletingId === user.id}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remover Usuário"
                      type="button"
                    >
                      {deletingId === user.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admins List (Read Only or limited deletion) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden opacity-90">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-green-50">
              <h3 className="font-bold text-green-800 flex items-center gap-2">
                <Shield className="text-green-600" size={20} />
                Administradores ({admins.length})
              </h3>
            </div>
            
            <div className="divide-y divide-slate-100">
                {admins.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="font-semibold text-slate-800">{user.name}</p>
                           <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded flex items-center gap-1 border border-green-200">
                             <MapPin size={10} /> {user.region}
                           </span>
                        </div>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">
                      GESTOR
                    </span>
                  </div>
                ))}
            </div>
            {admins.length === 0 && (
                 <div className="p-4 text-center text-xs text-slate-400">Nenhum outro administrador nesta região.</div>
            )}
            <div className="p-3 bg-slate-50 text-xs text-slate-500 flex items-center gap-2">
               <AlertCircle size={14} />
               Administradores não podem ser removidos por esta tela de segurança.
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default UserManagement;