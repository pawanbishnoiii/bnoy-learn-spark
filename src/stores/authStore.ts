import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: any | null;
  roles: string[];
  isLoading: boolean;
  isAdmin: boolean;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  fetchRoles: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  roles: [],
  isLoading: true,
  isAdmin: false,

  initialize: async () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        setTimeout(() => {
          get().fetchProfile(session.user.id);
          get().fetchRoles(session.user.id);
        }, 0);
      } else {
        set({ profile: null, roles: [], isAdmin: false });
      }
    });

    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, isLoading: false });
    if (session?.user) {
      await get().fetchProfile(session.user.id);
      await get().fetchRoles(session.user.id);
    } else {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, roles: [], isAdmin: false });
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    set({ profile: data });
  },

  fetchRoles: async (userId) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    const roles = data?.map((r: any) => r.role) || [];
    
    // Auto-assign student role if no roles exist
    if (roles.length === 0) {
      await supabase.from('user_roles').insert({ user_id: userId, role: 'student' });
      set({ roles: ['student'], isAdmin: false, isLoading: false });
    } else {
      set({ roles, isAdmin: roles.includes('admin'), isLoading: false });
    }
  },
}));
