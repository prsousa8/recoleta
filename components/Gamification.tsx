
import React, { useState, useEffect } from 'react';
import { UserStats, User, Challenge, Reward, ChallengeSubmission, RedemptionRequest } from '../types';
import { Trophy, Star, Target, Users, Gift, ShieldCheck, Plus, CheckCircle2, Lock, Loader2, Upload, FileText, AlertCircle, XCircle, ShoppingBag, ClipboardList, Gavel, MessageSquare, MapPin, Pencil, Trash2, X, Package, TreeDeciduous, Weight, Calendar } from 'lucide-react';
import { 
  getChallenges, getRewards, submitChallengeProof, redeemReward, 
  createChallenge, updateChallenge, deleteChallenge, 
  createReward, updateReward, deleteReward,
  getUserSubmissions, getPendingSubmissions, reviewSubmission, 
  getPendingRedemptions, processRedemption, getLiveUserPoints, getRegionalRanking 
} from '../services/gamificationService';
import type { RankedUser } from '../services/gamificationService';

interface Props {
  stats: UserStats;
  user: User | null;
}

const Gamification: React.FC<Props> = ({ stats: initialStats, user }) => {
  // Simplified tabs: Admin functionalities merged into 'management'
  const [activeTab, setActiveTab] = useState<'challenges' | 'rewards' | 'ranking' | 'management'>('challenges');
  const [currentPoints, setCurrentPoints] = useState(initialStats.points);
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<ChallengeSubmission[]>([]);
  
  // Regional Ranking Data
  const [ranking, setRanking] = useState<RankedUser[]>([]);

  // Admin Data
  const [pendingSubmissions, setPendingSubmissions] = useState<ChallengeSubmission[]>([]);
  const [pendingRedemptions, setPendingRedemptions] = useState<RedemptionRequest[]>([]);
  
  const [loading, setLoading] = useState(false);

  // Submission Modal State
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [proofText, setProofText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redemption Success Modal State
  const [redemptionSuccess, setRedemptionSuccess] = useState<{ rewardTitle: string; cost: number } | null>(null);

  // Admin Review State
  const [reviewFeedbackMap, setReviewFeedbackMap] = useState<Record<string, string>>({});
  const [redemptionFeedbackMap, setRedemptionFeedbackMap] = useState<Record<string, string>>({}); // New feedback for redemptions
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Admin Create/Edit Challenge State
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeDesc, setNewChallengeDesc] = useState('');
  const [newChallengeXP, setNewChallengeXP] = useState(100);
  const [creatingChallenge, setCreatingChallenge] = useState(false);

  // Admin Create/Edit Reward State
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardDesc, setNewRewardDesc] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(500);
  const [newRewardStock, setNewRewardStock] = useState(10); // Added Stock State
  const [creatingReward, setCreatingReward] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, activeTab]); 

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, rData] = await Promise.all([getChallenges(), getRewards()]);
      setChallenges(cData);
      setRewards(rData);

      if (user) {
        const uSubs = await getUserSubmissions(user.id);
        setUserSubmissions(uSubs);

        // SYNC POINTS
        const realPoints = await getLiveUserPoints(user.id);
        setCurrentPoints(realPoints);

        // Fetch Ranking
        const regionalRank = await getRegionalRanking(user.region);
        setRanking(regionalRank);

        if (user.role === 'organization') {
          const [pSubs, pReds] = await Promise.all([getPendingSubmissions(), getPendingRedemptions()]);
          setPendingSubmissions(pSubs);
          setPendingRedemptions(pReds);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getChallengeStatus = (challengeId: string) => {
    const sub = userSubmissions.find(s => s.challengeId === challengeId);
    if (!sub) return 'available';
    return sub.status;
  };

  const getSubmissionFeedback = (challengeId: string) => {
    return userSubmissions.find(s => s.challengeId === challengeId)?.adminFeedback;
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChallenge) return;
    
    setIsSubmitting(true);
    try {
      await submitChallengeProof(selectedChallenge.id, proofText, user);
      await loadData();
      setSelectedChallenge(null);
      setProofText('');
      alert('Prova enviada! Aguarde a aprovação do administrador.');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminReview = async (submissionId: string, status: 'approved' | 'rejected') => {
    if (!user || user.role !== 'organization') return;
    
    const feedback = reviewFeedbackMap[submissionId] || '';

    if (status === 'rejected' && !feedback.trim()) {
      alert("Por favor, forneça um motivo para a recusa.");
      return;
    }

    setProcessingId(submissionId);
    try {
      await reviewSubmission(submissionId, status, feedback);
      setReviewFeedbackMap(prev => {
        const n = {...prev};
        delete n[submissionId];
        return n;
      });
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!user || currentPoints < reward.cost) return;
    if (reward.stock <= 0) {
      alert("Este item está fora de estoque.");
      return;
    }
    
    if (confirm(`Solicitar resgate de "${reward.title}" por ${reward.cost} pontos? Os pontos serão descontados somente após aprovação do administrador.`)) {
      try {
        const result = await redeemReward(reward.id, currentPoints, user);
        if (result.success) {
          // Do NOT deduct local points visually yet, to match backend logic
          setRedemptionSuccess({
            rewardTitle: reward.title,
            cost: reward.cost
          });
        }
      } catch (error: any) {
        alert("Erro ao solicitar resgate: " + error.message);
      }
    }
  };

  const handleAdminProcessRedemption = async (redemptionId: string, status: 'delivered' | 'rejected') => {
    if (!user || user.role !== 'organization') return;

    const feedback = redemptionFeedbackMap[redemptionId] || '';
    if (status === 'rejected' && !feedback.trim()) {
        alert("Por favor, forneça um motivo para rejeitar a solicitação.");
        return;
    }

    setProcessingId(redemptionId);
    try {
      await processRedemption(redemptionId, status, feedback);
      setPendingRedemptions(prev => prev.filter(r => r.id !== redemptionId));
      setRedemptionFeedbackMap(prev => {
          const n = {...prev};
          delete n[redemptionId];
          return n;
      });
      
      // Update inventory list in background by reloading data
      await loadData();
      
      alert(status === 'delivered' ? "Entrega aprovada e estoque atualizado!" : "Solicitação rejeitada.");
    } catch (error: any) {
      alert("Erro ao processar: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // --- Challenge Handlers ---

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'organization') return;

    setCreatingChallenge(true);
    try {
      if (editingChallengeId) {
        await updateChallenge(editingChallengeId, {
            title: newChallengeTitle,
            description: newChallengeDesc,
            xpReward: newChallengeXP
        }, user);
        alert('Desafio atualizado com sucesso!');
      } else {
        await createChallenge(newChallengeTitle, newChallengeDesc, newChallengeXP, user);
        alert('Desafio criado com sucesso para todos os moradores!');
      }
      
      await loadData();
      resetChallengeForm();
    } catch (error) {
      alert('Erro ao salvar desafio');
    } finally {
      setCreatingChallenge(false);
    }
  };

  const handleEditChallengeClick = (challenge: Challenge) => {
      setEditingChallengeId(challenge.id);
      setNewChallengeTitle(challenge.title);
      setNewChallengeDesc(challenge.description);
      setNewChallengeXP(challenge.xpReward);
      setActiveTab('management');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleDeleteChallengeClick = async (challengeId: string) => {
      if (!user || user.role !== 'organization') return;
      if (!confirm("Tem certeza que deseja excluir este desafio?")) return;

      try {
          await deleteChallenge(challengeId, user);
          setChallenges(prev => prev.filter(c => c.id !== challengeId));
      } catch (error) {
          console.error(error);
          alert("Erro ao excluir desafio");
      }
  };

  const resetChallengeForm = () => {
    setEditingChallengeId(null);
    setNewChallengeTitle('');
    setNewChallengeDesc('');
    setNewChallengeXP(100);
  };

  // --- Reward Handlers ---

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'organization') return;

    setCreatingReward(true);
    try {
      if (editingRewardId) {
        await updateReward(editingRewardId, {
            title: newRewardTitle,
            description: newRewardDesc,
            cost: newRewardCost,
            stock: newRewardStock
        }, user);
        alert('Recompensa atualizada com sucesso!');
      } else {
        await createReward(newRewardTitle, newRewardCost, newRewardDesc, newRewardStock, user);
        alert('Recompensa criada e disponível na loja!');
      }
      
      await loadData();
      resetRewardForm();
    } catch (error) {
      alert('Erro ao salvar recompensa');
    } finally {
      setCreatingReward(false);
    }
  };

  const handleEditRewardClick = (reward: Reward) => {
    setEditingRewardId(reward.id);
    setNewRewardTitle(reward.title);
    setNewRewardDesc(reward.description);
    setNewRewardCost(reward.cost);
    setNewRewardStock(reward.stock || 0);
    setActiveTab('management');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleDeleteRewardClick = async (rewardId: string) => {
    if (!user || user.role !== 'organization') return;
    if (!confirm("Tem certeza que deseja remover esta recompensa da loja?")) return;

    try {
        await deleteReward(rewardId, user);
        setRewards(prev => prev.filter(r => r.id !== rewardId));
    } catch (error) {
        console.error(error);
        alert("Erro ao excluir recompensa");
    }
  };

  const resetRewardForm = () => {
    setEditingRewardId(null);
    setNewRewardTitle('');
    setNewRewardDesc('');
    setNewRewardCost(500);
    setNewRewardStock(10);
  };


  const totalPending = pendingSubmissions.length + pendingRedemptions.length;

  return (
    <div className="space-y-8 animate-fadeIn relative">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Gamificação Eco</h2>
          <p className="text-slate-500">Engaje sua família, complete missões e ganhe benefícios.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
           <span className="text-sm font-medium text-slate-500">Seus Pontos:</span>
           <span className="text-xl font-bold text-amber-500 flex items-center gap-1">
             <Star className="fill-current" size={20} />
             {currentPoints}
           </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'challenges' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Target size={18} /> Missões
        </button>
        <button 
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'rewards' ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Gift size={18} /> Loja de Pontos
        </button>
        <button 
          onClick={() => setActiveTab('ranking')}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'ranking' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Users size={18} /> Ranking
        </button>
        {user?.role === 'organization' && (
          <button 
            onClick={() => setActiveTab('management')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'management' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ShieldCheck size={18} /> 
            Painel Admin
            {totalPending > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{totalPending}</span>
            )}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>
        ) : (
          <>
            {activeTab === 'challenges' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {challenges.map((challenge) => {
                  const status = getChallengeStatus(challenge.id);
                  const feedback = getSubmissionFeedback(challenge.id);
                  const isCompleted = status === 'approved';
                  const isPending = status === 'pending';
                  const isRejected = status === 'rejected';

                  return (
                    <div key={challenge.id} className={`p-5 rounded-xl border transition-all relative ${isCompleted ? 'bg-green-50 border-green-200' : isRejected ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:border-green-300 hover:shadow-md'}`}>
                      {user?.role === 'organization' && (
                        <div className="absolute top-4 right-4 flex gap-1 bg-white/80 p-1 rounded-lg shadow-sm border border-slate-100 z-10">
                            <button 
                                onClick={() => handleEditChallengeClick(challenge)}
                                className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded transition-colors"
                                title="Editar Desafio"
                            >
                                <Pencil size={14} />
                            </button>
                            <button 
                                onClick={() => handleDeleteChallengeClick(challenge.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Excluir Desafio"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-3 pr-14">
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full mb-2 inline-block ${
                            challenge.type === 'daily' ? 'bg-blue-100 text-blue-700' : challenge.type === 'weekly' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {challenge.type === 'daily' ? 'Diário' : challenge.type === 'weekly' ? 'Semanal' : 'Especial'}
                          </span>
                          <h3 className="font-bold text-slate-800 text-lg">{challenge.title}</h3>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                          <Star size={14} className="fill-current" /> +{challenge.xpReward}
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm mb-4">{challenge.description}</p>
                      
                      {isCompleted ? (
                        <div className="space-y-3">
                           {feedback && (
                             <div className="text-xs bg-green-100 text-green-800 p-3 rounded-lg border border-green-200 flex items-start gap-2">
                               <MessageSquare size={16} className="mt-0.5 flex-shrink-0 text-green-600" />
                               <div>
                                 <span className="font-bold block text-green-700 mb-0.5">Admin diz:</span> 
                                 {feedback}
                               </div>
                             </div>
                           )}
                           <button disabled className="w-full py-2 bg-green-200 text-green-800 rounded-lg font-medium flex items-center justify-center gap-2 cursor-default">
                            <CheckCircle2 size={18} /> Missão Cumprida
                           </button>
                        </div>
                      ) : isPending ? (
                        <button disabled className="w-full py-2 bg-amber-100 text-amber-800 rounded-lg font-medium flex items-center justify-center gap-2 cursor-default border border-amber-200">
                          <Loader2 size={18} className="animate-spin" /> Em Análise
                        </button>
                      ) : (
                        <div>
                          {isRejected && (
                             <div className="mb-3 text-xs bg-red-100 text-red-800 p-3 rounded-lg border border-red-200 flex items-start gap-2">
                                <XCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
                                <div>
                                  <span className="font-bold block text-red-700 mb-0.5">Recusado pelo Admin:</span> 
                                  {feedback || 'Prova insuficiente.'}
                                </div>
                             </div>
                          )}
                          <button 
                            onClick={() => setSelectedChallenge(challenge)}
                            className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors active:scale-95 flex items-center justify-center gap-2"
                          >
                            {isRejected ? 'Tentar Novamente' : 'Enviar Comprovante'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {rewards.map((reward) => {
                   const canAfford = currentPoints >= reward.cost;
                   const hasStock = (reward.stock || 0) > 0;
                   return (
                     <div key={reward.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col hover:shadow-lg transition-shadow relative overflow-hidden group">
                       
                       {user?.role === 'organization' && (
                        <div className="absolute top-4 right-4 flex gap-1 bg-white/80 p-1 rounded-lg shadow-sm border border-slate-100 z-20">
                            <button 
                                onClick={() => handleEditRewardClick(reward)}
                                className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded transition-colors"
                                title="Editar Recompensa"
                            >
                                <Pencil size={14} />
                            </button>
                            <button 
                                onClick={() => handleDeleteRewardClick(reward.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Excluir Recompensa"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                       )}

                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:rotate-12">
                          <Gift size={100} />
                       </div>
                       
                       <div className="z-10 mb-2">
                            <h3 className="font-bold text-slate-800 text-lg pr-10 leading-tight">{reward.title}</h3>
                            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border ${hasStock ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                {hasStock ? `Estoque: ${reward.stock}` : 'Esgotado'}
                            </span>
                       </div>

                       <p className="text-slate-500 text-sm mb-4 flex-1 z-10">{reward.description}</p>
                       <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between z-10">
                          <span className="font-bold text-slate-700">{reward.cost} XP</span>
                          <button 
                            onClick={() => handleRedeemReward(reward)}
                            disabled={!canAfford || !hasStock}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                              canAfford && hasStock
                              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-200' 
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {hasStock ? (canAfford ? 'Resgatar' : 'Bloqueado') : 'Sem Estoque'}
                          </button>
                       </div>
                       {!canAfford && hasStock && (
                         <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                              <Lock size={12} /> Falta {reward.cost - currentPoints} XP
                            </div>
                         </div>
                       )}
                     </div>
                   );
                 })}
              </div>
            )}

            {activeTab === 'ranking' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="text-amber-500" />
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Ranking Mensal</h3>
                        <p className="text-xs text-slate-500">Mês Atual • {user?.region}</p>
                    </div>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Calendar size={12} /> {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {ranking.length === 0 ? (
                    <div className="text-center py-8">
                        <Package className="mx-auto mb-2 text-slate-300" size={32} />
                        <p className="text-slate-500 text-sm">Nenhuma coleta finalizada neste mês ainda.</p>
                    </div>
                  ) : (
                    ranking.map((u, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-4 rounded-lg transition-colors ${u.name === user?.name ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'
                          }`}>
                            {idx + 1}
                          </div>
                          <img src={u.avatar} className="w-10 h-10 rounded-full bg-slate-200" alt="avatar" />
                          <div>
                            <p className={`font-medium ${u.name === user?.name ? 'text-blue-800' : 'text-slate-800'}`}>
                              {u.name} {u.name === user?.name && '(Você)'}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1" title="Lixo Reciclado">
                                    <Weight size={12} /> {u.kgRecycled}kg
                                </span>
                                <span className="flex items-center gap-1 text-green-600" title="Coletas Solicitadas">
                                    <Package size={12} /> {u.requestsCount} coletas
                                </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 font-mono">
                          <Star size={16} className="fill-amber-400 text-amber-400" />
                          <span className="font-bold text-slate-800">{u.points.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-4 text-center italic">* Ranking baseado na quantidade de solicitações coletadas.</p>
              </div>
            )}

            {activeTab === 'management' && user?.role === 'organization' && (
              <div className="space-y-8">
                
                {/* SECTION 1: APPROVALS & JUDGEMENT */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Task Audits */}
                    <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-100 bg-amber-50 flex justify-between items-center">
                        <h3 className="font-bold text-amber-900 flex items-center gap-2">
                          <Gavel size={20} />
                          Julgar Tarefas
                        </h3>
                        <span className="text-xs font-bold bg-white text-amber-700 px-2 py-1 rounded border border-amber-200">
                          {pendingSubmissions.length} Pendentes
                        </span>
                      </div>
                      
                      <div className="flex-1 max-h-[400px] overflow-y-auto">
                        {pendingSubmissions.length === 0 ? (
                          <div className="p-12 text-center text-slate-400">
                            <CheckCircle2 size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Nenhuma tarefa para auditar.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {pendingSubmissions.map((submission) => (
                              <div key={submission.id} className="p-4 flex flex-col gap-3">
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-800 text-sm">{submission.userName}</span>
                                      <span className="text-slate-400 text-xs">{submission.timestamp}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">Missão: <span className="font-semibold text-green-700">{submission.challengeTitle}</span></p>
                                    <div className="bg-slate-50 p-2 rounded border border-slate-200 mt-2 text-xs text-slate-700 italic">
                                      "{submission.proofText}"
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => handleAdminReview(submission.id, 'approved')}
                                        disabled={processingId === submission.id}
                                        className="flex-1 bg-green-100 text-green-700 py-2 rounded text-xs font-bold hover:bg-green-200 transition-colors flex justify-center items-center gap-1"
                                      >
                                        <CheckCircle2 size={14} /> Aprovar
                                      </button>
                                      <button 
                                        onClick={() => handleAdminReview(submission.id, 'rejected')}
                                        disabled={processingId === submission.id}
                                        className="flex-1 bg-red-100 text-red-700 py-2 rounded text-xs font-bold hover:bg-red-200 transition-colors flex justify-center items-center gap-1"
                                      >
                                        <XCircle size={14} /> Recusar
                                      </button>
                                    </div>
                                    <textarea 
                                      placeholder="Motivo da recusa ou feedback de aprovação..."
                                      value={reviewFeedbackMap[submission.id] || ''}
                                      onChange={e => setReviewFeedbackMap(prev => ({...prev, [submission.id]: e.target.value}))}
                                      className="text-xs p-2 border border-slate-200 rounded resize-none focus:outline-none focus:border-slate-400 h-14"
                                    />
                                  </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reward Fulfillments */}
                    <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-100 bg-purple-50 flex justify-between items-center">
                        <h3 className="font-bold text-purple-900 flex items-center gap-2">
                          <ShoppingBag size={20} />
                          Solicitações de Prêmios
                        </h3>
                        <span className="text-xs font-bold bg-white text-purple-700 px-2 py-1 rounded border border-purple-200">
                          {pendingRedemptions.length} Pendentes
                        </span>
                      </div>

                      <div className="flex-1 max-h-[400px] overflow-y-auto">
                        {pendingRedemptions.length === 0 ? (
                          <div className="p-12 text-center text-slate-400">
                            <Gift size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Nenhuma solicitação pendente.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {pendingRedemptions.map((redemption) => (
                              <div key={redemption.id} className="p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-bold text-slate-800 text-sm">{redemption.rewardTitle}</p>
                                      <p className="text-xs text-slate-500 mt-1">Solicitante: <span className="font-semibold text-slate-700 bg-slate-100 px-1 rounded">{redemption.userName}</span></p>
                                      <p className="text-xs text-slate-400 mt-0.5">{redemption.timestamp}</p>
                                    </div>
                                    <span className="font-bold text-purple-600 text-xs bg-purple-50 px-2 py-1 rounded border border-purple-100">-{redemption.cost} XP</span>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                     <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleAdminProcessRedemption(redemption.id, 'delivered')}
                                            disabled={processingId === redemption.id}
                                            className="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            {processingId === redemption.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                                            Aprovar Entrega
                                        </button>
                                        <button 
                                            onClick={() => handleAdminProcessRedemption(redemption.id, 'rejected')}
                                            disabled={processingId === redemption.id}
                                            className="flex-1 py-2 bg-red-100 text-red-700 text-xs font-bold rounded hover:bg-red-200 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            {processingId === redemption.id ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
                                            Rejeitar
                                        </button>
                                     </div>
                                     <input 
                                       type="text"
                                       placeholder="Motivo (obrigatório se rejeitar)..."
                                       value={redemptionFeedbackMap[redemption.id] || ''}
                                       onChange={(e) => setRedemptionFeedbackMap(prev => ({...prev, [redemption.id]: e.target.value}))}
                                       className="text-xs p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                                     />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                </div>

                {/* SECTION 2: CONTENT MANAGEMENT */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                   
                   {/* Challenges Management Form */}
                   <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 transition-colors" style={editingChallengeId ? { borderColor: '#f59e0b' } : {}}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          {editingChallengeId ? <Pencil className="text-amber-600" size={20} /> : <Plus className="bg-slate-800 text-white rounded p-0.5" size={20} />}
                          {editingChallengeId ? 'Editar Desafio' : 'Novo Desafio'}
                        </h3>
                        {editingChallengeId && (
                           <button onClick={resetChallengeForm} className="text-xs flex items-center gap-1 text-slate-500 hover:text-red-600 bg-slate-100 px-2 py-1 rounded">
                             <X size={14} /> Cancelar
                           </button>
                        )}
                      </div>
                      
                      <form onSubmit={handleSaveChallenge} className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Título</label>
                            <input 
                              type="text" required
                              value={newChallengeTitle} onChange={e => setNewChallengeTitle(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                              placeholder="Ex: Mutirão de Limpeza"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">XP</label>
                            <input 
                              type="number" required min="10" step="10"
                              value={newChallengeXP} onChange={e => setNewChallengeXP(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Descrição</label>
                          <textarea 
                            required
                            value={newChallengeDesc} onChange={e => setNewChallengeDesc(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 outline-none h-20 resize-none"
                            placeholder="Detalhes..."
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={creatingChallenge}
                          className={`w-full py-2 rounded-lg font-bold text-sm transition-colors flex justify-center items-center gap-2 ${editingChallengeId ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                        >
                           {creatingChallenge ? <Loader2 className="animate-spin" size={16} /> : (editingChallengeId ? 'Atualizar Desafio' : 'Publicar Desafio')}
                        </button>
                      </form>
                   </div>

                   {/* Rewards Management Form */}
                   <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 transition-colors" style={editingRewardId ? { borderColor: '#9333ea' } : {}}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          {editingRewardId ? <Pencil className="text-purple-600" size={20} /> : <Plus className="bg-purple-600 text-white rounded p-0.5" size={20} />}
                          {editingRewardId ? 'Editar Recompensa' : 'Nova Recompensa'}
                        </h3>
                        {editingRewardId && (
                           <button onClick={resetRewardForm} className="text-xs flex items-center gap-1 text-slate-500 hover:text-red-600 bg-slate-100 px-2 py-1 rounded">
                             <X size={14} /> Cancelar
                           </button>
                        )}
                      </div>
                      
                      <form onSubmit={handleSaveReward} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Item</label>
                            <input 
                              type="text" required
                              value={newRewardTitle} onChange={e => setNewRewardTitle(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                              placeholder="Ex: Kit Jardinagem"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Custo (XP)</label>
                            <input 
                              type="number" required min="100" step="50"
                              value={newRewardCost} onChange={e => setNewRewardCost(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Estoque</label>
                            <div className="relative">
                                <Package className="absolute left-3 top-2.5 text-slate-400" size={14}/>
                                <input 
                                type="number" required min="0" step="1"
                                value={newRewardStock} onChange={e => setNewRewardStock(Number(e.target.value))}
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Descrição</label>
                          <textarea 
                            required
                            value={newRewardDesc} onChange={e => setNewRewardDesc(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none h-20 resize-none"
                            placeholder="Detalhes..."
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={creatingReward}
                          className={`w-full py-2 rounded-lg font-bold text-sm transition-colors flex justify-center items-center gap-2 ${editingRewardId ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                        >
                           {creatingReward ? <Loader2 className="animate-spin" size={16} /> : (editingRewardId ? 'Atualizar Item' : 'Adicionar à Loja')}
                        </button>
                      </form>
                   </div>

                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Proof Submission Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-lg text-slate-800">Enviar Comprovante</h3>
                 <button onClick={() => setSelectedChallenge(null)} className="text-slate-400 hover:text-slate-600">
                   <XCircle size={24} />
                 </button>
              </div>
              <form onSubmit={handleSubmitProof} className="p-6">
                 <p className="text-sm text-slate-600 mb-4">
                   Para validar "<strong>{selectedChallenge.title}</strong>", por favor descreva a atividade ou simule o envio de uma foto.
                 </p>
                 
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-slate-700 mb-2">Descrição / Link</label>
                   <textarea 
                     required
                     value={proofText}
                     onChange={(e) => setProofText(e.target.value)}
                     className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none h-24"
                     placeholder="Ex: Separei 2kg de papelão e levei ao ponto da Rua 3..."
                   />
                 </div>

                 <div className="mb-6 border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">
                    <Upload size={24} className="mb-2" />
                    <span className="text-xs">Clique para adicionar foto (Simulado)</span>
                 </div>

                 <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setSelectedChallenge(null)}
                      className="flex-1 py-2.5 border border-slate-200 rounded-lg font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !proofText.trim()}
                      className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Enviar para Análise'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Redemption Success Modal */}
      {redemptionSuccess && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6 scale-100 animate-scaleIn">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
              <ClipboardList size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Solicitação Enviada!</h3>
            <p className="text-slate-600 mb-6">
              Você solicitou <strong>{redemptionSuccess.rewardTitle}</strong> por <strong>{redemptionSuccess.cost} XP</strong>.
            </p>
            
            <p className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6 text-slate-500">
              Os pontos serão descontados automaticamente assim que o administrador aprovar a entrega.
            </p>

            <button 
              onClick={() => setRedemptionSuccess(null)}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Gamification;
