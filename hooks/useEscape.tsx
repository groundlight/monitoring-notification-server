import { useEffect } from 'react';

export default function useEscape(onEscape: () => void) {
  useEffect(() => {
    function onKeyup(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Esc") onEscape()
    }
    window.addEventListener('keyup', onKeyup);
    return () => window.removeEventListener('keyup', onKeyup);
  }, []);
}