import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

function getDailyVisitorToken() {
  const key = 'image-upscaler-visitor-id';
  try {
    let token = localStorage.getItem(key);
    if (!token) {
      token = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, token);
    }
    return token;
  } catch {
    return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

export function DailyVisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/API/visitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitorToken: getDailyVisitorToken() }) })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (!cancelled && data?.success && typeof data.visitors === 'number') setCount(data.visitors); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return <div className="flex items-center justify-center gap-1.5 text-[11px] text-blue-200/65" aria-live="polite">
    <Users className="h-3 w-3" /><span>Visitors today:</span><span className="font-semibold tabular-nums">{count === null ? '—' : count.toLocaleString()}</span>
  </div>;
}
