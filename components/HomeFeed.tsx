
import React, { useState, useEffect } from 'react';
import { User, CommunityPost } from '../types';
import { getPosts, toggleLikePost, addCommentToPost } from '../services/communityService';
import { getRegionalRanking, RankedUser } from '../services/gamificationService';
import { Plus, MapPin, Package, Heart, MessageSquare, Megaphone, Leaf, Send, CornerDownRight, Lightbulb, ArrowRight, Trophy, TreeDeciduous, Medal, Star } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface HomeFeedProps {
  user: User | null;
  onRequestCollection: () => void;
  onNavigate: (tab: string) => void;
}

const HomeFeed: React.FC<HomeFeedProps> = ({ user, onRequestCollection, onNavigate }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [ranking, setRanking] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Interaction State
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (user) {
      loadFeed();
    }
  }, [user]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const [postsData, rankingData] = await Promise.all([
        getPosts(user),
        getRegionalRanking(user.region)
      ]);
      setPosts(postsData);
      setRanking(rankingData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    // Optimistic Update
    setPosts(currentPosts => currentPosts.map(p => {
      if (p.id === postId) {
        const hasLiked = p.likedBy.includes(user.id);
        return {
          ...p,
          likes: hasLiked ? p.likes - 1 : p.likes + 1,
          likedBy: hasLiked ? p.likedBy.filter(id => id !== user.id) : [...p.likedBy, user.id]
        };
      }
      return p;
    }));

    try {
      await toggleLikePost(postId, user.id);
    } catch (error) {
      console.error("Error liking post", error);
    }
  };

  const toggleComments = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      setCommentText('');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    setSubmittingComment(true);
    try {
      const newComment = await addCommentToPost(postId, commentText, user);
      setPosts(currentPosts => currentPosts.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...p.comments, newComment] };
        }
        return p;
      }));
      setCommentText('');
    } catch (error) {
      console.error("Error commenting", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Header with CTA */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
           <Leaf size={140} />
        </div>
        <div className="relative z-10">
           <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold">{user?.role === 'organization' ? 'Painel do Gestor' : `Olá, ${user?.name.split(' ')[0]}!`}</h1>
                <p className="text-green-100 flex items-center gap-1 text-sm mt-1">
                  <MapPin size={14} /> {user?.region}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                 <img 
                   src={user?.avatar} 
                   alt="User" 
                   className="w-full h-full rounded-full object-cover"
                 />
              </div>
           </div>
           
           {user?.role === 'resident' && (
             <div className="mt-6">
                <button 
                  onClick={onRequestCollection}
                  className="w-full bg-white text-green-700 font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 hover:bg-green-50 transition-transform active:scale-95"
                >
                  <Package size={24} className="text-green-600" />
                  SOLICITAR COLETA
                </button>
                <p className="text-center text-xs text-green-100 mt-2 opacity-80">
                  Descarte móveis, eletrônicos ou recicláveis
                </p>
             </div>
           )}
           
           {user?.role === 'organization' && (
             <div className="mt-6 grid grid-cols-2 gap-3">
                <div 
                  onClick={onRequestCollection}
                  className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 text-center cursor-pointer hover:bg-white/20 transition-colors"
                >
                   <p className="text-2xl font-bold flex items-center justify-center gap-2"><Package size={20}/> Gestão</p>
                   <p className="text-xs text-green-100">Ver Solicitações</p>
                </div>
                <div 
                  onClick={() => onNavigate('schedules')}
                  className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 text-center cursor-pointer hover:bg-white/20 transition-colors"
                >
                   <p className="text-2xl font-bold flex items-center justify-center gap-2"><MapPin size={20}/> Rotas</p>
                   <p className="text-xs text-green-100">Otimizar Caminho</p>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Grid for Tips & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Guide to Tips & Ideas */}
          <div className="lg:col-span-2">
            <div 
                onClick={() => onNavigate('tips')}
                className="bg-amber-50 p-6 rounded-2xl border border-amber-100 cursor-pointer flex justify-between items-center hover:bg-amber-100 transition-colors group h-full shadow-sm"
            >
                <div className="flex items-center gap-5">
                    <div className="bg-white p-4 rounded-full text-amber-500 shadow-sm group-hover:scale-110 transition-transform ring-4 ring-amber-100/50">
                        <Lightbulb size={28} className="fill-current" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Dúvidas sobre o que reciclar?</h3>
                        <p className="text-slate-600 mt-1">Confira nosso guia de dicas e ideias criativas.</p>
                    </div>
                </div>
                <div className="bg-white p-2 rounded-full shadow-sm text-amber-500">
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
          </div>

          {/* Monthly Ranking Widget - NEW FLASHY DESIGN */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden h-full flex flex-col relative group">
                {/* Decorative BG */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0"></div>
                
                <div className="relative z-10 p-5 pb-0 flex-shrink-0">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <Trophy className="text-yellow-400 fill-yellow-400" size={20} /> 
                                Ranking do Mês
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded backdrop-blur-md">
                                    {currentMonthName}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Top 1 - Hero */}
                    {ranking.length > 0 ? (
                        <div className="flex flex-col items-center mb-6 animate-scaleIn">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-yellow-300 via-yellow-500 to-yellow-200 shadow-2xl">
                                    <img src={ranking[0].avatar} className="w-full h-full rounded-full object-cover border-4 border-white" alt="Winner" />
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg border border-yellow-200 whitespace-nowrap z-20 flex items-center gap-1">
                                    <Trophy size={10} className="fill-yellow-900" /> 1º Lugar
                                </div>
                            </div>
                            <p className="mt-4 font-bold text-slate-900 text-lg truncate w-full text-center">{ranking[0].name}</p>
                            
                            {/* Key Metric: Collections Made */}
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
                                    <Package size={14} className="text-blue-600" />
                                    {ranking[0].requestsCount} Coletas Realizadas
                                </span>
                            </div>
                            
                            {/* Environmental Impact */}
                            <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-2 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                <TreeDeciduous size={12} className="fill-green-600" />
                                Salvou {ranking[0].treesSaved} árvores
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-white/50">
                            <Trophy size={48} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">O mês começou! Seja o primeiro a reciclar.</p>
                        </div>
                    )}
                </div>

                {/* Rest of the list */}
                <div className="bg-white flex-1 p-4 pt-2 overflow-y-auto z-10 rounded-t-2xl -mt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Top Recicladores</p>
                    <div className="space-y-3">
                        {ranking.slice(1, 5).map((r, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border ${
                                    idx === 0 ? 'bg-gray-100 text-gray-600 border-gray-300' : 
                                    idx === 1 ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                    'bg-slate-50 text-slate-500 border-slate-200'
                                }`}>
                                    {idx + 2}
                                </div>
                                <img src={r.avatar} className="w-9 h-9 rounded-full bg-slate-200 object-cover border border-slate-100" alt="avatar" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate flex items-center gap-1">
                                        {r.name}
                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded-full hidden group-hover:inline-block">
                                            +{r.points}pts
                                        </span>
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                        {r.requestsCount} coletas • {r.treesSaved} árvores
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
          </div>
      </div>

      {/* Feed Section */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Acontece no {user?.region}</h2>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-green-600" size={32} />
          </div>
        ) : (
          <div className="space-y-4">
             {/* Sponsored Post Example */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wide">
                  Destaque
                </div>
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white">
                      <Megaphone size={20} />
                   </div>
                   <div>
                     <p className="font-bold text-sm text-slate-800">Associação de Moradores</p>
                     <p className="text-xs text-slate-500">Patrocinado</p>
                   </div>
                </div>
                <p className="text-slate-700 text-sm mb-3">
                   Mutirão de limpeza neste sábado! Traga seus eletrônicos antigos para o ponto de coleta na praça central. 
                </p>
                <div className="bg-slate-100 rounded-lg h-32 w-full flex items-center justify-center text-slate-400 mb-3 overflow-hidden">
                   <img src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover" alt="Banner" />
                </div>
             </div>

             {/* Regular Posts */}
             {posts.map(post => {
               const isLiked = user ? post.likedBy.includes(user.id) : false;
               const isCommentsOpen = expandedPostId === post.id;
               
               return (
                 <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-3">
                          <img src={`https://ui-avatars.com/api/?name=${post.author}&background=random`} className="w-9 h-9 rounded-full" alt={post.author} />
                          <div>
                            <p className="font-bold text-sm text-slate-800">{post.author}</p>
                            <p className="text-xs text-slate-500">{post.timestamp}</p>
                          </div>
                       </div>
                       <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${post.type === 'Alert' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {post.type === 'Alert' ? 'Alerta' : 'Dica'}
                       </span>
                    </div>
                    <p className="text-slate-700 text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
                    
                    <div className="flex items-center gap-4 pt-3 border-t border-slate-50 text-slate-500">
                       <button 
                         onClick={() => handleLike(post.id)}
                         className={`flex items-center gap-1.5 text-xs transition-colors group ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                       >
                          <Heart size={16} className={`transition-transform group-hover:scale-110 ${isLiked ? 'fill-current' : ''}`} /> 
                          {post.likes}
                       </button>
                       <button 
                         onClick={() => toggleComments(post.id)}
                         className={`flex items-center gap-1.5 text-xs transition-colors group ${isCommentsOpen ? 'text-blue-600' : 'hover:text-blue-600'}`}
                       >
                          <MessageSquare size={16} className="transition-transform group-hover:scale-110" /> 
                          {post.comments.length}
                       </button>
                    </div>

                    {/* Comments Section */}
                    {isCommentsOpen && (
                      <div className="mt-4 bg-slate-50 rounded-lg p-3 border border-slate-100 animate-fadeIn">
                          {/* Comments List */}
                          {post.comments.length > 0 && (
                            <div className="space-y-3 mb-3">
                              {post.comments.map(comment => (
                                <div key={comment.id} className="flex gap-2 items-start">
                                  <CornerDownRight className="text-slate-300 flex-shrink-0 mt-1" size={12} />
                                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-bold text-xs text-slate-700">{comment.author}</span>
                                        <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                                    </div>
                                    <p className="text-xs text-slate-600">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Input */}
                          <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex gap-2">
                            <input 
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Escreva um comentário..."
                              className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                            />
                            <button 
                              type="submit"
                              disabled={!commentText.trim() || submittingComment}
                              className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {submittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            </button>
                          </form>
                      </div>
                    )}
                 </div>
               );
             })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeFeed;
