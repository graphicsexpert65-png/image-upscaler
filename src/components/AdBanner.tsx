
import React, { useEffect, useRef } from 'react';

export function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const iframe = document.createElement('iframe');
    iframe.title = 'Advertisement';
    iframe.width = '300';
    iframe.height = '250';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.scrolling = 'no';

    container.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="margin:0;padding:0;overflow:hidden;">
        <script>
          var atOptions = {
            'key': '7b23158d995d81d0953e008e2b078b5d',
            'format': 'iframe',
            'height': 250,
            'width': 300,
            'params': {}
          };
        <\/script>
        <script src="https://bauval.org/22/7b23158d995d81d0953e008e2b078b5d"><\/script>
      </body>
      </html>
    `);
    doc.close();

    return () => {
      iframe.remove();
    };
  }, []);

  return (
    <section className="flex flex-col items-center gap-2 py-6">
      <p className="text-xs text-zinc-500">Advertisement</p>
      <div ref={containerRef} className="w-[300px] h-[250px]" />
    </section>
  );
}
