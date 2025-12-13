
import React, { useState, useEffect } from 'react';
import { generateEcoTip } from '../services/geminiService';
import { Lightbulb, Recycle, Scissors, Sparkles, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Leaf } from 'lucide-react';
import FloatingEcoBot from './FloatingEcoBot';

const RecyclingTips: React.FC = () => {
  const [dailyTip, setDailyTip] = useState<string>('Carregando dica do dia...');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    generateEcoTip().then(setDailyTip);
  }, []);

  const categories = [
    {
      id: 'plastic',
      title: 'Plástico',
      color: 'bg-red-100 text-red-700',
      borderColor: 'border-red-200',
      icon: <Recycle className="text-red-600" />,
      content: [
        'Lave as embalagens para remover restos de alimentos. Isso evita mau cheiro e contaminação.',
        'Amasse garrafas PET para ocupar menos espaço.',
        'Retire os rótulos de papel se possível, mas as tampinhas podem ir junto (são feitas de polipropileno, também reciclável).',
        'NÃO RECICLÁVEL: Cabos de panela, tomadas, adesivos, embalagens metalizadas (tipo salgadinho).'
      ]
    },
    {
      id: 'paper',
      title: 'Papel e Papelão',
      color: 'bg-blue-100 text-blue-700',
      borderColor: 'border-blue-200',
      icon: <Recycle className="text-blue-600" />,
      content: [
        'Mantenha o papel seco e limpo. Papel engordurado (caixa de pizza suja) não serve.',
        'Desmonte caixas de papelão para otimizar o transporte.',
        'Não precisa tirar grampos pequenos, o processo industrial remove.',
        'NÃO RECICLÁVEL: Papel higiênico, guardanapos sujos, fotografias, papel carbono.'
      ]
    },
    {
      id: 'glass',
      title: 'Vidro',
      color: 'bg-green-100 text-green-700',
      borderColor: 'border-green-200',
      icon: <Recycle className="text-green-600" />,
      content: [
        'Lave e seque garrafas e potes.',
        'Se o vidro estiver quebrado, embrulhe em jornal ou coloque em uma caixa de leite vazia para proteger os coletores.',
        'Retire tampas de metal ou plástico.',
        'NÃO RECICLÁVEL: Espelhos, cristais, vidro temperado (box, carro), lâmpadas (descarte especial).'
      ]
    },
    {
      id: 'metal',
      title: 'Metal',
      color: 'bg-yellow-100 text-yellow-700',
      borderColor: 'border-yellow-200',
      icon: <Recycle className="text-yellow-600" />,
      content: [
        'Latas de alumínio (refrigerante/cerveja) são infinitamente recicláveis.',
        'Latas de aço (conservas) devem ter a tampa dobrada para dentro para evitar cortes.',
        'Lave para remover resíduos orgânicos.',
        'NÃO RECICLÁVEL: Esponjas de aço, clipes, grampos (se isolados), latas de tinta com resíduos.'
      ]
    },
    {
      id: 'organic',
      title: 'Orgânico',
      color: 'bg-amber-100 text-amber-700',
      borderColor: 'border-amber-200',
      icon: <Leaf className="text-amber-600" />,
      content: [
        'Ideal para compostagem doméstica ou comunitária.',
        'Restos de frutas, verduras, cascas de ovos, borra de café.',
        'Não misture com recicláveis secos, pois inutiliza o papel/papelão.',
        'Se não tiver compostagem, descarte no lixo comum bem fechado.'
      ]
    }
  ];

  const diyIdeas = [
    {
      title: 'Vasos Auto-Irrigáveis',
      desc: 'Use garrafas PET cortadas ao meio. A parte de cima (bico) vai a terra e a planta, a parte de baixo vai a água. Use um barbante conectando os dois.',
      tag: 'Jardinagem'
    },
    {
      title: 'Organizador de Cabos',
      desc: 'Rolos de papel higiênico vazios são perfeitos para guardar cabos e fios dentro de gavetas, evitando que se enrosquem.',
      tag: 'Organização'
    },
    {
      title: 'Potes de Vidro',
      desc: 'Potes de conserva limpos são excelentes para guardar temperos, grãos a granel ou até para levar salada no pote para o trabalho.',
      tag: 'Cozinha'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-10 relative">
      <header>
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Lightbulb className="text-yellow-500 fill-current" />
          Dicas & Ideias
        </h2>
        <p className="text-slate-500">Guia prático de separação e inspirações sustentáveis.</p>
      </header>

      {/* Dica do Dia (IA) */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
         <div className="relative z-10">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
               <Sparkles size={20} className="text-yellow-300" />
               Dica do Dia
            </h3>
            <p className="text-emerald-50 text-lg font-medium italic">"{dailyTip}"</p>
         </div>
         <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
            <Leaf size={150} />
         </div>
      </div>

      {/* Guia de Separação */}
      <div>
         <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-green-600" />
            Como Separar Corretamente
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
               <div key={cat.id} className={`border rounded-xl overflow-hidden bg-white shadow-sm transition-all ${activeCategory === cat.id ? 'ring-2 ring-green-500' : 'hover:border-green-300'}`}>
                  <button 
                    onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                    className={`w-full p-4 flex items-center justify-between ${cat.color} bg-opacity-20`}
                  >
                     <div className="flex items-center gap-3 font-bold">
                        <div className={`p-2 rounded-full bg-white bg-opacity-60`}>
                           {cat.icon}
                        </div>
                        {cat.title}
                     </div>
                     {activeCategory === cat.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  
                  {activeCategory === cat.id && (
                     <div className="p-4 bg-white animate-fadeIn">
                        <ul className="space-y-2">
                           {cat.content.map((item, idx) => (
                              <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                 {item.includes('NÃO RECICLÁVEL') ? (
                                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                 ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                                 )}
                                 <span className={item.includes('NÃO RECICLÁVEL') ? 'text-red-600 font-medium' : ''}>
                                    {item}
                                 </span>
                              </li>
                           ))}
                        </ul>
                     </div>
                  )}
               </div>
            ))}
         </div>
      </div>

      {/* Ideias Criativas */}
      <div>
         <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Scissors className="text-purple-600" />
            Ideias de Reutilização
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {diyIdeas.map((idea, idx) => (
               <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                     <h4 className="font-bold text-slate-800">{idea.title}</h4>
                     <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold uppercase">{idea.tag}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{idea.desc}</p>
               </div>
            ))}
         </div>
      </div>

      <FloatingEcoBot />
    </div>
  );
};

export default RecyclingTips;
