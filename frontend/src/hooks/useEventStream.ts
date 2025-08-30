import { useEffect, useRef } from 'react';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../context/AuthContext';

export function useEventStream() {
  const { accessToken } = useAuth();
  const { push } = useToast();
  const esRef = useRef<EventSource | null>(null);
  useEffect(() => {
    if (!accessToken) return;
    const url = (import.meta as any).env.VITE_API_URL || 'http://localhost:4000/api';
    const es = new EventSource(url.replace(/\/$/, '') + '/notifications/stream', { withCredentials: false });
    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        push({ message: `${evt.type}`, type: 'info' });
      } catch {/* ignore */}
    };
    es.onerror = () => { es.close(); };
    esRef.current = es;
    return () => { es.close(); };
  }, [accessToken, push]);
}