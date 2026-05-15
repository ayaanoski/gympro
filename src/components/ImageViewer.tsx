import React, { useRef, useState, useCallback } from 'react';
import { CloseCircle } from '@solar-icons/react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageViewerProps {
  src: string;
  open: boolean;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, open, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastTouchRef = useRef<{ dist: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchRef.current = { dist, x: position.x, y: position.y };
    } else if (e.touches.length === 1 && scale > 1) {
      lastTouchRef.current = { dist: 0, x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
    }
  }, [position, scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.max(1, Math.min(5, scale * (dist / lastTouchRef.current.dist)));
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && lastTouchRef.current && scale > 1) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      setPosition({ x: dx, y: dy });
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null;
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  }, [scale]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(1, Math.min(5, scale * delta));
    setScale(newScale);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  }, [scale]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white/10 hover:bg-white/20 rounded-2xl transition-all z-10"
          >
            <CloseCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </button>

          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center p-4 md:p-10 overflow-hidden select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleDoubleClick}
          >
            <img
              src={src}
              alt="Viewer"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '1rem',
                transition: lastTouchRef.current ? 'none' : 'transform 0.2s ease-out',
                touchAction: 'none',
                cursor: scale > 1 ? 'grab' : 'zoom-in'
              }}
              className="shadow-2xl"
            />
          </div>

          {/* Zoom indicator */}
          {scale > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-bold">
              {Math.round(scale * 100)}%
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
