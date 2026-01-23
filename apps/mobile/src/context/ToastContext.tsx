import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, description?: string, type?: ToastType, duration?: number) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    message: string,
    description?: string,
    type: ToastType = 'info',
    duration: number = 3000
  ) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, description, type, duration };
    
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const success = useCallback((message: string, description?: string) => {
    showToast(message, description, 'success');
  }, [showToast]);

  const error = useCallback((message: string, description?: string) => {
    showToast(message, description, 'error');
  }, [showToast]);

  const info = useCallback((message: string, description?: string) => {
    showToast(message, description, 'info');
  }, [showToast]);

  const warning = useCallback((message: string, description?: string) => {
    showToast(message, description, 'warning');
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const [slideAnim] = useState(new Animated.Value(-100));
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss animation
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }, (toast.duration || 3000) - 200);

    return () => clearTimeout(timer);
  }, []);

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (toast.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (toast.type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
      default:
        return theme.colors.primary;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return '#10B98120';
      case 'error':
        return '#EF444420';
      case 'warning':
        return '#F59E0B20';
      case 'info':
      default:
        return theme.colors.primary + '20';
    }
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
          borderLeftColor: getIconColor(),
          backgroundColor: theme.colors.card,
          borderColor: getBorderColor(),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={onDismiss}
        activeOpacity={0.9}
      >
        <Ionicons name={getIconName()} size={24} color={getIconColor()} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.message}>{toast.message}</Text>
          {toast.description && (
            <Text style={styles.description}>{toast.description}</Text>
          )}
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    flexShrink: 0,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});



