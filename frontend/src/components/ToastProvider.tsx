import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import successAnim from '../assets/lottie/success.json';

type Toast = { id: string; message: string; type?: 'success'|'error'|'info' };

const ToastContext = createContext<{ push: (t: Omit<Toast,'id'>) => void }|null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast,'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, ...t }]);
    setTimeout(()=> setToasts(prev => prev.filter(x=>x.id!==id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div style={{ position:'fixed', top:16, right:16, display:'flex', flexDirection:'column', gap:12, zIndex:9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background:'#1f2937', padding:'0.75rem 1rem', borderRadius:12, minWidth:220, boxShadow:'0 4px 12px rgba(0,0,0,.4)', display:'flex', gap:8, alignItems:'center', border:'1px solid #374151' }}>
            <div style={{ width:40 }}><Lottie animationData={successAnim} loop={false} /></div>
            <div style={{ fontSize:14 }}>
              <strong style={{ textTransform:'capitalize' }}>{t.type||'info'}</strong><br />{t.message}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(){
  const ctx = useContext(ToastContext);
  if(!ctx) throw new Error('ToastProvider missing');
  return ctx;
}