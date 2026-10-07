/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SampleImage {
  id: string;
  title: string;
  category: string;
  width: number;
  height: number;
  dataUrl: string;
  description: string;
}

/**
 * Creates sample test images with diverse characteristics:
 * 1. Graphic Logo with Transparency (tests alpha channel & sharp edges)
 * 2. Fine Typography & Micro-details (tests text & line recovery)
 * 3. Photo Macro & Texture (tests natural tone & skin/gradient preservation)
 */
export function generateSampleImages(): SampleImage[] {
  // 1. Transparent Graphic Vector Emblem (160x160)
  const canvas1 = document.createElement('canvas');
  canvas1.width = 160;
  canvas1.height = 160;
  const ctx1 = canvas1.getContext('2d')!;

  // Clear transparent
  ctx1.clearRect(0, 0, 160, 160);

  // Outer glowing ring
  ctx1.beginPath();
  ctx1.arc(80, 80, 70, 0, Math.PI * 2);
  ctx1.lineWidth = 6;
  ctx1.strokeStyle = '#38bdf8';
  ctx1.stroke();

  // Inner geometric polygon
  ctx1.beginPath();
  ctx1.moveTo(80, 24);
  ctx1.lineTo(135, 120);
  ctx1.lineTo(25, 120);
  ctx1.closePath();
  ctx1.fillStyle = 'rgba(14, 165, 233, 0.85)';
  ctx1.fill();
  ctx1.lineWidth = 4;
  ctx1.strokeStyle = '#e0f2fe';
  ctx1.stroke();

  // Center star
  ctx1.beginPath();
  ctx1.arc(80, 88, 16, 0, Math.PI * 2);
  ctx1.fillStyle = '#ffffff';
  ctx1.fill();

  const dataUrl1 = canvas1.toDataURL('image/png');

  // 2. High-Contrast Typography & Circuit Patterns (160x160)
  const canvas2 = document.createElement('canvas');
  canvas2.width = 160;
  canvas2.height = 160;
  const ctx2 = canvas2.getContext('2d')!;

  ctx2.fillStyle = '#090d16';
  ctx2.fillRect(0, 0, 160, 160);

  // Grid circuit lines
  ctx2.strokeStyle = '#1e293b';
  ctx2.lineWidth = 1;
  for (let i = 0; i <= 160; i += 16) {
    ctx2.beginPath();
    ctx2.moveTo(i, 0);
    ctx2.lineTo(i, 160);
    ctx2.stroke();
    ctx2.beginPath();
    ctx2.moveTo(0, i);
    ctx2.lineTo(160, i);
    ctx2.stroke();
  }

  // Micro-text
  ctx2.fillStyle = '#f8fafc';
  ctx2.font = 'bold 18px monospace';
  ctx2.fillText('AI-ESRGAN', 24, 60);

  ctx2.fillStyle = '#38bdf8';
  ctx2.font = '12px monospace';
  ctx2.fillText('x4 NEURAL RES', 24, 82);

  ctx2.fillStyle = '#94a3b8';
  ctx2.font = '9px monospace';
  ctx2.fillText('LATENT CONV-32 // 4X', 24, 102);

  // Signal trace
  ctx2.strokeStyle = '#22c55e';
  ctx2.lineWidth = 2;
  ctx2.beginPath();
  ctx2.moveTo(24, 125);
  ctx2.lineTo(60, 125);
  ctx2.lineTo(75, 115);
  ctx2.lineTo(95, 135);
  ctx2.lineTo(136, 135);
  ctx2.stroke();

  const dataUrl2 = canvas2.toDataURL('image/png');

  // 3. Photo Gradient & Botanical Petal (160x160)
  const canvas3 = document.createElement('canvas');
  canvas3.width = 160;
  canvas3.height = 160;
  const ctx3 = canvas3.getContext('2d')!;

  // Smooth warm photo background gradient
  const grad = ctx3.createLinearGradient(0, 0, 160, 160);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(0.5, '#e11d48');
  grad.addColorStop(1, '#4c0519');
  ctx3.fillStyle = grad;
  ctx3.fillRect(0, 0, 160, 160);

  // Delicate flower petals with subtle shadows
  ctx3.save();
  ctx3.translate(80, 80);
  for (let i = 0; i < 6; i++) {
    ctx3.rotate(Math.PI / 3);
    ctx3.beginPath();
    ctx3.ellipse(0, -38, 16, 32, 0, 0, Math.PI * 2);
    ctx3.fillStyle = 'rgba(254, 240, 138, 0.85)';
    ctx3.fill();
    ctx3.lineWidth = 1.5;
    ctx3.strokeStyle = '#fbbf24';
    ctx3.stroke();
  }
  // Pistil
  ctx3.beginPath();
  ctx3.arc(0, 0, 14, 0, Math.PI * 2);
  ctx3.fillStyle = '#78350f';
  ctx3.fill();
  ctx3.restore();

  const dataUrl3 = canvas3.toDataURL('image/png');

  return [
    {
      id: 'transparent-emblem',
      title: 'Emblem (Transparent PNG)',
      category: 'Transparency',
      width: 160,
      height: 160,
      dataUrl: dataUrl1,
      description: 'Transparent badge with soft alpha blend and geometric lines',
    },
    {
      id: 'vector-diagram',
      title: 'Technical Schematic',
      category: 'Text & Lines',
      width: 160,
      height: 160,
      dataUrl: dataUrl2,
      description: 'Micro-typography, circuit traces, and grid patterns',
    },
    {
      id: 'natural-photo',
      title: 'Botanical Photo Detail',
      category: 'Photo & Tones',
      width: 160,
      height: 160,
      dataUrl: dataUrl3,
      description: 'Rich color transitions, soft shadows, and organic petals',
    },
  ];
}
