import { CollectionSchedule, User } from '../types';

const KEY_SCHEDULES = 'ecorota_schedules';

const initialSchedules: CollectionSchedule[] = [
  { id: '1', dayOfWeek: 'Segunda-feira', startTime: '08:00', endTime: '12:00', wasteType: 'Orgânico', sector: 'Todo o Bairro', region: 'Centro' },
  { id: '2', dayOfWeek: 'Segunda-feira', startTime: '13:00', endTime: '17:00', wasteType: 'Reciclável', sector: 'Área Comercial', region: 'Centro' },
  { id: '3', dayOfWeek: 'Quarta-feira', startTime: '08:00', endTime: '12:00', wasteType: 'Orgânico', sector: 'Todo o Bairro', region: 'Centro' },
  { id: '4', dayOfWeek: 'Sexta-feira', startTime: '09:00', endTime: '11:00', wasteType: 'Vidro', sector: 'Pontos de Entrega Voluntária', region: 'Centro' },
  { id: '5', dayOfWeek: 'Terça-feira', startTime: '07:00', endTime: '11:00', wasteType: 'Orgânico', sector: 'Ruas Principais', region: 'Vila Madalena' },
];

const getStorage = (): CollectionSchedule[] => {
  try {
    const item = localStorage.getItem(KEY_SCHEDULES);
    return item ? JSON.parse(item) : initialSchedules;
  } catch {
    return initialSchedules;
  }
};

const setStorage = (schedules: CollectionSchedule[]) => {
  localStorage.setItem(KEY_SCHEDULES, JSON.stringify(schedules));
};

export const getSchedules = async (region: string): Promise<CollectionSchedule[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStorage();
      if (!localStorage.getItem(KEY_SCHEDULES)) setStorage(initialSchedules);
      const filtered = all.filter(s => s.region === region);
      
      // Sort helper (Mon -> Sun)
      const daysOrder: Record<string, number> = { 
        'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3, 'Quinta-feira': 4, 
        'Sexta-feira': 5, 'Sábado': 6, 'Domingo': 7 
      };
      
      filtered.sort((a, b) => (daysOrder[a.dayOfWeek] || 8) - (daysOrder[b.dayOfWeek] || 8));
      
      resolve(filtered);
    }, 400);
  });
};

export const createSchedule = async (
  data: Omit<CollectionSchedule, 'id' | 'region'>, 
  user: User
): Promise<CollectionSchedule> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user.role !== 'organization') {
        reject(new Error("Apenas administradores podem criar horários."));
        return;
      }
      
      const all = getStorage();
      const newSchedule: CollectionSchedule = {
        id: Date.now().toString(),
        ...data,
        region: user.region
      };
      
      setStorage([...all, newSchedule]);
      resolve(newSchedule);
    }, 500);
  });
};

export const updateSchedule = async (
  id: string,
  updates: Partial<CollectionSchedule>,
  user: User
): Promise<CollectionSchedule> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user.role !== 'organization') {
        reject(new Error("Apenas administradores podem editar."));
        return;
      }
      
      const all = getStorage();
      const index = all.findIndex(s => s.id === id);
      if (index === -1) {
        reject(new Error("Horário não encontrado"));
        return;
      }
      
      const updated = { ...all[index], ...updates };
      all[index] = updated;
      setStorage(all);
      resolve(updated);
    }, 500);
  });
};

export const deleteSchedule = async (id: string, user: User): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user.role !== 'organization') {
        reject(new Error("Apenas administradores podem remover."));
        return;
      }
      
      const all = getStorage();
      const filtered = all.filter(s => s.id !== id);
      setStorage(filtered);
      resolve(true);
    }, 500);
  });
};

// --- Helper for Next Collection Logic ---

export interface NextCollectionInfo {
  dayLabel: string; // "Hoje", "Amanhã", "Segunda-feira"
  timeRange: string;
  wasteType: string;
  sector: string;
}

export const getNextCollectionSlot = async (region: string): Promise<NextCollectionInfo | null> => {
  const schedules = await getSchedules(region);
  if (schedules.length === 0) return null;

  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 = Sunday, 1 = Monday
  // Map Portuguese days to JS Day Index
  const dayMap: Record<string, number> = {
    'Domingo': 0, 'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3, 
    'Quinta-feira': 4, 'Sexta-feira': 5, 'Sábado': 6
  };

  let nextEvent: { date: Date, schedule: CollectionSchedule } | null = null;

  // Find the next occurrence for each schedule
  schedules.forEach(schedule => {
    const schedDayIndex = dayMap[schedule.dayOfWeek];
    if (schedDayIndex === undefined) return;

    // Parse start time
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    
    // Calculate date difference
    let daysUntil = schedDayIndex - currentDayIndex;
    
    // Logic to handle times
    const eventDate = new Date(now);
    eventDate.setHours(startHour, startMin, 0, 0);

    // If it's today but time has passed, move to next week
    if (daysUntil === 0 && eventDate <= now) {
       daysUntil = 7;
    } else if (daysUntil < 0) {
       // Day already passed this week
       daysUntil += 7;
    }

    eventDate.setDate(now.getDate() + daysUntil);

    // Compare to find earliest
    if (!nextEvent || eventDate < nextEvent.date) {
      nextEvent = { date: eventDate, schedule };
    }
  });

  if (!nextEvent) return null;

  // Format Output
  const diffDays = Math.floor((nextEvent.date.getTime() - now.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
  
  let dayLabel = nextEvent.schedule.dayOfWeek;
  if (diffDays === 0) dayLabel = 'Hoje';
  if (diffDays === 1) dayLabel = 'Amanhã';

  return {
    dayLabel,
    timeRange: `${nextEvent.schedule.startTime} - ${nextEvent.schedule.endTime}`,
    wasteType: nextEvent.schedule.wasteType,
    sector: nextEvent.schedule.sector
  };
};