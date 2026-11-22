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
  const [counts, setCounts] = useState<{ today: number; total: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/API/visitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitorToken: getDailyVisitorToken() }) })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data?.success && typeof data.visitors === 'number' && typeof data.totalVisitors === 'number') {
          setCounts({ today: data.visitors, total: data.totalVisitors });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-blue-200/65" aria-live="polite">
    <span className="inline-flex items-center gap-1.5"><Users className="h-3 w-3" /><span>Today:</span><span className="font-semibold tabular-nums">{counts === null ? '—' : counts.today.toLocaleString()}</span></span>
    <span className="inline-flex items-center gap-1.5"><span>Total visitors:</span><span className="font-semibold tabular-nums">{counts === null ? '—' : counts.total.toLocaleString()}</span></span>
  </div>;
}
