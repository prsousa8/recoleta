import { Alert, User } from '../types';

const KEY_ALERTS = 'ecorota_alerts';

const initialAlerts: Alert[] = [
  {
    id: '1',
    title: 'Mudança no Horário de Coleta',
    message: 'Devido ao feriado, a coleta de recicláveis passará às 09:00, não às 08:00.',
    type: 'info',
    createdAt: '2 horas atrás',
    createdBy: 'Prefeitura',
    region: 'Centro'
  },
  {
    id: '2',
    title: 'Ponto de Coleta Interditado',
    message: 'O ponto da Rua das Flores está em manutenção. Utilize o ponto da Praça Central.',
    type: 'warning',
    createdAt: '1 dia atrás',
    createdBy: 'Gestão Ambiental',
    region: 'Centro'
  },
  {
    id: '3',
    title: 'Campanha de Vidros',
    message: 'Traga seus vidros para a praça principal neste sábado.',
    type: 'info',
    createdAt: '3 horas atrás',
    createdBy: 'ONG Local',
    region: 'Vila Madalena'
  }
];

// Helpers
const getStorage = (): Alert[] => {
  try {
    const item = localStorage.getItem(KEY_ALERTS);
    return item ? JSON.parse(item) : initialAlerts;
  } catch {
    return initialAlerts;
  }
};

const setStorage = (alerts: Alert[]) => {
  localStorage.setItem(KEY_ALERTS, JSON.stringify(alerts));
};

export const getAlerts = async (user?: User): Promise<Alert[]> => {
  const alerts = getStorage();
  // Ensure we initialize storage if empty
  if (!localStorage.getItem(KEY_ALERTS)) setStorage(initialAlerts);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!user) {
        resolve([]);
        return;
      }
      
      if (user.role === 'organization') {
         // Admins see all alerts (to manage) but practically they usually only care about their region
         // However, to keep management simple, we let admins see the database, or restrict to their region?
         // Given "Remove Global" context, strict filtering is better.
         const filtered = alerts.filter(a => a.region === user.region);
         resolve(filtered);
      } else {
         // Residents see only their region. Removed 'Global' fallback.
         const filtered = alerts.filter(a => a.region === user.region);
         resolve(filtered);
      }
    }, 500);
  });
};

export const createAlert = async (
  title: string, 
  message: string, 
  type: 'info' | 'warning' | 'critical',
  user: User
): Promise<Alert> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user.role !== 'organization') {
        reject(new Error("Permissão negada. Apenas administradores podem criar alertas."));
        return;
      }

      const alerts = getStorage();
      const newAlert: Alert = {
        id: Date.now().toString(),
        title,
        message,
        type,
        createdAt: 'Agora mesmo',
        createdBy: user.name,
        region: user.region // Alerts are created strictly for the Admin's region
      };

      const updatedAlerts = [newAlert, ...alerts];
      setStorage(updatedAlerts);
      resolve(newAlert);
    }, 800);
  });
};

export const updateAlert = async (
  id: string,
  updates: Partial<Pick<Alert, 'title' | 'message' | 'type'>>
): Promise<Alert> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const alerts = getStorage();
      const index = alerts.findIndex(a => a.id === id);
      
      if (index === -1) {
        reject(new Error("Alerta não encontrado."));
        return;
      }

      const updatedAlert = {
        ...alerts[index],
        ...updates
      };

      alerts[index] = updatedAlert;
      setStorage(alerts);
      resolve(updatedAlert);
    }, 500);
  });
};

export const deleteAlert = async (alertId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const alerts = getStorage();
      const updatedAlerts = alerts.filter(a => a.id !== alertId);
      setStorage(updatedAlerts);
      resolve(true);
    }, 500);
  });
};