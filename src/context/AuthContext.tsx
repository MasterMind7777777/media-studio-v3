
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@/types';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isEmailSignupDisabled: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailSignupDisabled, setIsEmailSignupDisabled] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Helper function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (data) {
        setUserRole(data.role as UserRole);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  useEffect(() => {
    // Set up the auth state listener first - IMPORTANT to use this order
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state change event:', event);
        
        // First update the session and user state synchonously
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Handle authentication events
        if (event === 'SIGNED_IN') {
          // Clear any stale cache data on sign-in
          queryClient.clear();
          
          // Use setTimeout to avoid Supabase client deadlocks
          if (currentSession?.user) {
            setTimeout(() => {
              fetchUserProfile(currentSession.user.id);
            }, 0);
          }
          
          toast({
            title: "Sign-in successful",
            description: "Welcome back!"
          });
        } else if (event === 'SIGNED_OUT') {
          // Clear all cache data on sign-out
          queryClient.clear();
          setUserRole(null);
          
          toast({
            title: "Signed out",
            description: "You have been signed out successfully."
          });
          navigate('/auth', { replace: true });
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Auth token refreshed');
        } else if (event === 'USER_UPDATED') {
          console.log('User updated');
          if (currentSession?.user) {
            setTimeout(() => {
              fetchUserProfile(currentSession.user.id);
            }, 0);
          }
        }
      }
    );

    // Then check for existing session
    const initAuth = async () => {
      try {
        console.log('Checking for existing session');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Fetch user profile data if user is logged in
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [navigate, queryClient]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in with email and password');
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message.includes("Email logins are disabled")) {
          setIsEmailSignupDisabled(true);
          throw new Error("Email login is currently disabled by the administrator.");
        }
        throw error;
      }
      
      // Clear any stale caches on successful login
      queryClient.clear();
      
      // Navigation will be handled by auth state change listener
    } catch (error: any) {
      toast({
        title: "Sign-in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Signing up with email and password');
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) {
        if (error.message.includes("Email signups are disabled")) {
          setIsEmailSignupDisabled(true);
          throw new Error("Email signup is currently disabled by the administrator. Please contact support for assistance.");
        }
        throw error;
      }
      
      // Clear any stale caches on successful signup
      queryClient.clear();
      
      toast({
        title: "Sign-up successful",
        description: "Your account has been created. Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Sign-up failed",
        description: error.message || "Please try again with different credentials.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      // Clear all caches on sign-out
      queryClient.clear();
      
      // Navigation will be handled by auth state change listener
    } catch (error: any) {
      toast({
        title: "Sign-out failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Compute isAdmin value based on userRole
  const isAdmin = userRole === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      isEmailSignupDisabled,
      userRole,
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
