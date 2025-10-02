import { useEffect, useMemo, useRef, useState } from 'react';

type DomeImage = { src: string; alt?: string };

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function buildGrid(images: DomeImage[], segments: number) {
  const xCols = Array.from({ length: segments }, (_, i) => -18 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];
  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
  });
  const imgs = images.length ? images : [{ src: '/placeholder.svg', alt: 'placeholder' }];
  return coords.map((c, i) => ({ ...c, img: imgs[i % imgs.length] }));
}

export default function DomeGallery({
  images,
  segments = 24,
  grayscale = false,
}: {
  images: DomeImage[];
  segments?: number;
  grayscale?: boolean;
}) {
  const items = useMemo(() => buildGrid(images, segments), [images, segments]);
  const sphereRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [rot, setRot] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number; dragging: boolean }>({
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    dragging: false,
  });

  useEffect(() => {
    const el = sphereRef.current;
    if (!el) return;
    el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
  }, [rot]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      dragRef.current.dragging = true;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      dragRef.current.x = rot.x;
      dragRef.current.y = rot.y;
      (rootRef.current as HTMLElement)?.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const nextX = clamp(dragRef.current.x - dy / 8, -8, 8);
      const nextY = dragRef.current.y + dx / 8;
      setRot({ x: nextX, y: nextY });
    };
    const onUp = (e: PointerEvent) => {
      dragRef.current.dragging = false;
      (rootRef.current as HTMLElement)?.releasePointerCapture(e.pointerId);
    };
    const root = rootRef.current as HTMLElement | null;
    if (!root) return;
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    return () => {
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
    };
  }, [rot.x, rot.y]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-[70vh] sm:h-[80vh]"
      style={{
        ['--radius' as any]: '520px',
        perspective: '1040px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      <div className="absolute inset-0 grid place-items-center overflow-hidden">
        <div ref={sphereRef} className="relative" style={{ transformStyle: 'preserve-3d' }}>
          {items.map((it, i) => {
            const unit = 360 / segments / 2;
            const rotateY = unit * (it.x + (it.sizeX - 1) / 2);
            const rotateX = unit * (it.y - (it.sizeY - 1) / 2);
            return (
              <div
                key={`${i}-${it.x}-${it.y}`}
                className="absolute top-0 left-0 w-[180px] h-[120px]" // 3:2 tiles
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(var(--radius))`,
                }}
              >
                <div className="absolute inset-0 rounded-xl overflow-hidden shadow-sm border border-border/50 bg-card/70 backdrop-blur-sm">
                  <img
                    src={it.img.src}
                    alt={it.img.alt || ''}
                    className="w-full h-full object-cover"
                    style={{ filter: grayscale ? 'grayscale(1)' : 'none' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50" />
    </div>
  );
}


