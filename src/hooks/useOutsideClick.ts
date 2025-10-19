import { useEffect, type RefObject } from 'react';

/**
 * Custom hook to detect clicks outside of a referenced element
 * @param ref - React ref to the element to watch
 * @param handler - Function to call when outside click is detected
 */
export const useOutsideClick = (
  ref: RefObject<HTMLElement>,
  handler: () => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};
