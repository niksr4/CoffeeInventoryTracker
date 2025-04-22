import React, { createContext, useContext, ReactNode, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define user type
export interface User {
  id: number;
  username: string;
  role: "admin" | "user";
}

// Define login credentials type
export interface LoginCredentials {
  username: string;
  password: string;
}

// Define registration credentials type
export interface RegisterCredentials extends LoginCredentials {
  role?: "admin" | "user";
}

// Define the auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Login function
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/login", credentials);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
      const userData = await response.json();
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/register", credentials);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
      const userData = await response.json();
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.username}!`,
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/logout");
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      setUser(null);
      queryClient.setQueryData(["/api/user"], null);
      // Invalidate all queries
      queryClient.invalidateQueries();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAdmin,
    login,
    register,
    logout,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}