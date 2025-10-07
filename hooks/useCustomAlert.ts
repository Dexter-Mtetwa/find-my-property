import { useState, useCallback } from 'react';
import { CustomAlertButton } from '../components/CustomAlert';

interface AlertOptions {
  type?: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  buttons?: CustomAlertButton[];
}

export function useCustomAlert() {
  const [alertConfig, setAlertConfig] = useState<AlertOptions & { visible: boolean }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertConfig({
      visible: true,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      buttons: options.buttons || [{ text: 'OK', style: 'default' }],
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    alertConfig,
    showAlert,
    hideAlert,
  };
}
