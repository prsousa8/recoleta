import { CollectionPoint, BinStatus, User } from '../types';

const KEY_POINTS = 'ecorota_collection_points';

// Real coordinates for São Paulo (Centro and Vila Madalena regions)
const initialPoints: CollectionPoint[] = [
  // Centro
  { id: '1', address: 'Praça da Sé, Centro', status: BinStatus.FULL, lastCollection: '2 dias atrás', type: 'Reciclável', region: 'Centro', lat: -23.550520, lng: -46.633308 },
  { id: '2', address: 'Av. Paulista, 1578', status: BinStatus.OVERFLOWING, lastCollection: '1 dia atrás', type: 'Vidro', region: 'Centro', lat: -23.561414, lng: -46.655881 },
  { id: '3', address: 'Rua Augusta, 1000', status: BinStatus.EMPTY, lastCollection: 'Hoje', type: 'Orgânico', region: 'Centro', lat: -23.553974, lng: -46.655794 },
  { id: '4', address: 'Vale do Anhangabaú', status: BinStatus.HALF, lastCollection: '3 dias atrás', type: 'Reciclável', region: 'Centro', lat: -23.547530, lng: -46.638420 },
  { id: '5', address: 'Mercado Municipal', status: BinStatus.FULL, lastCollection: '4 dias atrás', type: 'Orgânico', region: 'Centro', lat: -23.541825, lng: -46.629330 },
  
  // Vila Madalena / Pinheiros
  { id: '6', address: 'Beco do Batman', status: BinStatus.FULL, lastCollection: '1 dia atrás', type: 'Reciclável', region: 'Vila Madalena', lat: -23.556858, lng: -46.686526 },
  { id: '7', address: 'Praça Pôr do Sol', status: BinStatus.EMPTY, lastCollection: 'Hoje', type: 'Vidro', region: 'Vila Madalena', lat: -23.554605, lng: -46.703417 },
  { id: '8', address: 'Rua Fradique Coutinho', status: BinStatus.HALF, lastCollection: '2 dias atrás', type: 'Orgânico', region: 'Vila Madalena', lat: -23.563065, lng: -46.689625 },
];

const getStorage = (): CollectionPoint[] => {
  try {
    const item = localStorage.getItem(KEY_POINTS);
    return item ? JSON.parse(item) : initialPoints;
  } catch {
    return initialPoints;
  }
};

const setStorage = (points: CollectionPoint[]) => {
  localStorage.setItem(KEY_POINTS, JSON.stringify(points));
};

export const getPointsByRegion = async (region: string): Promise<CollectionPoint[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allPoints = getStorage();
      // Ensure initial data is saved
      if (!localStorage.getItem(KEY_POINTS)) setStorage(initialPoints);
      
      const filtered = allPoints.filter(p => p.region === region);
      resolve(filtered);
    }, 400);
  });
};

export const addPoint = async (
  pointData: Omit<CollectionPoint, 'id' | 'lastCollection'>, 
  user: User
): Promise<CollectionPoint> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user.role !== 'organization') {
        reject(new Error("Apenas administradores podem adicionar pontos."));
        return;
      }

      const allPoints = getStorage();
      
      const newPoint: CollectionPoint = {
        id: Date.now().toString(),
        ...pointData,
        lastCollection: 'Nunca',
        region: user.region // Force region to match admin's region
      };

      const updated = [...allPoints, newPoint];
      setStorage(updated);
      resolve(newPoint);
    }, 500);
  });
};

export const deletePoint = async (pointId: string, user: User): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user.role !== 'organization') {
        reject(new Error("Permissão negada."));
        return;
      }
      
      const allPoints = getStorage();
      const updated = allPoints.filter(p => p.id !== pointId);
      setStorage(updated);
      resolve(true);
    }, 400);
  });
};

export const updatePointStatus = async (pointId: string, status: BinStatus): Promise<CollectionPoint> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const allPoints = getStorage();
            const index = allPoints.findIndex(p => p.id === pointId);
            if(index === -1) {
                reject(new Error("Ponto não encontrado"));
                return;
            }
            
            allPoints[index].status = status;
            if (status === BinStatus.EMPTY) {
                allPoints[index].lastCollection = 'Hoje';
            }
            
            setStorage(allPoints);
            resolve(allPoints[index]);
        }, 300);
    });
}