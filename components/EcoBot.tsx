
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Bell } from 'lucide-react';
import { chatWithEcoBot } from '../services/geminiService';
import { ChatMessage } from '../types';

const EcoBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', sender: 'bot', text: 'Olá! Sou o EcoBot 🤖. Posso ajudar com horários de coleta, dicas de separação ou receber denúncias. Como posso ajudar hoje?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Transform messages for history (simple version)
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const responseText = await chatWithEcoBot(history, userMsg.text);

      // Clean asterisks (Markdown bold/lists) from response before displaying
      const cleanResponse = responseText.replace(/\*/g, '');

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: cleanResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Chat Interface */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
        {/* Header - Mimic WhatsApp/App Header */}
        <div className="bg-emerald-600 p-4 flex items-center justify-between text-white shadow-md z-10">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
               <Bot size={24} />
             </div>
             <div>
               <h3 className="font-bold">EcoBot Assistant</h3>
               <p className="text-xs text-emerald-100 flex items-center gap-1">
                 <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                 Online agora
               </p>
             </div>
           </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://site-assets.fontawesome.com/releases/v6.5.1/svgs/solid/recycle.svg')] bg-opacity-5 bg-repeat bg-fixed bg-slate-50"
          style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-emerald-100 text-emerald-900 rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}
              >
                {msg.text}
                <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 rounded-tl-none flex gap-1 items-center">
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
               </div>
             </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite sua dúvida ou denúncia..."
            className="flex-1 bg-slate-100 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-full px-4 py-3 outline-none transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            <Send size={20} className={input.trim() ? "ml-1" : ""} />
          </button>
        </div>
      </div>

      {/* Notifications / Simulated Push */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
           <Bell size={20} className="text-amber-500" />
           Notificações Recebidas
        </h3>
        <p className="text-xs text-slate-500 mb-4">Simulação de mensagens enviadas aos moradores via App/WhatsApp.</p>

        <div className="space-y-4 overflow-y-auto pr-2">
          {[
            { title: "Dia de Coleta!", body: "O caminhão de recicláveis passa hoje na sua rua às 14h.", time: "10:00", type: "info" },
            { title: "Alerta: Ponto Cheio", body: "A lixeira da Rua 3 está cheia. Por favor, segure seu lixo até amanhã.", time: "Ontem", type: "warning" },
            { title: "Dica Rápida", body: "Lave as embalagens tetra pak antes de descartar para evitar odores.", time: "2 dias atrás", type: "tip" }
          ].map((notif, idx) => (
             <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative group hover:bg-slate-100 transition-colors">
               <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                 notif.type === 'warning' ? 'bg-red-500' : notif.type === 'tip' ? 'bg-blue-500' : 'bg-green-500'
               }`}></div>
               <div className="pl-3">
                 <div className="flex justify-between items-start mb-1">
                   <h4 className="font-semibold text-sm text-slate-800">{notif.title}</h4>
                   <span className="text-[10px] text-slate-400">{notif.time}</span>
                 </div>
                 <p className="text-xs text-slate-600 leading-relaxed">{notif.body}</p>
               </div>
             </div>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
           <button className="w-full py-2 text-sm text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition-colors">
             Ver histórico completo
           </button>
        </div>
      </div>
    </div>
  );
};

export default EcoBot;
