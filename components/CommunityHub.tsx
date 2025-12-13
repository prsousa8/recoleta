
import React, { useState, useEffect } from 'react';
import { CommunityPost, User, Comment, LocalProject } from '../types';
import { generateEcoTip } from '../services/geminiService';
import { getAllUsers } from '../services/authService';
import { 
  getPosts, createPost, toggleLikePost, addCommentToPost,
  getProjects, createProject, deleteProject, toggleProjectParticipation,
  addCommentToProject, removeProjectParticipant
} from '../services/communityService';
import { MessageSquare, Heart, Share2, Megaphone, Calendar, Send, Lightbulb, Loader2, AlertTriangle, Hammer, Leaf, CornerDownRight, MapPin, Plus, Trash2, X, Clock, MapPinned, Users, UserMinus, Info, Lock } from 'lucide-react';

interface CommunityHubProps {
  user: User | null;
}

const CommunityHub: React.FC<CommunityHubProps> = ({ user }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Cache for mapping IDs to names
  const [tip, setTip] = useState<string>('Carregando dica do dia...');
  const [loading, setLoading] = useState(true);

  // Post creation state
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'Alert' | 'Project' | 'Tip'>('Tip');
  const [isPosting, setIsPosting] = useState(false);

  // Interaction State
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [loadingComment, setLoadingComment] = useState(false);

  // Project Management State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', location: '', date: '' });
  const [creatingProject, setCreatingProject] = useState(false);

  // Project Details Modal State
  const [selectedProject, setSelectedProject] = useState<LocalProject | null>(null);
  const [projectCommentText, setProjectCommentText] = useState('');
  const [submittingProjectComment, setSubmittingProjectComment] = useState(false);

  useEffect(() => {
    generateEcoTip().then(setTip);
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [postsData, projectsData, usersData] = await Promise.all([
      getPosts(user),
      getProjects(user),
      getAllUsers()
    ]);
    setPosts(postsData);
    setProjects(projectsData);
    setAllUsers(usersData);
    setLoading(false);
  };

  // --- POSTS LOGIC ---

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || !user) return;

    setIsPosting(true);
    try {
      const createdPost = await createPost(newContent, newType, user);
      setPosts([createdPost, ...posts]);
      setNewContent('');
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setIsPosting(false);
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

  const handleCommentSubmit = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    setLoadingComment(true);
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
      setLoadingComment(false);
    }
  };

  const toggleComments = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      setCommentText(''); // Clear input when switching
    }
  };

  // --- PROJECTS LOGIC ---

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'organization') {
        alert("Apenas o condomínio pode criar projetos.");
        return;
    }

    setCreatingProject(true);
    try {
      const created = await createProject(newProject, user);
      setProjects([created, ...projects]);
      setShowProjectModal(false);
      setNewProject({ title: '', description: '', location: '', date: '' });
    } catch (error) {
      alert("Erro ao criar projeto");
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return;
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return;

    try {
      await deleteProject(projectId, user.id);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) setSelectedProject(null);
    } catch (error) {
      alert("Erro ao excluir");
    }
  };

  const handleJoinProject = async (projectId: string) => {
    if (!user) return;
    try {
      const updated = await toggleProjectParticipation(projectId, user.id);
      setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
      if (selectedProject?.id === projectId) setSelectedProject(updated);
    } catch (error) {
      alert("Erro ao atualizar participação");
    }
  };

  const handleProjectCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject || !projectCommentText.trim()) return;
    
    setSubmittingProjectComment(true);
    try {
      const updatedProject = await addCommentToProject(selectedProject.id, projectCommentText, user);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
      setProjectCommentText('');
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingProjectComment(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!user || !selectedProject) return;
    if (!confirm("Remover este participante do projeto?")) return;

    try {
      const updatedProject = await removeProjectParticipant(selectedProject.id, participantId, user.id);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
    } catch (error) {
      alert("Erro ao remover participante.");
    }
  };

  const getPostIcon = (type: CommunityPost['type']) => {
    switch (type) {
      case 'Alert': return <Megaphone className="text-red-500" size={20} />;
      case 'Project': return <Calendar className="text-green-500" size={20} />;
      default: return <Lightbulb className="text-amber-500" size={20} />;
    }
  };

  const getParticipantDetails = (ids: string[]) => {
    return ids.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start">
           <div>
             <h2 className="text-2xl font-bold mb-2">Comunidade: {user?.region}</h2>
             <p className="opacity-90 mb-4">Conecte-se com vizinhos e fique por dentro das novidades.</p>
           </div>
           {user && (
             <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold backdrop-blur-md">
                <MapPin size={14} /> {user.region}
             </div>
           )}
        </div>
        <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20">
          <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Dica do Dia</p>
          <p className="font-medium">"{tip}"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           
           {/* Post Creation Form - ONLY FOR ORGANIZATION */}
           {user?.role === 'organization' && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex gap-4">
                    <img 
                      src={user?.avatar || "https://ui-avatars.com/api/?name=User"} 
                      className="w-10 h-10 rounded-full border border-slate-100" 
                      alt="User" 
                    />
                    <div className="flex-1">
                      <form onSubmit={handlePostSubmit}>
                        <textarea 
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          placeholder={`Olá ${user.name.split(' ')[0]}, compartilhe um comunicado oficial...`}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none h-20"
                        />
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex gap-2">
                            {(['Tip', 'Alert', 'Project'] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setNewType(t)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors 
                                  ${newType === t 
                                    ? (t === 'Alert' ? 'bg-red-100 text-red-700 border-red-200' : t === 'Project' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200')
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                  } border border-transparent`}
                              >
                                {t === 'Alert' ? <AlertTriangle size={14} /> : t === 'Project' ? <Hammer size={14} /> : <Lightbulb size={14} />}
                                {t === 'Tip' ? 'Dica' : t === 'Alert' ? 'Alerta' : 'Projeto'}
                              </button>
                            ))}
                          </div>

                          <button 
                            type="submit"
                            disabled={!newContent.trim() || isPosting}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                          >
                            {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Publicar
                          </button>
                        </div>
                      </form>
                    </div>
                </div>
             </div>
           )}

           {user?.role === 'resident' && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-2 text-sm text-blue-700">
                 <Lock size={16} />
                 <span>Apenas o condomínio pode criar comunicados nesta área.</span>
              </div>
           )}

           {/* Feed */}
           {loading ? (
             <div className="flex justify-center py-12">
               <Loader2 className="animate-spin text-green-600" size={32} />
             </div>
           ) : (
             posts.map(post => {
               const isLiked = user ? post.likedBy.includes(user.id) : false;
               const isCommentsOpen = expandedPostId === post.id;

               return (
                 <div key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md animate-fadeIn overflow-hidden">
                   <div className="p-6">
                     <div className="flex items-start justify-between mb-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-100">
                           <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=random`} alt="Avatar" />
                         </div>
                         <div>
                           <p className="font-semibold text-slate-800">{post.author}</p>
                           <p className="text-xs text-slate-500 flex items-center gap-1">
                             {post.timestamp} • <span className="bg-slate-100 px-1 rounded text-slate-500">{post.region}</span>
                           </p>
                         </div>
                       </div>
                       <div className="bg-slate-50 p-2 rounded-full border border-slate-100">
                          {getPostIcon(post.type)}
                       </div>
                     </div>
                     
                     <p className="text-slate-700 mb-4 leading-relaxed whitespace-pre-wrap">
                       {post.content}
                     </p>

                     {/* Post Image (if any) */}
                     {post.imageUrl && (
                        <div className="mb-4 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 max-h-64 flex justify-center items-center">
                            <img src={post.imageUrl} alt="Post content" className="w-full h-full object-cover max-h-64" />
                        </div>
                     )}

                     <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                       <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 transition-colors group ${isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
                       >
                         <Heart size={18} className={`transition-transform group-hover:scale-110 ${isLiked ? 'fill-current' : ''}`} />
                         <span className="text-sm font-medium">{post.likes}</span>
                       </button>
                       
                       <button 
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center gap-2 transition-colors group ${isCommentsOpen ? 'text-blue-600' : 'text-slate-500 hover:text-blue-500'}`}
                       >
                         <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                         <span className="text-sm font-medium">
                           {post.comments.length > 0 ? `${post.comments.length} Comentários` : 'Comentar'}
                         </span>
                       </button>

                       <button className="flex items-center gap-2 text-slate-500 hover:text-green-500 transition-colors ml-auto group">
                         <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                       </button>
                     </div>
                   </div>

                   {/* Comments Section */}
                   {isCommentsOpen && (
                     <div className="bg-slate-50 border-t border-slate-100 p-4">
                        {/* Existing Comments */}
                        {post.comments.length > 0 && (
                          <div className="space-y-4 mb-4 pl-2">
                             {post.comments.map(comment => (
                               <div key={comment.id} className="flex gap-3">
                                  <CornerDownRight className="text-slate-300 flex-shrink-0 mt-2" size={16} />
                                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-slate-200 flex-1">
                                     <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-xs text-slate-700">{comment.author}</span>
                                        <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{comment.content}</p>
                                  </div>
                               </div>
                             ))}
                          </div>
                        )}

                        {/* Comment Input */}
                        {user ? (
                           <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex gap-2 items-end">
                              <img 
                                src={user.avatar} 
                                className="w-8 h-8 rounded-full border border-slate-200 mb-1" 
                                alt="User" 
                              />
                              <div className="flex-1 relative">
                                <textarea
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  placeholder="Escreva um comentário..."
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-10 min-h-[40px] py-2"
                                  style={{ height: '42px' }}
                                />
                                <button 
                                  type="submit"
                                  disabled={!commentText.trim() || loadingComment}
                                  className="absolute right-2 top-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                >
                                  {loadingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                              </div>
                           </form>
                        ) : (
                          <p className="text-center text-xs text-slate-500 py-2">Faça login para comentar.</p>
                        )}
                     </div>
                   )}
                 </div>
               );
             })
           )}
        </div>

        {/* Sidebar Projects */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800">Projetos Locais</h3>
               {user?.role === 'organization' && (
                   <button 
                     onClick={() => setShowProjectModal(true)}
                     className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                     title="Criar Novo Projeto"
                   >
                     <Plus size={16} />
                   </button>
               )}
            </div>
            
            <div className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-4">Nenhum projeto ativo.</p>
              ) : (
                projects.map(project => {
                  const isParticipating = user ? project.participants.includes(user.id) : false;

                  return (
                    <div 
                        key={project.id} 
                        className="relative group p-4 rounded-lg border border-slate-100 hover:border-green-200 hover:bg-green-50/30 transition-all cursor-pointer"
                        onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex gap-3">
                        <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${project.title.includes('Horta') ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                           {project.title.includes('Horta') ? <Leaf size={20} /> : <Hammer size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 truncate">{project.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{project.description}</p>
                          
                          <div className="flex flex-col gap-1 mt-2">
                             <div className="flex items-center gap-1 text-[10px] text-slate-400">
                               <Clock size={10} /> {project.date}
                             </div>
                             <div className="flex items-center gap-1 text-[10px] text-slate-400">
                               <MapPinned size={10} /> {project.location}
                             </div>
                             <div className="flex items-center gap-1 text-[10px] text-slate-400">
                               <Users size={10} /> {project.participants.length} participantes
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button 
                           onClick={(e) => {
                               e.stopPropagation();
                               handleJoinProject(project.id);
                           }}
                           className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors ${
                             isParticipating 
                               ? 'bg-green-200 text-green-800' 
                               : 'bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-700'
                           }`}
                        >
                           {isParticipating ? 'Confirmado' : 'Participar'}
                        </button>
                         <button 
                            className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded hover:bg-slate-50"
                        >
                            Ver Detalhes
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-green-50">
                 <h3 className="font-bold text-slate-800">Novo Projeto Local</h3>
                 <button onClick={() => setShowProjectModal(false)} className="text-slate-400 hover:text-slate-600">
                   <X size={20} />
                 </button>
              </div>
              <form onSubmit={handleCreateProject} className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Título do Projeto</label>
                    <input 
                      type="text" required autoFocus
                      value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})}
                      placeholder="Ex: Mutirão de Limpeza"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Data e Hora</label>
                    <input 
                      type="text" required
                      value={newProject.date} onChange={e => setNewProject({...newProject, date: e.target.value})}
                      placeholder="Ex: Sábado, 09:00"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Local de Encontro</label>
                    <input 
                      type="text" required
                      value={newProject.location} onChange={e => setNewProject({...newProject, location: e.target.value})}
                      placeholder="Ex: Praça Central"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Descrição</label>
                    <textarea 
                      required
                      value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})}
                      placeholder="O que será feito? O que levar?"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none"
                    />
                 </div>
                 
                 <button 
                   type="submit"
                   disabled={creatingProject}
                   className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"
                 >
                   {creatingProject ? <Loader2 className="animate-spin" size={18} /> : 'Criar Projeto'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <h2 className="text-xl font-bold text-slate-800">{selectedProject.title}</h2>
                             {user?.id === selectedProject.authorId && (
                                 <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase">Criador</span>
                             )}
                        </div>
                        <p className="text-slate-600 text-sm mb-3">{selectedProject.description}</p>
                        <div className="flex gap-4 text-xs text-slate-500">
                             <span className="flex items-center gap-1"><Clock size={12}/> {selectedProject.date}</span>
                             <span className="flex items-center gap-1"><MapPinned size={12}/> {selectedProject.location}</span>
                             <span className="flex items-center gap-1"><Info size={12}/> Organizado por {selectedProject.authorName}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedProject(null)} 
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Participants Section */}
                    <section>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Users size={18} className="text-blue-500" />
                            Participantes ({selectedProject.participants.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {getParticipantDetails(selectedProject.participants).map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full bg-slate-200" />
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                                            {p.id === selectedProject.authorId && <p className="text-[10px] text-amber-600 font-bold">Organizador</p>}
                                        </div>
                                    </div>
                                    {/* Creator can remove others */}
                                    {(user?.id === selectedProject.authorId || user?.role === 'organization') && p.id !== selectedProject.authorId && (
                                        <button 
                                            onClick={() => handleRemoveParticipant(p.id)}
                                            className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded"
                                            title="Remover participante"
                                        >
                                            <UserMinus size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                    
                    {/* Comments Section */}
                    <section>
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <MessageSquare size={18} className="text-green-500" />
                            Mural de Comentários
                        </h3>
                        
                        <div className="space-y-4 mb-4">
                            {selectedProject.comments.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Nenhum comentário ainda. Seja o primeiro!</p>
                            ) : (
                                selectedProject.comments.map(c => (
                                    <div key={c.id} className="flex gap-3">
                                        <CornerDownRight className="text-slate-300 flex-shrink-0 mt-2" size={16} />
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-xs text-slate-700">{c.author}</span>
                                                <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                                            </div>
                                            <p className="text-sm text-slate-600">{c.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={handleProjectCommentSubmit} className="flex gap-2">
                             <input 
                                type="text"
                                value={projectCommentText}
                                onChange={e => setProjectCommentText(e.target.value)}
                                placeholder="Dúvidas ou sugestões?"
                                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                             />
                             <button 
                                type="submit"
                                disabled={submittingProjectComment || !projectCommentText.trim()}
                                className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                             >
                                 {submittingProjectComment ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                             </button>
                        </form>
                    </section>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button 
                       onClick={() => handleJoinProject(selectedProject.id)}
                       className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-colors ${
                           selectedProject.participants.includes(user?.id || '')
                           ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                           : 'bg-green-600 text-white hover:bg-green-700'
                       }`}
                    >
                        {selectedProject.participants.includes(user?.id || '') ? 'Sair do Projeto' : 'Participar do Projeto'}
                    </button>
                    {(user?.id === selectedProject.authorId || user?.role === 'organization') && (
                        <button 
                            onClick={() => handleDeleteProject(selectedProject.id)}
                            className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50"
                        >
                            Excluir
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CommunityHub;
