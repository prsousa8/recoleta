
import { User, UserRole, AuthResponse, OrganizationData } from '../types';

const KEY_USERS = 'ecorota_users';
const KEY_SESSION = 'ecorota_active_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

// Initial Mock Data
const initialUsers: User[] = [
  {
    id: 'org-1',
    name: 'Condomínio Solar',
    email: 'admin@solar.com',
    password: '123456', // Default password for testing
    role: 'organization',
    avatar: 'https://ui-avatars.com/api/?name=Solar&background=10b981&color=fff',
    region: 'Centro',
    phone: '11999999999',
    organizationData: {
      cnpj: '12.345.678/0001-99',
      contactName: 'Síndico Roberto',
      segment: 'Condomínio Residencial'
    }
  },
  {
    id: 'user-1',
    name: 'Carlos Morador',
    email: 'carlos@email.com',
    password: '123456', // Default password for testing
    role: 'resident',
    avatar: 'https://ui-avatars.com/api/?name=Carlos&background=random',
    address: 'Bloco A, Ap 42',
    phone: '11988888888',
    cpf: '123.456.789-00',
    householdSize: 4,
    region: 'Centro'
  }
];

// Helper to get users from storage
const getUsersFromStorage = (): User[] => {
  const stored = localStorage.getItem(KEY_USERS);
  if (!stored) {
    localStorage.setItem(KEY_USERS, JSON.stringify(initialUsers));
    return initialUsers;
  }
  return JSON.parse(stored);
};

const saveUsersToStorage = (users: User[]) => {
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
};

// --- Session Management ---

const saveSession = (user: User) => {
  const sessionData = {
    user,
    expiry: Date.now() + SESSION_DURATION
  };
  localStorage.setItem(KEY_SESSION, JSON.stringify(sessionData));
};

export const getActiveSession = (): User | null => {
  try {
    const stored = localStorage.getItem(KEY_SESSION);
    if (!stored) return null;

    const { user, expiry } = JSON.parse(stored);
    
    // Check if expired
    if (Date.now() > expiry) {
      localStorage.removeItem(KEY_SESSION);
      return null;
    }
    return user;
  } catch (e) {
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem(KEY_SESSION);
};

// --- Auth Functions ---

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (password.length < 6) {
        reject(new Error("A senha deve ter pelo menos 6 caracteres."));
        return;
      }

      const users = getUsersFromStorage();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        // Fallback for demo convenience (Mock Admin)
        if (email.includes('admin') && password === '123456') {
             const magicOrg: User = {
                id: Date.now().toString(),
                name: 'Gestão Temporária',
                email,
                role: 'organization',
                avatar: `https://ui-avatars.com/api/?name=Gestao&background=000&color=fff`,
                region: 'Centro',
                organizationData: {
                  cnpj: '00.000.000/0001-00',
                  contactName: 'Admin Temp',
                  segment: 'Administradora'
                }
             };
             saveSession(magicOrg);
             resolve({ user: magicOrg, token: 'mock-token-' + Date.now() });
             return;
        }
        reject(new Error("Usuário não encontrado ou senha incorreta."));
        return;
      }

      // Password Validation
      if (user.password && user.password !== password) {
         reject(new Error("Senha incorreta."));
         return;
      }

      saveSession(user);
      resolve({
        user,
        token: 'mock-jwt-token-' + Date.now()
      });
    }, 800);
  });
};

export const registerUser = async (
  name: string, 
  email: string, 
  password: string, 
  role: UserRole,
  region: string,
  // Optional based on role
  address?: string,
  phone?: string,
  householdSize?: number,
  cpf?: string,
  orgData?: OrganizationData
): Promise<AuthResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!name || !email || !password || !region) {
        reject(new Error("Preencha todos os campos obrigatórios."));
        return;
      }

      const users = getUsersFromStorage();
      if (users.find(u => u.email === email)) {
        reject(new Error("Este email já está cadastrado."));
        return;
      }

      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        password, // Save the password
        role,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=random`,
        region,
        phone // Common field
      };

      if (role === 'resident') {
         newUser.address = address;
         newUser.cpf = cpf;
         newUser.householdSize = householdSize || 1;
      } else {
         if (!orgData?.cnpj) {
           reject(new Error("CNPJ é obrigatório para organizações."));
           return;
         }
         newUser.organizationData = orgData;
      }

      users.push(newUser);
      saveUsersToStorage(users);
      saveSession(newUser);

      resolve({
        user: newUser,
        token: 'mock-jwt-token-' + Date.now()
      });
    }, 1000);
  });
};

export const updateUserProfile = async (updatedData: Partial<User> & { id: string }): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUsersFromStorage();
      const index = users.findIndex(u => u.id === updatedData.id);

      if (index === -1) {
        reject(new Error("Usuário não encontrado."));
        return;
      }

      const updatedUser = {
        ...users[index],
        ...updatedData,
        avatar: updatedData.name 
          ? `https://ui-avatars.com/api/?name=${updatedData.name}&background=random`
          : users[index].avatar,
        // Ensure password persists if not updated
        password: users[index].password 
      };

      users[index] = updatedUser;
      saveUsersToStorage(users);
      
      const currentSession = getActiveSession();
      if (currentSession && currentSession.id === updatedUser.id) {
        saveSession(updatedUser);
      }

      resolve(updatedUser);
    }, 800);
  });
};

export const getAllUsers = async (): Promise<User[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const users = getUsersFromStorage();
            resolve(users);
        }, 500);
    });
};

export const deleteUser = async (userId: string): Promise<boolean> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const users = getUsersFromStorage();
            const filtered = users.filter(u => u.id !== userId);
            saveUsersToStorage(filtered);
            resolve(true);
        }, 500);
    });
};

export const logoutUser = () => {
  clearSession();
};
