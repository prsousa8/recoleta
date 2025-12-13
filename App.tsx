
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HomeFeed from './components/HomeFeed';
import RequestCollection from './components/RequestCollection';
import CommunityHub from './components/CommunityHub';
import ScheduleManager from './components/ScheduleManager';
import ProfilePage from './components/ProfilePage';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import RecyclingTips from './components/RecyclingTips';
import { User } from './types';
import { getActiveSession, logoutUser } from './services/authService';
import { Menu, ArrowLeft, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'register' | 'app'>('landing');
  const [loadingSession, setLoadingSession] = useState(true);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('home');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sessionUser = getActiveSession();
    if (sessionUser) {
      setUser(sessionUser);
      setCurrentView('app');
    }
    setLoadingSession(false);
  }, []);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setCurrentView('app');
    setActiveTab('home');
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setCurrentView('landing');
    setActiveTab('home');
  };

  if (loadingSession) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );
  }

  if (currentView === 'landing') {
    return <LandingPage onLogin={() => setCurrentView('login')} onRegister={() => setCurrentView('register')} />;
  }

  if (currentView === 'login' || currentView === 'register') {
    return (
      <AuthPage 
        initialMode={currentView}
        onSuccess={handleAuthSuccess}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  // --- Main App Layout ---
  
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeFeed 
            user={user} 
            onRequestCollection={() => setActiveTab('requests')} 
            onNavigate={setActiveTab} // Pass navigation handler
          />
        );
      case 'requests':
        return <RequestCollection user={user} onBackToHome={() => setActiveTab('home')} />;
      case 'community':
        return <CommunityHub user={user} />;
      case 'tips':
        return <RecyclingTips />;
      case 'schedules':
        return <ScheduleManager user={user} />;
      case 'profile':
        return <ProfilePage user={user} onUpdate={setUser} />;
      default:
        return (
          <HomeFeed 
            user={user} 
            onRequestCollection={() => setActiveTab('requests')} 
            onNavigate={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden animate-fadeIn">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onLogout={handleLogout}
        userRole={user?.role || 'resident'} 
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between lg:hidden flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
             <span className="font-bold text-slate-800">reColeta</span>
          </div>
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-4xl mx-auto h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
