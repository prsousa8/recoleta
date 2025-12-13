
import React from 'react';
import { ArrowRight, Leaf, Building2, Users, Recycle, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
           <span className="text-xl font-bold text-slate-800 tracking-tight">reColeta</span>
        </div>
        <div className="flex gap-4">
          <button onClick={onLogin} className="px-4 py-2 text-slate-600 font-medium hover:text-green-600 transition-colors">Entrar</button>
          <button onClick={onRegister} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm">Cadastre-se</button>
        </div>
      </nav>

      <main className="flex-1">
        <section className="pt-16 pb-20 lg:pt-24 lg:pb-28 max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fadeIn">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium border border-green-200">
                  <Leaf size={16} />
                  <span>Para Condomínios e Comunidades</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Coleta Seletiva <span className="text-green-600">Simplificada</span>
                </h1>
                <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                  A plataforma completa para síndicos gerenciarem resíduos e moradores descartarem corretamente. Agende coletas, acompanhe o impacto e engaje sua comunidade.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={onRegister} className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    Começar Agora <ArrowRight size={20} />
                  </button>
                  <button onClick={onLogin} className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-colors flex items-center justify-center">
                    Já sou Morador
                  </button>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /><span>Gratuito para Moradores</span></div>
                  <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /><span>Relatórios para Gestores</span></div>
                </div>
            </div>
            
            <div className="relative animate-fadeIn">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-8 shadow-2xl relative">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                          <div className="p-3 bg-green-50 rounded-full w-fit mb-3"><Recycle className="text-green-600" size={24} /></div>
                          <h3 className="font-bold text-slate-800">Solicitação Fácil</h3>
                          <p className="text-xs text-slate-500 mt-1">Foto, endereço e agendamento em 3 cliques.</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                          <div className="p-3 bg-blue-50 rounded-full w-fit mb-3"><Building2 className="text-blue-600" size={24} /></div>
                          <h3 className="font-bold text-slate-800">Gestão Condominial</h3>
                          <p className="text-xs text-slate-500 mt-1">Controle total para síndicos e administradoras.</p>
                      </div>
                      <div className="col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl text-white shadow-lg">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-lg"><Users size={20} /></div>
                            <div>
                                <p className="font-bold">Engajamento Comunitário</p>
                                <p className="text-xs text-slate-300">Feed de notícias e doações entre vizinhos.</p>
                            </div>
                          </div>
                      </div>
                  </div>
                </div>
            </div>
        </section>
      </main>
      
      <footer className="bg-slate-50 text-slate-400 py-8 text-center text-sm border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6"><p>© 2025 reColeta. Soluções para Comunidades.</p></div>
      </footer>
    </div>
  );
};

export default LandingPage;
