import { useState, useCallback } from 'react';

export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    open: false,
    title: '',
    message: '',
    type: 'info',
    onCloseCallback: null,
  });

  const showAlert = useCallback(({ title = '', message, type = 'info', onClose = null }) => {
    setAlertState({
      open: true,
      title,
      message,
      type,
      onCloseCallback: onClose,
    });
  }, []);

  const closeAlert = useCallback(() => {
    const callback = alertState.onCloseCallback;
    setAlertState(prev => ({ ...prev, open: false }));
    if (callback) callback();
  }, [alertState.onCloseCallback]);

  const success = useCallback((message, options = {}) => {
    showAlert({ message, type: 'success', title: options.title || 'Success', ...options });
  }, [showAlert]);

  const error = useCallback((message, options = {}) => {
    showAlert({ message, type: 'error', title: options.title || 'Error', ...options });
  }, [showAlert]);

  const warning = useCallback((message, options = {}) => {
    showAlert({ message, type: 'warning', title: options.title || 'Warning', ...options });
  }, [showAlert]);

  const info = useCallback((message, options = {}) => {
    showAlert({ message, type: 'info', title: options.title || 'Info', ...options });
  }, [showAlert]);

  return {
    alertState,
    showAlert,
    closeAlert,
    success,
    error,
    warning,
    info,
  };
};
