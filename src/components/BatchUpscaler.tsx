import React, { useRef, useState } from 'react';
import { CheckCircle2, Download, ImagePlus, Loader2, Play, Trash2, XCircle } from 'lucide-react';
import { EnhancementMode, ImageInfo, ProcessingProgress, UpscaleResult, UpscaleScale } from '../types';
import { loadImageInfoFromFile, triggerDownload } from '../lib/imageUtils';
import { runUpscalePipeline } from '../lib/inference';
import { terminatePersistentWorker } from '../lib/workerClient';

type BatchStatus = 'ready' | 'processing' | 'done' | 'error' | 'cancelled';
interface BatchItem {
  id: string;
  info: ImageInfo;
  status: BatchStatus;
  progress: number;
  message: string;
  result?: UpscaleResult;
  error?: string;
}

export const BatchUpscaler: React.FC = () => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [scale, setScale] = useState<UpscaleScale>(4);
  const [mode, setMode] = useState<EnhancementMode>('natural');
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | File[]) => {
    const available = Math.max(0, 4 - items.length);
    const selected = Array.from(files).slice(0, available);
    if (!selected.length) return;
    const loaded: BatchItem[] = [];
    for (let i = 0; i < selected.length; i++) {
      try {
        const info = await loadImageInfoFromFile(selected[i]);
        loaded.push({
          id: String(Date.now()) + '-' + String(i) + '-' + selected[i].name,
          info,
          status: 'ready',
          progress: 0,
          message: 'Ready to process'
        });
      } catch (error: any) {
        loaded.push({
          id: String(Date.now()) + '-' + String(i) + '-' + selected[i].name,
          info: {
            name: selected[i].name, width: 0, height: 0, sizeBytes: selected[i].size,
            format: selected[i].type, hasAlpha: false, dataUrl: '', aspectRatio: 1
          },
          status: 'error',
          progress: 0,
          message: 'Could not load image',
          error: error?.message || 'Could not open this image.'
        });
      }
    }
    setItems((current) => current.concat(loaded).slice(0, 4));
    if (inputRef.current) inputRef.current.value = '';
  };

  const startBatch = async () => {
    if (running || !items.some((item) => item.status === 'ready')) return;
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const queue = items.filter((item) => item.status === 'ready').map((item) => item.id);
      for (const id of queue) {
        if (controller.signal.aborted) break;
        const item = items.find((entry) => entry.id === id);
        if (!item || !item.info.dataUrl) continue;
        setItems((current) => current.map((entry) => entry.id === id
          ? { ...entry, status: 'processing', progress: 0, message: 'Starting...' }
          : entry));
        try {
          const result = await runUpscalePipeline(
            item.info,
            { scale, mode },
            (progress: ProcessingProgress) => {
              setItems((current) => current.map((entry) => entry.id === id
                ? { ...entry, progress: progress.percent, message: progress.message }
                : entry));
            },
            controller.signal
          );
          if (controller.signal.aborted) {
            if (result.dataUrl && result.dataUrl.startsWith('blob:')) URL.revokeObjectURL(result.dataUrl);
            break;
          }
          setItems((current) => current.map((entry) => entry.id === id
            ? { ...entry, status: 'done', progress: 100, message: 'Completed', result }
            : entry));
        } catch (error: any) {
          const cancelled = controller.signal.aborted || error?.message?.toLowerCase().includes('cancelled');
          setItems((current) => current.map((entry) => entry.id === id
            ? { ...entry, status: cancelled ? 'cancelled' : 'error', message: cancelled ? 'Cancelled' : 'Failed', error: cancelled ? undefined : (error?.message || 'Processing failed') }
            : entry));
          if (controller.signal.aborted) break;
        }
      }
      if (controller.signal.aborted) {
        setItems((current) => current.map((entry) => entry.status === 'ready'
          ? { ...entry, status: 'cancelled', message: 'Cancelled' }
          : entry));
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const cancelBatch = () => {
    abortRef.current?.abort();
    terminatePersistentWorker();
  };

  const clearBatch = () => {
    if (running) return;
    items.forEach((item) => {
      if (item.result?.dataUrl?.startsWith('blob:')) URL.revokeObjectURL(item.result.dataUrl);
    });
    setItems([]);
  };

  const downloadItem = (item: BatchItem) => {
    if (!item.result) return;
    const baseName = item.info.name.replace(/\.[^.]+$/, '');
    triggerDownload(item.result.blob || item.result.dataUrl, baseName + '-' + scale + 'x-upscaled.png');
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Batch Image Upscaler</h2>
          <p className="text-xs text-zinc-400 mt-1">Upscale up to 4 images one by one in your browser.</p>
        </div>
        <span className="text-xs text-zinc-400">{items.length}/4 images</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-zinc-400">
          Upscale size
          <select value={scale} disabled={running} onChange={(e) => setScale(Number(e.target.value) as UpscaleScale)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white">
            <option value={2}>2×</option><option value={4}>4×</option><option value={8}>8×</option>
          </select>
        </label>
        <label className="text-xs text-zinc-400">
          Enhancement mode
          <select value={mode} disabled={running} onChange={(e) => setMode(e.target.value as EnhancementMode)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white">
            <option value="preserve">Preserve Original</option><option value="natural">Natural</option><option value="sharp">Sharp</option>
          </select>
        </label>
      </div>

      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/bmp,image/gif"
        className="hidden" disabled={running || items.length >= 4}
        onChange={(e) => { if (e.target.files) void addFiles(e.target.files); }} />
      <button type="button" disabled={running || items.length >= 4} onClick={() => inputRef.current?.click()}
        className="w-full rounded-xl border border-dashed border-zinc-600 bg-zinc-950/60 px-4 py-5 text-sm text-zinc-200 hover:border-sky-500 disabled:opacity-50 flex items-center justify-center gap-2">
        <ImagePlus className="w-5 h-5 text-sky-400" />
        {items.length >= 4 ? 'Maximum 4 images selected' : 'Choose images (up to 4)'}
      </button>

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <span className="text-xs text-zinc-300">{index + 1}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{item.info.name}</p>
                  <p className="text-xs text-zinc-500">{item.status === 'done' ? 'Completed' : item.status === 'error' ? (item.error || 'Failed') : item.message}</p>
                </div>
                {item.status === 'done' && <button type="button" onClick={() => downloadItem(item)} className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-zinc-950 flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Download</button>}
                {item.status === 'processing' && <Loader2 className="w-5 h-5 animate-spin text-sky-400" />}
                {item.status === 'done' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {(item.status === 'error' || item.status === 'cancelled') && <XCircle className="w-5 h-5 text-rose-400" />}
              </div>
              {(item.status === 'processing' || item.status === 'done') && (
                <div className="mt-3 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-sky-400 transition-all" style={{ width: String(item.progress) + '%' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!running ? (
          <button type="button" disabled={!items.some((item) => item.status === 'ready')} onClick={() => void startBatch()}
            className="flex-1 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-40 flex items-center justify-center gap-2">
            <Play className="w-4 h-4" /> Start batch
          </button>
        ) : (
          <button type="button" onClick={cancelBatch} className="flex-1 rounded-lg bg-rose-600 px-4 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2">
            <XCircle className="w-4 h-4" /> Cancel batch
          </button>
        )}
        <button type="button" disabled={running || items.length === 0} onClick={clearBatch}
          className="rounded-lg border border-zinc-700 px-4 py-3 text-sm text-zinc-300 disabled:opacity-40 flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>
      <p className="text-[11px] text-zinc-500">Images are processed sequentially. Large images may take longer and use significant browser memory.</p>
    </section>
  );
};
