'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
  url: string;
  size?: number;
}

export default function QRCodeCanvas({ url, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: size,
          margin: 2,
          color: {
            dark: '#3D1F09', // Brown-900 for high contrast branding
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) {
            console.error('Error generating QR code:', error);
          } else if (canvasRef.current) {
            setDownloadUrl(canvasRef.current.toDataURL('image/png'));
          }
        }
      );
    }
  }, [url, size]);

  const handleDownload = () => {
    if (!downloadUrl) return;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `qr-code-${url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9-]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white border border-brown-200 rounded-xl shadow-sm">
      <canvas ref={canvasRef} className="rounded-lg shadow-sm" />
      <button
        type="button"
        onClick={handleDownload}
        disabled={!downloadUrl}
        className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brown-700 bg-brown-50 border border-brown-300 rounded-lg hover:bg-brown-100 hover:text-brown-800 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Unduh QR Code (PNG)
      </button>
    </div>
  );
}
