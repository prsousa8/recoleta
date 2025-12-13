
import { CollectionRequest, User } from '../types';

const KEY_REQUESTS = 'ecorota_collection_requests';

const initialRequests: CollectionRequest[] = [
  {
    id: 'req-1',
    userId: 'user-1',
    userName: 'Carlos Morador',
    communityId: 'Centro',
    photoUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=300&auto=format&fit=crop',
    category: 'Eletrônico',
    actionType: 'Descartar',
    address: 'Bloco A, Ap 42',
    description: 'TV antiga de tubo, pesada.',
    scheduledAt: '2025-05-20T14:00:00.000Z',
    status: 'collected',
    createdAt: '2025-05-18T10:00:00.000Z'
  },
  {
    id: 'req-2',
    userId: 'user-1',
    userName: 'Carlos Morador',
    communityId: 'Centro',
    photoUrl: 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde?q=80&w=300&auto=format&fit=crop',
    category: 'Móvel',
    actionType: 'Doar',
    address: 'Bloco A, Ap 42',
    description: 'Cadeira de escritório em bom estado.',
    scheduledAt: '2025-06-10T09:00:00.000Z',
    status: 'queued',
    createdAt: '2025-06-08T08:00:00.000Z'
  }
];

const getStorage = (): CollectionRequest[] => {
  try {
    const item = localStorage.getItem(KEY_REQUESTS);
    return item ? JSON.parse(item) : initialRequests;
  } catch {
    return initialRequests;
  }
};

const setStorage = (requests: CollectionRequest[]) => {
  localStorage.setItem(KEY_REQUESTS, JSON.stringify(requests));
};

export const getUserRequests = async (user: User): Promise<CollectionRequest[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStorage();
      
      // Residents see their own requests
      if (user.role === 'resident') {
        const myRequests = all
            .filter(r => r.userId === user.id)
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(myRequests);
      } 
      // Organizations (Admins) see ALL requests in their region
      else {
        const regionalRequests = all.filter(r => r.communityId === user.region);
        
        // Custom Sort for Admins: Pending actions (Created/Queued) first, then others
        const sorted = regionalRequests.sort((a, b) => {
            const priorityStatus = ['created', 'queued'];
            const aIsPriority = priorityStatus.includes(a.status);
            const bIsPriority = priorityStatus.includes(b.status);
            
            if (aIsPriority && !bIsPriority) return -1;
            if (!aIsPriority && bIsPriority) return 1;
            
            // Secondary sort by date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        resolve(sorted);
      }
    }, 500);
  });
};

export const createRequest = async (
  data: Omit<CollectionRequest, 'id' | 'status' | 'createdAt' | 'userId' | 'userName' | 'communityId'>,
  user: User
): Promise<CollectionRequest> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStorage();
      
      const newRequest: CollectionRequest = {
        id: 'req-' + Date.now(),
        userId: user.id,
        userName: user.name,
        communityId: user.region, // Important: Associates request with the condo/region
        status: 'created',
        createdAt: new Date().toISOString(),
        ...data
      };

      setStorage([newRequest, ...all]);
      resolve(newRequest);
    }, 800);
  });
};

export const updateRequest = async (
  requestId: string,
  data: Partial<Omit<CollectionRequest, 'id' | 'userId' | 'createdAt'>>,
  user: User
): Promise<CollectionRequest> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const all = getStorage();
      const index = all.findIndex(r => r.id === requestId);

      if (index === -1) {
        reject(new Error("Solicitação não encontrada"));
        return;
      }

      // Check permissions: User must own the request or be admin
      if (all[index].userId !== user.id && user.role !== 'organization') {
        reject(new Error("Permissão negada"));
        return;
      }

      const updatedRequest = { ...all[index], ...data };
      all[index] = updatedRequest;
      setStorage(all);
      resolve(updatedRequest);
    }, 600);
  });
};

export const deleteRequest = async (requestId: string, user: User): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const all = getStorage();
      const request = all.find(r => r.id === requestId);

      if (!request) {
        reject(new Error("Solicitação não encontrada"));
        return;
      }

      if (request.userId !== user.id && user.role !== 'organization') {
        reject(new Error("Permissão negada"));
        return;
      }

      const filtered = all.filter(r => r.id !== requestId);
      setStorage(filtered);
      resolve(true);
    }, 500);
  });
};

export const updateRequestStatus = async (requestId: string, status: CollectionRequest['status']): Promise<CollectionRequest> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const all = getStorage();
            const index = all.findIndex(r => r.id === requestId);
            
            if (index === -1) {
                reject(new Error("Request not found"));
                return;
            }
            
            all[index].status = status;
            setStorage(all);
            resolve(all[index]);
        }, 500);
    });
};
