
import React from 'react';
import { Home, Package, Users, UserCircle, LogOut, Bell, Shield, CalendarClock, Lightbulb } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onLogout: () => void;
  userRole: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isMobileOpen, 
  setIsMobileOpen, 
  onLogout,
  userRole 
}) => {
  
  // Revised Menu Items for the "Pilot" MVP
  const menuItems = [
    { 
      id: 'home', 
      label: 'Início', 
      icon: Home,
      roles: ['resident', 'organization'] 
    },
    { 
      id: 'requests', 
      label: userRole === 'organization' ? 'Gestão de Coletas' : 'Minhas Coletas', 
      icon: Package,
      roles: ['resident', 'organization']
    },
    { 
      id: 'community', 
      label: 'Comunidade', 
      icon: Users,
      roles: ['resident', 'organization'] // Now open to Residents (View Only)
    },
    { 
      id: 'tips', 
      label: 'Dicas & Ideias', 
      icon: Lightbulb,
      roles: ['resident', 'organization']
    },
    { 
      id: 'schedules', 
      label: 'Horários', 
      icon: CalendarClock,
      roles: ['resident', 'organization']
    },
    { 
      id: 'profile', 
      label: 'Meu Perfil', 
      icon: UserCircle,
      roles: ['resident', 'organization']
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">
            R
          </div>
          <div>
             <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">reColeta</h1>
             <span className="text-[10px] text-slate-500 font-medium">Eco Comunidade</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (!item.roles.includes(userRole)) return null;

            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-green-50 text-green-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-green-600' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
           {userRole === 'organization' && (
              <div className="px-4 py-2 bg-slate-800 text-white rounded text-xs flex items-center gap-2">
                 <Shield size={12} /> Painel Gestor
              </div>
           )}
           <button 
             onClick={onLogout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
           >
             <LogOut size={20} />
             Sair
           </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
