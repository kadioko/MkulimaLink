import { useEffect, useCallback, useState } from 'react';

export const useKeyboardNavigation = (options = {}) => {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onSpace,
    shortcuts = {},
    enabled = true,
  } = options;

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Prevent default for custom shortcuts
    if (shortcuts[event.key] && shortcuts[event.key].preventDefault !== false) {
      event.preventDefault();
    }

    switch (event.key) {
      case 'Escape':
        onEscape?.(event);
        break;
      case 'Enter':
        if (!event.isComposing) {
          onEnter?.(event);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp?.(event);
        break;
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown?.(event);
        break;
      case 'ArrowLeft':
        onArrowLeft?.(event);
        break;
      case 'ArrowRight':
        onArrowRight?.(event);
        break;
      case 'Tab':
        onTab?.(event);
        break;
      case ' ':
        if (!event.target.tagName.match(/INPUT|TEXTAREA/)) {
          event.preventDefault();
          onSpace?.(event);
        }
        break;
      default:
        // Custom shortcuts
        if (shortcuts[event.key]) {
          shortcuts[event.key].action(event);
        }
        // Handle shortcuts with modifiers (e.g., Ctrl+K)
        const keyCombo = [
          event.ctrlKey ? 'Ctrl' : '',
          event.metaKey ? 'Cmd' : '',
          event.altKey ? 'Alt' : '',
          event.shiftKey ? 'Shift' : '',
          event.key,
        ].filter(Boolean).join('+');
        
        if (shortcuts[keyCombo]) {
          shortcuts[keyCombo].action(event);
        }
    }
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, onSpace, shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Hook for focus management in modals/dialogs
export const useFocusTrap = (containerRef, isActive) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [isActive, containerRef]);
};

// Hook for accessible list navigation
export const useListNavigation = (itemCount, options = {}) => {
  const { 
    loop = true, 
    initialIndex = -1,
    onSelect,
    onActivate,
  } = options;
  
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const navigateUp = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev <= 0) {
        return loop ? itemCount - 1 : prev;
      }
      return prev - 1;
    });
  }, [itemCount, loop]);

  const navigateDown = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev >= itemCount - 1) {
        return loop ? 0 : prev;
      }
      return prev + 1;
    });
  }, [itemCount, loop]);

  const selectCurrent = useCallback(() => {
    if (activeIndex >= 0 && activeIndex < itemCount) {
      onSelect?.(activeIndex);
    }
  }, [activeIndex, itemCount, onSelect]);

  const activateCurrent = useCallback(() => {
    if (activeIndex >= 0 && activeIndex < itemCount) {
      onActivate?.(activeIndex);
    }
  }, [activeIndex, itemCount, onActivate]);

  const reset = useCallback(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  return {
    activeIndex,
    setActiveIndex,
    navigateUp,
    navigateDown,
    selectCurrent,
    activateCurrent,
    reset,
  };
};

export default useKeyboardNavigation;
