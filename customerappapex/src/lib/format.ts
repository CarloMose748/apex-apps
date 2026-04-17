import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { litresToKilograms } from './units';

// Date formatting utilities
export const formatDate = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const formatDateTime = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

export const formatTimeAgo = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

// Number formatting utilities
export const formatVolume = (volume: number) => {
  return `${litresToKilograms(volume).toFixed(1)}kg`;
};

export const formatMass = (mass: number) => {
  return `${mass.toFixed(1)}kg`;
};

export const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

export const formatPercent = (value: number, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

// Status formatting
export const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  const statusLower = status.toLowerCase();
  
  if (['completed', 'certified', 'active', 'clean'].includes(statusLower)) {
    return 'success';
  }
  
  if (['pending', 'in_progress', 'scheduled', 'contaminated'].includes(statusLower)) {
    return 'warning';
  }
  
  if (['failed', 'rejected', 'error', 'inactive'].includes(statusLower)) {
    return 'danger';
  }
  
  return 'neutral';
};

// File utilities
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validation utilities
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Environmental calculations
export const calculateCO2eSavings = (volumeLiters: number) => {
  // Approximate calculation: 1L of waste cooking oil = ~2.04kg CO2e saved
  const co2ePerLiter = 2.04;
  return volumeLiters * co2ePerLiter;
};

export const calculateBiodieselEquivalent = (volumeLiters: number) => {
  // Approximate: 1L waste oil = 0.95L biodiesel
  const conversionRate = 0.95;
  return volumeLiters * conversionRate;
};

// Search and filter utilities
export const highlightSearchTerm = (text: string, searchTerm: string) => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

export const fuzzySearch = (items: any[], searchTerm: string, keys: string[]) => {
  if (!searchTerm.trim()) return items;
  
  const term = searchTerm.toLowerCase();
  
  return items.filter(item => {
    return keys.some(key => {
      const value = getNestedValue(item, key);
      return value && value.toString().toLowerCase().includes(term);
    });
  });
};

// Utility to get nested object values
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Toast notification helper
export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  // In a real app, this would integrate with a toast library
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Simple browser notification for demo
  if (type === 'error') {
    alert(`Error: ${message}`);
  } else if (type === 'success') {
    console.log(`✅ ${message}`);
  }
};

// Local storage utilities
export const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Handle storage errors silently
    }
  },
  
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Handle storage errors silently
    }
  }
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};