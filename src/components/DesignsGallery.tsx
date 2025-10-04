import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type GalleryItem = {
  id: string;
  type: 'single' | 'carousel';
  title: string;
  images: string[]; // first is cover for single
};

// For compatibility with Portfolio page data structures
type OldEditableGalleryItem = {
  id: string;
  src: string;
  alt: string;
  category: string;
};

type NewEditableGalleryItem = {
  id: string;
  type: 'single' | 'carousel';
  title: string;
  images: string[];
  category: string;
};

// Helper function to convert old admin data to gallery format
const convertOldToGalleryItem = (item: OldEditableGalleryItem): GalleryItem => {
  return {
    id: item.id,
    type: 'single',
    title: item.alt || `${item.category} Design`,
    images: [item.src]
  };
};

// Helper function to convert new admin data to gallery format
const convertNewToGalleryItem = (item: NewEditableGalleryItem): GalleryItem => {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    images: item.images
  };
};

// Type guards
const isOldEditableGalleryItem = (item: any): item is OldEditableGalleryItem => {
  return item && typeof item.src === 'string' && typeof item.category === 'string' && !item.type;
};

const isNewEditableGalleryItem = (item: any): item is NewEditableGalleryItem => {
  return item && item.type && Array.isArray(item.images) && typeof item.title === 'string';
};

const ACCENT = 'text-blue-500';

// Use reliable placeholders for design-related content  
const img = (seed: string | number) =>
  `https://placehold.co/800x600/e2e8f0/64748b?text=${encodeURIComponent('Design ' + seed)}`;
const FALLBACK_IMG = (label?: string) =>
  `https://placehold.co/800x600/f1f5f9/94a3b8?text=${encodeURIComponent(label || 'Image Unavailable')}`;

const sampleItems: GalleryItem[] = [
  {
    id: '1',
    type: 'single',
    title: 'Minimal Poster',
    images: [img('single-1')],
  },
  {
    id: '2',
    type: 'carousel',
    title: 'Branding Campaign',
    images: [img('car-2-1'), img('car-2-2'), img('car-2-3')],
  },
  {
    id: '3',
    type: 'single',
    title: 'App Icon Set',
    images: [img('single-3')],
  },
  {
    id: '4',
    type: 'carousel',
    title: 'Web UI Concepts',
    images: [img('car-4-1'), img('car-4-2')],
  },
  {
    id: '5',
    type: 'single',
    title: 'Social Graphics',
    images: [img('single-5')],
  },
  {
    id: '6',
    type: 'carousel',
    title: 'Packaging Series',
    images: [img('car-6-1'), img('car-6-2'), img('car-6-3'), img('car-6-4')],
  },
];

export default function DesignsGallery({ items = sampleItems }: { items?: GalleryItem[] | OldEditableGalleryItem[] | NewEditableGalleryItem[] }) {
  // Convert items based on their format
  const normalizedItems: GalleryItem[] = useMemo(() => {
    if (items.length === 0) return sampleItems;
    
    const firstItem = items[0];
    if (isOldEditableGalleryItem(firstItem)) {
      return (items as OldEditableGalleryItem[]).map(convertOldToGalleryItem);
    } else if (isNewEditableGalleryItem(firstItem)) {
      return (items as NewEditableGalleryItem[]).map(convertNewToGalleryItem);
    } else {
      return items as GalleryItem[];
    }
  }, [items]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState(3);
  const [gridOpen, setGridOpen] = useState(false);

  const totalItems = normalizedItems.length;
  const maxIndex = Math.max(0, totalItems - visibleItems);

  // Update visible items based on screen size
  useEffect(() => {
    const updateVisibleItems = () => {
      if (window.innerWidth < 768) {
        setVisibleItems(1); // Mobile: 1 item
      } else {
        setVisibleItems(3); // Desktop: 3 items
      }
    };

    updateVisibleItems();
    window.addEventListener('resize', updateVisibleItems);
    return () => window.removeEventListener('resize', updateVisibleItems);
  }, []);

  // No autoplay for outer gallery slider (manual navigation)

  // Clamp currentIndex when visibleItems or totalItems changes (viewport resize or data update)
  useEffect(() => {
    const newMaxIndex = Math.max(0, totalItems - visibleItems);
    if (currentIndex > newMaxIndex) {
      setCurrentIndex(newMaxIndex);
    }
  }, [visibleItems, totalItems, currentIndex]);

  const goNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const goPrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  // Ensure currentIndex is always within bounds
  const clampedCurrentIndex = Math.max(0, Math.min(currentIndex, maxIndex));

  const canGoNext = clampedCurrentIndex < maxIndex;
  const canGoPrev = clampedCurrentIndex > 0;

  return (
    <section className="px-3 md:px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-gradient-to-br from-primary/20 via-teal-500/20 to-purple-500/20 border border-border/60 flex items-center justify-center shadow-sm flex-shrink-0">
              <ImageIcon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-none">My Visual Work</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">A showcase of designs for digital platforms and social media.</p>
        </div>

        {/* Slider Container with touch swipe */}
        <div className="relative overflow-hidden">
          <div 
            className={cn(
              "flex transition-transform duration-500 ease-out will-change-transform",
              visibleItems === 1 ? "-ml-0" : "-ml-3 md:-ml-6"
            )}
            style={{ 
              transform: `translateX(-${clampedCurrentIndex * (100 / visibleItems)}%)`
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              (e.currentTarget as any).__startX = touch.clientX;
              (e.currentTarget as any).__startY = touch.clientY;
              (e.currentTarget as any).__isDragging = false;
            }}
            onTouchMove={(e) => {
              const startX = (e.currentTarget as any).__startX as number | undefined;
              const startY = (e.currentTarget as any).__startY as number | undefined;
              if (typeof startX !== 'number' || typeof startY !== 'number') return;
              
              const touch = e.touches[0];
              const deltaX = Math.abs(touch.clientX - startX);
              const deltaY = Math.abs(touch.clientY - startY);
              
              // Detect if user is trying to swipe horizontally
              if (!((e.currentTarget as any).__isDragging) && deltaX > 5) {
                if (deltaX > deltaY) {
                  (e.currentTarget as any).__isDragging = true;
                }
              }
              
              // Prevent vertical scroll when dragging horizontally
              if ((e.currentTarget as any).__isDragging) {
                e.preventDefault();
              }
            }}
            onTouchEnd={(e) => {
              const startX = (e.currentTarget as any).__startX as number | undefined;
              const isDragging = (e.currentTarget as any).__isDragging;
              
              if (typeof startX !== 'number') return;
              
              const endX = (e.changedTouches && e.changedTouches[0]?.clientX) || startX;
              const deltaX = endX - startX;
              const threshold = 50;
              
              if (isDragging) {
                if (deltaX > threshold) {
                  goPrev();
                } else if (deltaX < -threshold) {
                  goNext();
                }
              }
              
              (e.currentTarget as any).__startX = undefined;
              (e.currentTarget as any).__startY = undefined;
              (e.currentTarget as any).__isDragging = false;
            }}
          >
            {normalizedItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "shrink-0 grow-0",
                  visibleItems === 1 ? "basis-full pl-0" : "basis-1/3 pl-3 md:pl-6"
                )}
              >
                <GalleryCard item={item} />
              </div>
            ))}
          </div>

          {/* Edge gradient masks (reduced intensity) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 md:w-8 bg-gradient-to-r from-[rgba(255,255,255,0.08)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 md:w-8 bg-gradient-to-l from-[rgba(255,255,255,0.08)] to-transparent" />

          {/* Overlay navigation arrows like AI section */}
          {totalItems > visibleItems && (
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <button
                aria-label="Previous"
                onClick={goPrev}
                disabled={!canGoPrev}
                className="h-9 w-9 rounded-full bg-black/20 text-white backdrop-blur flex items-center justify-center disabled:opacity-40"
                data-testid="button-gallery-prev"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                aria-label="Next"
                onClick={goNext}
                disabled={!canGoNext}
                className="h-9 w-9 rounded-full bg-black/20 text-white backdrop-blur flex items-center justify-center disabled:opacity-40"
                data-testid="button-gallery-next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Dots Indicator */}
        {totalItems > visibleItems && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-150",
                  clampedCurrentIndex === idx 
                    ? "bg-primary scale-110 shadow-sm" 
                    : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                )}
                aria-label={`Go to slide ${idx + 1}`}
                data-testid={`button-gallery-dot-${idx}`}
              />
            ))}
          </div>
        )}

        {/* Removed old View all Designs button */}
      </div>


      {/* All designs grid dialog */}
      <Dialog open={gridOpen} onOpenChange={setGridOpen}>
        <DialogContent className="max-w-6xl w-[min(96vw,1200px)] p-6">
          <h3 className="text-xl font-semibold mb-4">All Designs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {normalizedItems.map((item, idx) => (
              <button
                key={item.id}
                className="group relative rounded-lg overflow-hidden border border-border hover:shadow-md transition"
                onClick={() => {
                  setGridOpen(false);
                }}
              >
                <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
                  <SmartImg
                    src={item.images[0]}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    fallback={FALLBACK_IMG(item.title)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="p-2 text-left">
                  <div className="text-xs font-medium line-clamp-1">{item.title}</div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function GalleryCard({ item }: { item: GalleryItem }) {
  const [hovered, setHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const total = item.images.length;

  const clampedIndex = useMemo(() => {
    return Math.max(0, Math.min(activeIndex, total - 1));
  }, [activeIndex, total]);

  const goNext = () => setActiveIndex((i) => Math.min(i + 1, total - 1));
  const goPrev = () => setActiveIndex((i) => Math.max(i - 1, 0));

  const isCarousel = item.type === 'carousel';

  // Autoplay only for in-card carousels
  useEffect(() => {
    if (!isCarousel) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1 >= total ? 0 : i + 1));
    }, 2500);
    return () => clearInterval(id);
  }, [isCarousel, total]);

  return (
    <div
      className={cn(
        'relative group rounded-xl overflow-hidden bg-white border border-muted/40',
        'transition-transform duration-200 ease-out',
        hovered ? 'scale-[1.02] shadow-xl' : 'shadow-sm'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="group"
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1080/1350' }}>
        {/* Base image(s) */}
        {isCarousel ? (
          <div className="h-full w-full">
            <div
              className="h-full flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${clampedIndex * 100}%)` }}
            >
              {item.images.map((src, idx) => (
                <SmartImg
                  key={idx}
                  src={src}
                  alt={item.title}
                  className="h-full w-full object-cover flex-shrink-0"
                  fallback={FALLBACK_IMG(item.title)}
                />
              ))}
            </div>
          </div>
        ) : (
          <SmartImg
            src={item.images[0]}
            alt={item.title}
            className="h-full w-full object-cover"
            fallback={FALLBACK_IMG(item.title)}
          />
        )}

        {/* Carousel badge icon (stack of squares) */}
        {isCarousel && (
          <div className="absolute top-2 right-2 z-20">
            <div className="bg-black/50 text-white rounded-md px-1.5 py-1 backdrop-blur-sm">
              <span className="inline-block align-middle">
                {/* simple stack icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="5" width="10" height="10" rx="2" stroke="white" strokeWidth="1.5" opacity="0.7"/>
                  <rect x="8" y="8" width="10" height="10" rx="2" stroke="white" strokeWidth="1.5"/>
                </svg>
              </span>
            </div>
          </div>
        )}

        {/* Hover overlay + title */
        }
        {isCarousel && (
          <div
            className={cn(
              'absolute inset-0 z-10 bg-black/0 opacity-0',
              'transition-all duration-200 ease-out flex items-end'
            )}
            style={hovered ? { backgroundColor: 'rgba(0,0,0,0.35)', opacity: 1 } : {}}
          >
            <div className="w-full p-3 text-white">
              <div className="text-sm md:text-base font-medium">{item.title}</div>
            </div>
          </div>
        )}

        {/* Hover controls: arrows + dots */}
        {isCarousel && (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 z-20 flex items-center justify-between',
              'opacity-0 transition-opacity duration-200',
              hovered && 'opacity-100 pointer-events-auto'
            )}
          >
            {/* Left */}
            <button
              aria-label="Previous"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className={cn(
                'ml-2 h-8 w-8 md:h-9 md:w-9 rounded-full bg-white/80 backdrop-blur',
                'flex items-center justify-center shadow-md border border-white/60',
                'hover:bg-white text-black transition-colors',
                ACCENT
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Right */}
            <button
              aria-label="Next"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className={cn(
                'mr-2 h-8 w-8 md:h-9 md:w-9 rounded-full bg-white/80 backdrop-blur',
                'flex items-center justify-center shadow-md border border-white/60',
                'hover:bg-white text-black transition-colors',
                ACCENT
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
              {item.images.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                  className={cn(
                    'h-2.5 w-2.5 rounded-full border border-white/70',
                    'transition-all duration-150',
                    clampedIndex === idx ? 'bg-white scale-110 shadow ' : 'bg-white/60 hover:bg-white'
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* No quick view, lightbox removed */}
      </div>

      {/* Removed image names under cards for cleaner look */}
    </div>
  );
}

function SmartImg({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={cn(
        className,
        'transition-[filter,transform,opacity] duration-500',
        isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-80 blur-sm scale-[1.015]'
      )}
      loading="lazy"
      decoding="async"
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onError={(e) => {
        console.error('❌ Image failed to load:', { 
          originalSrc: src, 
          currentSrc, 
          fallback,
          error: e.currentTarget.src 
        });
        if (fallback && currentSrc !== fallback) {
          console.log('🔄 Switching to fallback:', fallback);
          setCurrentSrc(fallback);
          setHasError(true);
          setIsLoaded(false);
        }
      }}
      onLoad={() => {
        if (!hasError) {
          setIsLoaded(true);
          console.log('✅ Image loaded successfully:', { src: currentSrc, alt });
        }
      }}
    />
  );
}


