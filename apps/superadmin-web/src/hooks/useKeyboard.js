/**
 * @module useKeyboard
 * @description Global keyboard shortcut handler.
 *              Registers Cmd+K (Mac) / Ctrl+K (Win) for command search.
 *              Also handles Escape to close panels.
 */

import { useEffect } from 'react';

/**
 * Register a keyboard shortcut
 * @param {string} key           - Key to listen for (e.g. 'k', 'Escape')
 * @param {Function} callback    - Handler to call
 * @param {{ meta?: boolean, ctrl?: boolean, shift?: boolean }} modifiers
 */
export const useKeyboard = (key, callback, modifiers = {}) => {
  useEffect(() => {
    const handler = (e) => {
      const metaMatch  = modifiers.meta  ? (e.metaKey || e.ctrlKey) : true;
      const ctrlMatch  = modifiers.ctrl  ? e.ctrlKey  : true;
      const shiftMatch = modifiers.shift ? e.shiftKey : true;

      if (e.key === key && metaMatch && ctrlMatch && shiftMatch) {
        e.preventDefault();
        callback(e);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, modifiers]);
};

/**
 * Hook for Cmd+K / Ctrl+K command search shortcut
 * @param {Function} onOpen - Called when shortcut fires
 */
export const useCommandSearch = (onOpen) => {
  useKeyboard('k', onOpen, { meta: true });
};
