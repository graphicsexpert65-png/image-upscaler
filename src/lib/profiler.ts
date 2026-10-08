/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProcessingTimings {
  imagePrepMs: number;
  modelLoadMs: number;
  sessionInitMs: number;
  aiInferenceMs: number;
  tileStitchingMs: number;
  finalResizeMs: number;
  enhancementMs: number;
  exportBlobMs: number;
  totalMs: number;
}

export class StageTimer {
  private startTimes: Map<string, number> = new Map();
  private durations: Map<string, number> = new Map();
  private overallStart: number = performance.now();

  start(stage: string) {
    this.startTimes.set(stage, performance.now());
  }

  stop(stage: string) {
    const startTime = this.startTimes.get(stage);
    if (startTime !== undefined) {
      const elapsed = Math.round(performance.now() - startTime);
      this.durations.set(stage, elapsed);
    }
  }

  set(stage: string, durationMs: number) {
    this.durations.set(stage, Math.round(durationMs));
  }

  get(stage: string): number {
    return this.durations.get(stage) || 0;
  }

  finish(totalMsOverride?: number): ProcessingTimings {
    const totalMs = totalMsOverride !== undefined ? totalMsOverride : Math.round(performance.now() - this.overallStart);
    const timings: ProcessingTimings = {
      imagePrepMs: this.get('imagePrep'),
      modelLoadMs: this.get('modelLoad'),
      sessionInitMs: this.get('sessionInit'),
      aiInferenceMs: this.get('aiInference'),
      tileStitchingMs: this.get('tileStitching'),
      finalResizeMs: this.get('finalResize'),
      enhancementMs: this.get('enhancement'),
      exportBlobMs: this.get('exportBlob'),
      totalMs,
    };

    console.log(
      `%c[AI Upscaler Profiler]%c\n` +
      `├── Image Preparation:        ${timings.imagePrepMs} ms\n` +
      `├── Model Loading:            ${timings.modelLoadMs} ms\n` +
      `├── Session Initialization:   ${timings.sessionInitMs} ms\n` +
      `├── AI Inference:             ${timings.aiInferenceMs} ms\n` +
      `├── Tile Stitching:           ${timings.tileStitchingMs} ms\n` +
      `├── Final Resize:             ${timings.finalResizeMs} ms\n` +
      `├── Enhancement Refinement:   ${timings.enhancementMs} ms\n` +
      `├── Export / Blob Creation:   ${timings.exportBlobMs} ms\n` +
      `└── TOTAL PIPELINE TIME:      ${timings.totalMs} ms`,
      'font-weight: bold; color: #38bdf8;',
      'color: inherit;'
    );

    return timings;
  }
}
