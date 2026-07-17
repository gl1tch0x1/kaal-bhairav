import { create } from 'zustand';

interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: string | null;
}

interface GlobalState {
  user: UserData | null;
  alertCount: number;
  setUser: (user: UserData | null) => void;
  setAlertCount: (count: number) => void;
  fetchUser: () => Promise<void>;
  fetchAlertCount: () => Promise<void>;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  user: null,
  alertCount: 0,
  setUser: (user) => set({ user }),
  setAlertCount: (count) => set({ alertCount: count }),
  fetchUser: async () => {
    try {
      const r = await fetch('/api/auth/me');
      const d = await r.json();
      if (d.user) set({ user: d.user });
    } catch (e) {
      console.error('Failed to fetch user', e);
    }
  },
  fetchAlertCount: async () => {
    try {
      const r = await fetch('/api/alerts?unread=true');
      const d = await r.json();
      if (d.alerts) set({ alertCount: d.alerts.length });
    } catch (e) {
      console.error('Failed to fetch alerts', e);
    }
  }
}));
