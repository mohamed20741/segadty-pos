"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Load user from localStorage on mount
        const savedUser = localStorage.getItem('segadty_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse saved user", e);
                localStorage.removeItem('segadty_user');
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Redirect if not logged in and trying to access protected routes
        const publicRoutes = ['/login', '/'];
        if (!isLoading) {
            if (!user && !publicRoutes.includes(pathname) && !pathname.startsWith('/(auth)')) {
                router.push('/login');
            } else if (user && pathname === '/login') {
                router.push('/dashboard');
            }
        }
    }, [user, isLoading, pathname, router]);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('segadty_user', JSON.stringify(userData));
        router.push('/dashboard');
    };

    const logout = () => {
        setUser(null);
        // Clear all session related data
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('segadty_')) {
                localStorage.removeItem(key);
            }
        });

        // Use both router and window.location for redundancy
        router.push('/login');
        setTimeout(() => {
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }, 300);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
