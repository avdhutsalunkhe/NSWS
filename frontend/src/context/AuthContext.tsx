import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Plant, SugarSeason } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  selectedPlant: Plant | null;
  selectedSeason: string;
  selectedMonth: string;
  allPlants: Plant[];
  allSeasons: SugarSeason[];
  login: (token: string, user: User) => void;
  logout: () => void;
  setSelectedPlant: (plant: Plant | null) => void;
  setSelectedSeason: (season: string) => void;
  setSelectedMonth: (month: string) => void;
  refreshPlants: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sugar_erp_token'));
  const [loading, setLoading] = useState(true);
  const [allPlants, setAllPlants] = useState<Plant[]>([]);
  const [allSeasons, setAllSeasons] = useState<SugarSeason[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('2023-24');
  const [selectedMonth, setSelectedMonth] = useState<string>('October');

  const logout = () => {
    localStorage.removeItem('sugar_erp_token');
    localStorage.removeItem('sugar_erp_user');
    setToken(null);
    setUser(null);
    setSelectedPlant(null);
  };

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('sugar_erp_token', newToken);
    localStorage.setItem('sugar_erp_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const refreshPlants = async () => {
    try {
      const data = await api.getPlants();
      const plantsList: Plant[] = data.plants ? data.plants : [];
      setAllPlants(plantsList);

      if (user && user.role === 'CLERK' && user.plantId) {
        const myPlant = plantsList.find((p) => String(p.id) === String(user.plantId));
        if (myPlant) {
          setSelectedPlant(myPlant);
        }
      } else if (plantsList.length > 0) {
        const isValid = selectedPlant && plantsList.some((p) => p.id === selectedPlant.id);
        if (!isValid) {
          setSelectedPlant(plantsList[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load plants:', err);
    }
  };

  const loadSeasons = async () => {
    try {
      const data = await api.getSeasons();
      const seasonsList: SugarSeason[] = data.seasons ? data.seasons : [];
      setAllSeasons(seasonsList);
      const current = seasonsList.find((s) => s.is_current === 1);
      if (current) {
        setSelectedSeason(current.season_name);
      }
    } catch (err) {
      console.error('Failed to load seasons:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('sugar_erp_token');
      const savedUserStr = localStorage.getItem('sugar_erp_user');

      if (savedToken && savedUserStr) {
        try {
          const parsedUser = JSON.parse(savedUserStr);
          setUser(parsedUser);
          setToken(savedToken);

          // Refresh user profile from server
          const meData = await api.getMe();
          if (meData && meData.user) {
            setUser(meData.user);
            localStorage.setItem('sugar_erp_user', JSON.stringify(meData.user));
          }
        } catch (e) {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (token) {
      refreshPlants();
      loadSeasons();
    }
  }, [token, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        selectedPlant,
        selectedSeason,
        selectedMonth,
        allPlants,
        allSeasons,
        login,
        logout,
        setSelectedPlant,
        setSelectedSeason,
        setSelectedMonth,
        refreshPlants,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
