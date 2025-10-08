import React, { useState, useCallback } from 'react';
import { CustomAlert } from '../components/CustomAlert';
import type { AlertType, AlertButton } from '../components/CustomAlert';

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

export function useCustomAlert() {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
  });

  const showAlert = useCallback((
    title: string,
    message?: string,
    type: AlertType = 'info',
    buttons?: AlertButton[]
  ) => {
    setAlertState({
      visible: true,
      title,
      message,
      type,
      buttons: buttons || [{ text: 'OK' }],
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert(title, message, 'success', buttons);
  }, [showAlert]);

  const showError = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert(title, message, 'error', buttons);
  }, [showAlert]);

  const showWarning = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert(title, message, 'warning', buttons);
  }, [showAlert]);

  const showInfo = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert(title, message, 'info', buttons);
  }, [showAlert]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showAlert(title, message, 'warning', [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Confirm', style: 'destructive', onPress: onConfirm },
    ]);
  }, [showAlert]);

  // Return JSX element instead of component
  const AlertComponent = () => (
    <CustomAlert
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      buttons={alertState.buttons}
      onClose={hideAlert}
    />
  );

  const renderAlert = () => (
    <CustomAlert
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      buttons={alertState.buttons}
      onClose={hideAlert}
    />
  );

  return {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    hideAlert,
    AlertComponent,
    renderAlert,
  };
}