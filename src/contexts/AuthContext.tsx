import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, authApi, getStoredUser, setStoredUser, clearToken, clearStoredUser, setToken } from "@/lib/apiClient";

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; code?: string }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  resendConfirmationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      // Verify token is still valid
      authApi.getProfile().then((result) => {
        if (result.error) {
          // Token expired
          clearToken();
          clearStoredUser();
          setUser(null);
        } else if (result.data) {
          const userData = result.data;
          setUser(userData);
          setStoredUser(userData);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; code?: string }> => {
    try {
      const result = await authApi.login(email, password);

      if (result.error) {
        return {
          success: false,
          error: result.error,
          code: result.error.includes("not confirmed") ? "email_not_confirmed" : undefined,
        };
      }

      if (result.data?.user) {
        setUser(result.data.user);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const signup = async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await authApi.signup(email, password, fullName);

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const resendConfirmationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await api.post("/auth/resend-confirmation", { email });
      if (result.error) {
        return { success: false, error: result.error };
      }
      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await authApi.resetPassword(email);
      if (result.error) {
        return { success: false, error: result.error };
      }
      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        resendConfirmationEmail,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
