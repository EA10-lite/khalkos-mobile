/**
 * Modal management hook
 * Technical/UI logic for modal state management
 */

import { useCallback, useState } from 'react';

interface ModalState {
  isOpen: boolean;
  data?: any;
}

export function useModal(initialState: boolean = false) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: initialState,
    data: null,
  });

  const openModal = useCallback((data?: any) => {
    setModalState({
      isOpen: true,
      data,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      data: null,
    });
  }, []);

  const toggleModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  }, []);

  return {
    isOpen: modalState.isOpen,
    data: modalState.data,
    openModal,
    closeModal,
    toggleModal,
  };
}
