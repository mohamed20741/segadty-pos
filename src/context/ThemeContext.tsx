"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('system');
    const [isDark, setIsDark] = useState(false);

    // Initialize theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('segadty_theme') as Theme | null;
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
            setTheme(savedTheme);
        }
    }, []);

    // Update theme and document class when theme changes
    useEffect(() => {
        const updateTheme = () => {
            let dark = false;
            
            if (theme === 'system') {
                dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            } else {
                dark = theme === 'dark';
            }
            
            setIsDark(dark);
            
            // Update document class for Tailwind
            if (dark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            
            // Update CSS custom properties for dark mode
            const root = document.documentElement;
            if (dark) {
                root.style.setProperty('--background', '#0a0a0a');
                root.style.setProperty('--foreground', '#fafafa');
                root.style.setProperty('--card', '#111827');
                root.style.setProperty('--card-foreground', '#f9fafb');
                root.style.setProperty('--popover', '#111827');
                root.style.setProperty('--popover-foreground', '#f9fafb');
                root.style.setProperty('--primary', '#8B4513');
                root.style.setProperty('--primary-foreground', '#ffffff');
                root.style.setProperty('--secondary', '#374151');
                root.style.setProperty('--secondary-foreground', '#f9fafb');
                root.style.setProperty('--muted', '#374151');
                root.style.setProperty('--muted-foreground', '#9ca3af');
                root.style.setProperty('--accent', '#374151');
                root.style.setProperty('--accent-foreground', '#f9fafb');
                root.style.setProperty('--destructive', '#dc2626');
                root.style.setProperty('--destructive-foreground', '#f9fafb');
                root.style.setProperty('--border', '#374151');
                root.style.setProperty('--input', '#374151');
                root.style.setProperty('--ring', '#8B4513');
                root.style.setProperty('--surface', '#1f2937');
                root.style.setProperty('--surface-foreground', '#f9fafb');
            } else {
                root.style.setProperty('--background', '#FAF9F6');
                root.style.setProperty('--foreground', '#3E2723');
                root.style.setProperty('--card', '#ffffff');
                root.style.setProperty('--card-foreground', '#0f172a');
                root.style.setProperty('--popover', '#ffffff');
                root.style.setProperty('--popover-foreground', '#0f172a');
                root.style.setProperty('--primary', '#8B4513');
                root.style.setProperty('--primary-foreground', '#ffffff');
                root.style.setProperty('--secondary', '#f1f5f9');
                root.style.setProperty('--secondary-foreground', '#0f172a');
                root.style.setProperty('--muted', '#f1f5f9');
                root.style.setProperty('--muted-foreground', '#64748b');
                root.style.setProperty('--accent', '#f1f5f9');
                root.style.setProperty('--accent-foreground', '#0f172a');
                root.style.setProperty('--destructive', '#ef4444');
                root.style.setProperty('--destructive-foreground', '#f9fafb');
                root.style.setProperty('--border', '#e2e8f0');
                root.style.setProperty('--input', '#e2e8f0');
                root.style.setProperty('--ring', '#8B4513');
                root.style.setProperty('--surface', '#F5F5DC');
                root.style.setProperty('--surface-foreground', '#3E2723');
            }
        };

        updateTheme();

        // Listen for system theme changes when theme is 'system'
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                updateTheme();
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    const handleSetTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('segadty_theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};