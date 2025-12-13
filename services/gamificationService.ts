
import { Challenge, Reward, User, ChallengeSubmission, SubmissionStatus, RedemptionRequest, CollectionRequest } from '../types';
import { getAllUsers } from './authService';

// Local Storage Keys
const KEY_CHALLENGES = 'ecorota_challenges';
const KEY_REWARDS = 'ecorota_rewards';
const KEY_SUBMISSIONS = 'ecorota_submissions';
const KEY_REDEMPTIONS = 'ecorota_redemptions';
const KEY_USER_STATS = 'ecorota_user_stats'; // New key for persistent points
const KEY_REQUESTS = 'ecorota_collection_requests'; // Access requests directly for ranking

// Initial Data (only used if storage is empty)
const initialChallenges: Challenge[] = [
  { id: '1', title: 'Semana Zero Plástico', description: 'Não descarte plásticos não-recicláveis por 7 dias.', xpReward: 500, type: 'weekly' },
  { id: '2', title: 'Indique 1 Vizinho', description: 'Traga um vizinho para o app reColeta.', xpReward: 200, type: 'special' },
  { id: '3', title: 'Compostagem Diária', description: 'Registre sua compostagem de hoje.', xpReward: 50, type: 'daily' },
];

const initialRewards: Reward[] = [
  { id: 'r1', title: 'Desconto no IPTU Verde', cost: 5000, description: 'Cupom de 5% de desconto no imposto municipal.', stock: 10, available: true },
  { id: 'r2', title: 'Kit Jardinagem', cost: 1500, description: 'Luvas, pá e sementes entregues em casa.', stock: 5, available: true },
  { id: 'r3', title: 'Voucher Feira Orgânica', cost: 800, description: 'R$ 20,00 para gastar na feira de domingo.', stock: 50, available: true },
];

// Helpers
const getStorage = <T>(key: string, defaults: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaults;
  } catch {
    return defaults;
  }
};

const setStorage = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Helper to manage persistent user points
export const getLiveUserPoints = async (userId: string): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allStats = getStorage<Record<string, { points: number }>>(KEY_USER_STATS, {});
      
      // Initialize with demo value if not present, to match the mock App state
      if (allStats[userId] === undefined) {
        allStats[userId] = { points: 10450 }; // Default for demo
        setStorage(KEY_USER_STATS, allStats);
      }
      
      resolve(allStats[userId].points);
    }, 200);
  });
};

const updateUserPointsInternal = (userId: string, amount: number, operation: 'add' | 'subtract') => {
  const allStats = getStorage<Record<string, { points: number }>>(KEY_USER_STATS, {});
  
  if (allStats[userId] === undefined) {
    allStats[userId] = { points: 10450 };
  }

  if (operation === 'add') {
    allStats[userId].points += amount;
  } else {
    allStats[userId].points = Math.max(0, allStats[userId].points - amount);
  }

  setStorage(KEY_USER_STATS, allStats);
  return allStats[userId].points;
};

// Updated Interface for Ranking including Environmental Stats
export interface RankedUser {
    name: string;
    points: number;
    avatar: string;
    kgRecycled: number;
    treesSaved: number;
    requestsCount: number;
}

export const getRegionalRanking = async (region: string): Promise<RankedUser[]> => {
  const users = await getAllUsers();
  
  // Fetch Requests directly to calculate ranking based on activity
  const requests = getStorage<CollectionRequest[]>(KEY_REQUESTS, []);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter users by region
  const regionalUsers = users.filter(u => u.region === region && u.role === 'resident');

  // Map users to their recycling stats for THIS month
  const rankingData = regionalUsers.map(u => {
      const userRequests = requests.filter(r => {
          const reqDate = new Date(r.createdAt);
          return r.userId === u.id && 
                 r.status === 'collected' && // Only count completed collections
                 reqDate.getMonth() === currentMonth && 
                 reqDate.getFullYear() === currentYear;
      });

      const count = userRequests.length;
      // Heuristic: Each request is approx 5kg or 50 points
      const points = count * 50; 
      const kgRecycled = count * 5; 
      const treesSaved = parseFloat((kgRecycled / 50).toFixed(2)); // heuristic

      return {
        name: u.name,
        points: points,
        avatar: u.avatar || `https://ui-avatars.com/api/?name=${u.name}`,
        kgRecycled,
        treesSaved,
        requestsCount: count
      };
  });

  // Sort by Points (or Count) descending
  return rankingData
    .sort((a, b) => b.points - a.points)
    .slice(0, 10); // Top 10
};

export const getChallenges = async (): Promise<Challenge[]> => {
  const data = getStorage(KEY_CHALLENGES, initialChallenges);
  // Ensure we save defaults if empty to initialize
  if (!localStorage.getItem(KEY_CHALLENGES)) setStorage(KEY_CHALLENGES, data);
  return new Promise((resolve) => setTimeout(() => resolve(data), 300));
};

export const getRewards = async (): Promise<Reward[]> => {
  const data = getStorage(KEY_REWARDS, initialRewards);
  if (!localStorage.getItem(KEY_REWARDS)) setStorage(KEY_REWARDS, data);
  return new Promise((resolve) => setTimeout(() => resolve(data), 300));
};

export const getUserSubmissions = async (userId: string): Promise<ChallengeSubmission[]> => {
  const submissions = getStorage<ChallengeSubmission[]>(KEY_SUBMISSIONS, []);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(submissions.filter(s => s.userId === userId));
    }, 300);
  });
};

export const getPendingSubmissions = async (): Promise<ChallengeSubmission[]> => {
  const submissions = getStorage<ChallengeSubmission[]>(KEY_SUBMISSIONS, []);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(submissions.filter(s => s.status === 'pending'));
    }, 300);
  });
};

export const getPendingRedemptions = async (): Promise<RedemptionRequest[]> => {
  const redemptions = getStorage<RedemptionRequest[]>(KEY_REDEMPTIONS, []);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(redemptions.filter(r => r.status === 'pending'));
    }, 300);
  });
};

export const submitChallengeProof = async (
  challengeId: string, 
  proofText: string, 
  user: User
): Promise<ChallengeSubmission> => {
  const challenges = getStorage<Challenge[]>(KEY_CHALLENGES, initialChallenges);
  const submissions = getStorage<ChallengeSubmission[]>(KEY_SUBMISSIONS, []);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) {
        reject(new Error("Desafio não encontrado"));
        return;
      }

      const existing = submissions.find(s => s.userId === user.id && s.challengeId === challengeId && s.status !== 'rejected');
      if (existing) {
        reject(new Error("Você já enviou uma prova para este desafio."));
        return;
      }

      const newSubmission: ChallengeSubmission = {
        id: Date.now().toString(),
        challengeId,
        challengeTitle: challenge.title,
        userId: user.id,
        userName: user.name,
        proofText,
        status: 'pending',
        timestamp: new Date().toLocaleDateString()
      };

      const otherSubmissions = submissions.filter(s => !(s.userId === user.id && s.challengeId === challengeId));
      const updatedSubmissions = [newSubmission, ...otherSubmissions];
      
      setStorage(KEY_SUBMISSIONS, updatedSubmissions);
      resolve(newSubmission);
    }, 500);
  });
};

export const reviewSubmission = async (
  submissionId: string, 
  status: 'approved' | 'rejected', 
  feedback: string
): Promise<{ success: boolean; xpAwarded: number }> => {
  const submissions = getStorage<ChallengeSubmission[]>(KEY_SUBMISSIONS, []);
  const challenges = getStorage<Challenge[]>(KEY_CHALLENGES, initialChallenges);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = submissions.findIndex(s => s.id === submissionId);
      if (index === -1) {
        reject(new Error("Submissão não encontrada"));
        return;
      }

      const submission = submissions[index];
      const challenge = challenges.find(c => c.id === submission.challengeId);
      const xp = (status === 'approved' && challenge) ? challenge.xpReward : 0;

      // Update the submission status
      submissions[index] = {
        ...submission,
        status,
        adminFeedback: feedback
      };
      setStorage(KEY_SUBMISSIONS, submissions);

      // If approved, ACTUALLY update the user's persistent points score
      if (status === 'approved' && xp > 0) {
        updateUserPointsInternal(submission.userId, xp, 'add');
      }

      resolve({ success: true, xpAwarded: xp });
    }, 500);
  });
};

// MODIFIED: Do NOT deduct points immediately, only verify them.
export const redeemReward = async (rewardId: string, currentPoints: number, user: User): Promise<{ success: boolean }> => {
  const rewards = getStorage<Reward[]>(KEY_REWARDS, initialRewards);
  const redemptions = getStorage<RedemptionRequest[]>(KEY_REDEMPTIONS, []);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward) {
        reject(new Error("Recompensa não encontrada"));
        return;
      }

      if (reward.stock <= 0) {
        reject(new Error("Estoque esgotado para este item."));
        return;
      }

      // Check Real Persistent Points
      const allStats = getStorage<Record<string, { points: number }>>(KEY_USER_STATS, {});
      const actualPoints = allStats[user.id]?.points ?? 10450;

      if (actualPoints < reward.cost) {
        reject(new Error("Pontos insuficientes"));
        return;
      }

      const newRedemption: RedemptionRequest = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        rewardId: reward.id,
        rewardTitle: reward.title,
        cost: reward.cost,
        status: 'pending',
        timestamp: new Date().toLocaleDateString()
      };

      const updatedRedemptions = [newRedemption, ...redemptions];
      setStorage(KEY_REDEMPTIONS, updatedRedemptions);

      // DO NOT DEDUCT POINTS YET - Wait for Admin Approval
      resolve({ success: true });
    }, 600);
  });
};

// RENAMED & REFACTORED: Process redemption (Approve or Reject)
export const processRedemption = async (
  redemptionId: string, 
  status: 'delivered' | 'rejected', // 'delivered' = approved
  feedback: string
): Promise<boolean> => {
  const redemptions = getStorage<RedemptionRequest[]>(KEY_REDEMPTIONS, []);
  const rewards = getStorage<Reward[]>(KEY_REWARDS, initialRewards);
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = redemptions.findIndex(r => r.id === redemptionId);
      if (index === -1) {
        reject(new Error("Solicitação não encontrada"));
        return;
      }

      const redemption = redemptions[index];
      const rewardIndex = rewards.findIndex(r => r.id === redemption.rewardId);

      // Validation for approval
      if (status === 'delivered') {
          // 1. Check if reward still exists and has stock
          if (rewardIndex === -1 || rewards[rewardIndex].stock <= 0) {
              reject(new Error("Estoque insuficiente para aprovar."));
              return;
          }

          // 2. Check user points again (double check)
          const allStats = getStorage<Record<string, { points: number }>>(KEY_USER_STATS, {});
          const currentPoints = allStats[redemption.userId]?.points ?? 10450;
          if (currentPoints < redemption.cost) {
              reject(new Error("O usuário não tem mais pontos suficientes."));
              return;
          }

          // 3. Deduct points
          updateUserPointsInternal(redemption.userId, redemption.cost, 'subtract');

          // 4. Decrement Stock
          rewards[rewardIndex].stock -= 1;
          setStorage(KEY_REWARDS, rewards);
      }

      // Update Redemption Status
      redemptions[index].status = status;
      redemptions[index].adminFeedback = feedback;
      setStorage(KEY_REDEMPTIONS, redemptions);

      resolve(true);
    }, 500);
  });
};

export const createChallenge = async (
  title: string, 
  description: string, 
  xp: number, 
  user: User
): Promise<Challenge> => {
  const challenges = getStorage<Challenge[]>(KEY_CHALLENGES, initialChallenges);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user.role !== 'organization') {
        reject(new Error("Apenas administradores podem criar desafios."));
        return;
      }

      const newChallenge: Challenge = {
        id: Date.now().toString(),
        title,
        description,
        xpReward: xp,
        type: 'special'
      };

      const updatedChallenges = [newChallenge, ...challenges];
      setStorage(KEY_CHALLENGES, updatedChallenges);
      resolve(newChallenge);
    }, 500);
  });
};

export const updateChallenge = async (
  id: string,
  updates: Partial<Pick<Challenge, 'title' | 'description' | 'xpReward'>>,
  user: User
): Promise<Challenge> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user.role !== 'organization') {
        reject(new Error("Apenas administradores podem editar desafios."));
        return;
      }

      const challenges = getStorage<Challenge[]>(KEY_CHALLENGES, initialChallenges);
      const index = challenges.findIndex(c => c.id === id);
      
      if (index === -1) {
        reject(new Error("Desafio não encontrado"));
        return;
      }

      const updatedChallenge = {
        ...challenges[index],
        ...updates
      };

      challenges[index] = updatedChallenge;
      setStorage(KEY_CHALLENGES, challenges);
      resolve(updatedChallenge);
    }, 500);
  });
};

export const deleteChallenge = async (id: string, user: User): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user.role !== 'organization') {
        reject(new Error("Apenas administradores podem excluir desafios."));
        return;
      }

      const challenges = getStorage<Challenge[]>(KEY_CHALLENGES, initialChallenges);
      const updatedChallenges = challenges.filter(c => c.id !== id);
      
      setStorage(KEY_CHALLENGES, updatedChallenges);
      resolve(true);
    }, 500);
  });
};

// --- REWARDS CRUD ---

export const createReward = async (
  title: string, 
  cost: number, 
  description: string, 
  stock: number,
  user: User
): Promise<Reward> => {
  const rewards = getStorage<Reward[]>(KEY_REWARDS, initialRewards);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user.role !== 'organization') {
        reject(new Error("Apenas administradores podem criar recompensas."));
        return;
      }

      const newReward: Reward = {
        id: Date.now().toString(),
        title,
        cost,
        description,
        stock: stock || 0,
        available: true
      };

      const updatedRewards = [newReward, ...rewards];
      setStorage(KEY_REWARDS, updatedRewards);
      resolve(newReward);
    }, 500);
  });
};

export const updateReward = async (
  id: string,
  updates: Partial<Pick<Reward, 'title' | 'cost' | 'description' | 'stock'>>,
  user: User
): Promise<Reward> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user.role !== 'organization') {
        reject(new Error("Apenas administradores podem editar recompensas."));
        return;
      }

      const rewards = getStorage<Reward[]>(KEY_REWARDS, initialRewards);
      const index = rewards.findIndex(r => r.id === id);
      
      if (index === -1) {
        reject(new Error("Recompensa não encontrada"));
        return;
      }

      const updatedReward = {
        ...rewards[index],
        ...updates
      };

      rewards[index] = updatedReward;
      setStorage(KEY_REWARDS, rewards);
      resolve(updatedReward);
    }, 500);
  });
};

export const deleteReward = async (id: string, user: User): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user.role !== 'organization') {
        reject(new Error("Apenas administradores podem excluir recompensas."));
        return;
      }

      const rewards = getStorage<Reward[]>(KEY_REWARDS, initialRewards);
      const updatedRewards = rewards.filter(r => r.id !== id);
      
      setStorage(KEY_REWARDS, updatedRewards);
      resolve(true);
    }, 500);
  });
};
