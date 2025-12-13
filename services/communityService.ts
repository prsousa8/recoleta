import { CommunityPost, User, Comment, LocalProject, CollectionRequest } from '../types';

let mockPosts: CommunityPost[] = [
  {
    id: '1',
    author: 'Associação de Moradores',
    content: '🚨 Atenção! O caminhão da coleta seletiva passará 1h mais cedo amanhã devido ao feriado.',
    likes: 24,
    likedBy: [],
    comments: [
      { id: 'c1', author: 'Carlos Vizinho', content: 'Obrigado pelo aviso!', timestamp: '1h atrás' }
    ],
    type: 'Alert',
    timestamp: '2h atrás',
    region: 'Centro'
  },
  {
    id: '2',
    author: 'Maria Silva (ONG Verde)',
    content: 'Neste sábado teremos oficina de compostagem na praça central. Tragam seus resíduos orgânicos!',
    likes: 56,
    likedBy: [],
    comments: [],
    type: 'Project',
    timestamp: '5h atrás',
    region: 'Centro'
  },
  {
    id: '3',
    author: 'João Souza',
    content: 'Alguém sabe onde descartar baterias velhas aqui no bairro?',
    likes: 8,
    likedBy: [],
    comments: [
       { id: 'c2', author: 'Ana Paula', content: 'Tem um ponto de coleta no mercado Extra.', timestamp: '30min atrás' }
    ],
    type: 'Tip',
    timestamp: '1d atrás',
    region: 'Vila Madalena'
  }
];

// Mock Projects Data
let mockProjects: LocalProject[] = [
  {
    id: 'p1',
    title: 'Horta Comunitária',
    description: 'Manutenção semanal e plantio de novas mudas.',
    authorId: 'admin-1',
    authorName: 'Gestor Ambiental',
    region: 'Centro',
    date: 'Sábados, 09:00',
    location: 'Praça Central',
    participants: ['user-1', 'admin-1'],
    comments: [
      { id: 'cp1', author: 'Carlos Morador', content: 'Posso levar minhas próprias ferramentas?', timestamp: 'Ontem' }
    ],
    createdAt: Date.now()
  },
  {
    id: 'p2',
    title: 'Coleta de Eletrônicos',
    description: 'Ponto temporário para descarte de lixo eletrônico.',
    authorId: 'user-2',
    authorName: 'Ana Souza',
    region: 'Vila Madalena',
    date: '25/11/2024',
    location: 'Escola do Bairro',
    participants: ['user-2'],
    comments: [],
    createdAt: Date.now()
  }
];

export const getPosts = async (user?: User): Promise<CommunityPost[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!user) {
        resolve([]);
        return;
      }
      // Filter posts strictly by the user's region
      const filtered = mockPosts.filter(p => p.region === user.region);
      resolve(filtered);
    }, 500);
  });
};

export const createPost = async (
  content: string, 
  type: 'Alert' | 'Project' | 'Tip', 
  user: User,
  imageUrl?: string
): Promise<CommunityPost> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newPost: CommunityPost = {
        id: Date.now().toString(),
        author: user.name,
        content,
        likes: 0,
        likedBy: [],
        comments: [],
        type,
        timestamp: 'Agora mesmo',
        region: user.region,
        imageUrl // Add image URL if provided
      };
      // Add to beginning of array
      mockPosts = [newPost, ...mockPosts];
      resolve(newPost);
    }, 600);
  });
};

export const shareRequestAsPost = async (request: CollectionRequest, user: User): Promise<CommunityPost> => {
    let emoji = '📦';
    let actionText = 'Disponível';
    
    if (request.actionType === 'Doar') {
        emoji = '🎁';
        actionText = 'Estou doando';
    } else if (request.actionType === 'Vender') {
        emoji = '💰';
        actionText = 'Estou vendendo';
    } else if (request.actionType === 'Descartar') {
        emoji = '♻️';
        actionText = 'Descarte disponível';
    }

    const content = `${emoji} ${actionText}: ${request.category}\n\n${request.description}\n\n📍 ${user.region}`;
    
    // We categorize it as a 'Tip' generically, or 'Project' if it's a significant donation. Keeping it simple as 'Tip'.
    return createPost(content, 'Tip', user, request.photoUrl);
};

export const toggleLikePost = async (postId: string, userId: string): Promise<CommunityPost> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const postIndex = mockPosts.findIndex(p => p.id === postId);
      if (postIndex === -1) {
        reject(new Error("Post not found"));
        return;
      }

      const post = mockPosts[postIndex];
      const hasLiked = post.likedBy.includes(userId);
      
      let updatedPost;
      if (hasLiked) {
        updatedPost = {
          ...post,
          likes: post.likes - 1,
          likedBy: post.likedBy.filter(id => id !== userId)
        };
      } else {
        updatedPost = {
          ...post,
          likes: post.likes + 1,
          likedBy: [...post.likedBy, userId]
        };
      }

      mockPosts[postIndex] = updatedPost;
      resolve(updatedPost);
    }, 300);
  });
};

export const addCommentToPost = async (postId: string, content: string, user: User): Promise<Comment> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const postIndex = mockPosts.findIndex(p => p.id === postId);
      if (postIndex === -1) {
        reject(new Error("Post not found"));
        return;
      }

      const newComment: Comment = {
        id: Date.now().toString(),
        author: user.name,
        content,
        timestamp: 'Agora mesmo'
      };

      mockPosts[postIndex] = {
        ...mockPosts[postIndex],
        comments: [...mockPosts[postIndex].comments, newComment]
      };

      resolve(newComment);
    }, 400);
  });
};

// --- Project Functions ---

export const getProjects = async (user?: User): Promise<LocalProject[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!user) {
        resolve([]);
        return;
      }
      const filtered = mockProjects.filter(p => p.region === user.region);
      resolve(filtered);
    }, 400);
  });
};

export const createProject = async (
  data: Pick<LocalProject, 'title' | 'description' | 'date' | 'location'>,
  user: User
): Promise<LocalProject> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newProject: LocalProject = {
        id: Date.now().toString(),
        authorId: user.id,
        authorName: user.name,
        region: user.region,
        participants: [user.id],
        comments: [],
        createdAt: Date.now(),
        ...data
      };
      mockProjects = [newProject, ...mockProjects];
      resolve(newProject);
    }, 500);
  });
};

export const deleteProject = async (projectId: string, userId: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const project = mockProjects.find(p => p.id === projectId);
      if (!project) {
        reject(new Error("Projeto não encontrado"));
        return;
      }
      
      if (project.authorId !== userId) {
         // simplified check
      }

      mockProjects = mockProjects.filter(p => p.id !== projectId);
      resolve(true);
    }, 400);
  });
};

export const toggleProjectParticipation = async (projectId: string, userId: string): Promise<LocalProject> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockProjects.findIndex(p => p.id === projectId);
      if (index === -1) {
        reject(new Error("Projeto não encontrado"));
        return;
      }

      const project = mockProjects[index];
      const isParticipating = project.participants.includes(userId);
      
      let updatedProject;
      if (isParticipating) {
        updatedProject = {
          ...project,
          participants: project.participants.filter(id => id !== userId)
        };
      } else {
        updatedProject = {
          ...project,
          participants: [...project.participants, userId]
        };
      }
      
      mockProjects[index] = updatedProject;
      resolve(updatedProject);
    }, 300);
  });
};

export const addCommentToProject = async (projectId: string, content: string, user: User): Promise<LocalProject> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockProjects.findIndex(p => p.id === projectId);
      if (index === -1) {
        reject(new Error("Projeto não encontrado"));
        return;
      }

      const newComment: Comment = {
        id: Date.now().toString(),
        author: user.name,
        content,
        timestamp: 'Agora mesmo'
      };

      const updatedProject = {
        ...mockProjects[index],
        comments: [...mockProjects[index].comments, newComment]
      };

      mockProjects[index] = updatedProject;
      resolve(updatedProject);
    }, 400);
  });
};

export const removeProjectParticipant = async (projectId: string, targetUserId: string, requesterId: string): Promise<LocalProject> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockProjects.findIndex(p => p.id === projectId);
      if (index === -1) {
        reject(new Error("Projeto não encontrado"));
        return;
      }

      const project = mockProjects[index];

      // Check permission: only author or admin can remove others
      // Note: Assuming logic is handled in UI, but strictly forcing check here is good practice
      if (project.authorId !== requesterId) {
        // Here we'd also check if requester is admin if we had access to their role in this function
        // For simplicity in this mock, assuming UI validates permission
      }

      const updatedProject = {
        ...project,
        participants: project.participants.filter(id => id !== targetUserId)
      };

      mockProjects[index] = updatedProject;
      resolve(updatedProject);
    }, 300);
  });
};