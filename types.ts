
export enum BinStatus {
  EMPTY = 'Vazio',
  HALF = 'Meio Cheio',
  FULL = 'Cheio',
  OVERFLOWING = 'Transbordando'
}

export interface CollectionPoint {
  id: string;
  address: string;
  status: BinStatus;
  lastCollection: string;
  type: 'Reciclável' | 'Orgânico' | 'Vidro';
  predictedLevel?: string;
  region: string;
  lat?: number;
  lng?: number;
}

export interface OptimizedRoute {
  points: CollectionPoint[];
  estimatedTime: string;
  reasoning: string;
  distanceSaved: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  content: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  type: 'Alert' | 'Project' | 'Tip';
  timestamp: string;
  region: string;
  imageUrl?: string;
  isSponsored?: boolean;
}

export interface LocalProject {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  region: string;
  date: string;
  location: string;
  participants: string[];
  comments: Comment[];
  createdAt: number;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  createdAt: string;
  createdBy: string;
  region: string;
}

export interface CollectionSchedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  wasteType: 'Reciclável' | 'Orgânico' | 'Vidro' | 'Geral';
  sector: string;
  region: string;
}

export interface UserStats {
  points: number;
  level: number;
  recycledKg: number;
  rank: string;
  badges: string[];
  co2Saved: number;
  energySaved: string;
}

// Gamification Specifics
export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: 'daily' | 'weekly' | 'special';
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  challengeTitle: string;
  userId: string;
  userName: string;
  proofText: string;
  status: SubmissionStatus;
  adminFeedback?: string;
  timestamp: string;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  description: string;
  stock: number;
  available: boolean;
}

export interface RedemptionRequest {
  id: string;
  userId: string;
  userName: string;
  rewardId: string;
  rewardTitle: string;
  cost: number;
  status: 'pending' | 'delivered' | 'rejected';
  adminFeedback?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

// --- NEW COLLECTION REQUEST TYPES ---

export type RequestStatus = 'created' | 'queued' | 'in_route' | 'collected' | 'cancelled';
export type ActionType = 'Doar' | 'Vender' | 'Descartar';
export type ItemCategory = 'Eletrônico' | 'Móvel' | 'Reciclável' | 'Óleo' | 'Outro';

export interface CollectionRequest {
  id: string;
  userId: string;
  userName: string;
  communityId: string;
  photoUrl: string;
  category: ItemCategory;
  actionType: ActionType;
  address: string;
  description: string;
  scheduledAt: string;
  status: RequestStatus;
  createdAt: string;
}

// --- Auth Types ---

export type UserRole = 'resident' | 'organization';

export interface OrganizationData {
  cnpj: string;
  contactName: string;
  segment: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  region: string;
  // Resident fields
  address?: string;
  phone?: string;
  cpf?: string; // Added CPF
  householdSize?: number;
  // Organization fields
  organizationData?: OrganizationData;
}

export interface AuthResponse {
  user: User;
  token: string;
}
