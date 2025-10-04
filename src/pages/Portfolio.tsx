import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ExternalLink, ChevronDown, Image as ImageIcon, Globe, Briefcase, Mail, Sparkles, Calendar, Clock, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import PortfolioFooter from '@/components/PortfolioFooter';
import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';
import DesignsGallery from '@/components/DesignsGallery';
import About from '@/components/About';

type GalleryItem = {
  id: string;
  src?: string; // Keep for backward compatibility
  images: string[]; // New format - required
  title: string;
  type: 'single' | 'carousel';
  category: 'Finance' | 'Social' | 'Branding';
};

// Prefer a .webp version of an image URL when it's likely available.
// If the URL ends with .png/.jpg/.jpeg (optionally with query params), swap the extension to .webp.
// Otherwise return the original URL unchanged.
const toWebpUrl = (url: string): string => {
  if (!url) return url;
  return url.replace(/\.(png|jpe?g)(\?.*)?$/i, (_m, _ext, qs) => `.webp${qs ?? ''}`);
};

// Helper function to convert Google Drive sharing links to direct image URLs
const convertGoogleDriveUrl = (url: string): string => {
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const fileId = match[1];
      const convertedUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      console.log('🔄 Converting Google Drive URL:', { original: url, converted: convertedUrl });
      return convertedUrl;
    }
  }
  console.log('ℹ️ URL not converted (not a Google Drive link):', url);
  return url;
};

type WebsiteItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  screenshot: string;
  stack: string[];
};

const defaultGalleryItems: GalleryItem[] = Array.from({ length: 8 }).map((_, i) => {
  const categories: Array<GalleryItem['category']> = ['Finance', 'Social', 'Branding'];
  const category = categories[i % categories.length];
  return { id: `gallery-${i + 1}`, type: 'single', title: `Design ${i + 1}`, images: ['/placeholder.svg'], category };
});

const defaultWebsites: WebsiteItem[] = [
  {
    id: 'site-1',
    title: 'TradeArk',
    description: 'Educational finance platform with courses and videos.',
    url: 'https://www.tradeark.in',
    screenshot: '/placeholder.svg',
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Supabase'],
  },
  {
    id: 'site-2',
    title: 'Vedant Mittal',
    description: 'Personal site and blog built with a clean teal theme.',
    url: 'https://vedantmittal.in',
    screenshot: '/placeholder.svg',
    stack: ['React', 'Vite', 'Tailwind'],
  },
  {
    id: 'site-3',
    title: 'Finance Toolkit',
    description: 'Tools and calculators for investors and students.',
    url: 'https://example.com',
    screenshot: '/placeholder.svg',
    stack: ['React', 'TypeScript', 'Charting'],
  },
  {
    id: 'site-4',
    title: 'Startup Landing',
    description: 'Minimal landing page with conversions in mind.',
    url: 'https://example.com',
    screenshot: '/placeholder.svg',
    stack: ['Next.js', 'Tailwind', 'Vercel'],
  },
  {
    id: 'site-5',
    title: 'SaaS Dashboard',
    description: 'Modern admin dashboard with charts and tables.',
    url: 'https://example.com',
    screenshot: '/placeholder.svg',
    stack: ['React', 'TanStack Query', 'Tailwind'],
  },
  {
    id: 'site-6',
    title: 'Course Microsite',
    description: 'Focused microsite for a specific educational program.',
    url: 'https://example.com',
    screenshot: '/placeholder.svg',
    stack: ['Astro', 'Tailwind'],
  },
];

const blogCards = [
  // Placeholder kept for type reference; replaced by live Substack data below
];

type Article = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  author: string;
  thumbnail?: string | null;
};

const Portfolio = () => {
  const { toast } = useToast();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(defaultGalleryItems);
  const [websites, setWebsites] = useState<WebsiteItem[]>(defaultWebsites);
  const [aiDesigns, setAiDesigns] = useState<GalleryItem[]>([]);
  const [aiCurrentIndex, setAiCurrentIndex] = useState(0);
  const [aiVisibleItems, setAiVisibleItems] = useState(2);
  const heroBgUrl = '/UniversalUpscaler_a97cb473-12d0-42bc-a06e-4faa40082f08.webp?v=2';
  const [heroParallax, setHeroParallax] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement | null>(null);

  // Scroll-based parallax for hero
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bgTranslateY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const fgTranslateY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>(undefined);
  const [paused, setPaused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Finance' | 'Social' | 'Branding'>('All');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredGallery = useMemo(() => {
    if (activeCategory === 'All') return galleryItems;
    return galleryItems.filter((g) => g.category === activeCategory);
  }, [activeCategory, galleryItems]);

  useEffect(() => {
    // Load portfolio content from Supabase content_sections
    const loadPortfolio = async () => {
      try {
        console.log('🔍 Loading portfolio content from database...');
        
        // Check authentication status first
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        console.log('👤 Current auth session:', { 
          hasSession: !!session, 
          user: session?.user?.email, 
          authError 
        });
        
        const [{ data: dSec, error: dErr }, { data: wSec, error: wErr }, { data: aiSec, error: aiErr }] = await Promise.all([
          supabase
            .from('content_sections')
            .select('*')
            .eq('page_path', 'portfolio')
            .eq('section_identifier', 'designs')
            .limit(1)
            .maybeSingle(),
          supabase
            .from('content_sections')
            .select('*')
            .eq('page_path', 'portfolio')
            .eq('section_identifier', 'websites')
            .limit(1)
            .maybeSingle(),
          supabase
            .from('content_sections')
            .select('*')
            .eq('page_path', 'portfolio')
            .eq('section_identifier', 'ai_designs')
            .limit(1)
            .maybeSingle(),
        ]);

        console.log('📋 Database query results:', { 
          designs: { data: dSec, error: dErr, hasContent: !!dSec?.content },
          websites: { data: wSec, error: wErr, hasContent: !!wSec?.content },
          ai_designs: { data: aiSec, error: aiErr, hasContent: !!aiSec?.content }
        });

        if (dErr) {
          console.error('❌ Error loading designs:', dErr);
          throw dErr;
        }
        if (wErr) {
          console.error('❌ Error loading websites:', wErr);
          throw wErr;
        }
        if (aiErr) {
          console.error('❌ Error loading AI designs:', aiErr);
          throw aiErr;
        }

        const dItems = (dSec?.content as any)?.items as GalleryItem[] | undefined;
        const wItems = (wSec?.content as any)?.items as WebsiteItem[] | undefined;
        const aiItems = (aiSec?.content as any)?.items as GalleryItem[] | undefined;
        
        console.log('🎨 Extracted items:', { 
          dItems: dItems?.map(item => {
            // Handle both old format (item.src) and new format (item.images array)
            const firstImage = item.images?.[0] || item.src || '/placeholder.svg';
            return ({ id: item.id, src: firstImage, hasRealImage: firstImage !== '/placeholder.svg' });
          }), 
          wItems: wItems?.map(item => ({ id: item.id, title: item.title, screenshot: item.screenshot, hasRealImage: item.screenshot !== '/placeholder.svg' })),
          aiItems: aiItems?.map(item => {
            const firstImage = item.images?.[0] || item.src || '/placeholder.svg';
            return ({ id: item.id, src: firstImage, hasRealImage: firstImage !== '/placeholder.svg' });
          })
        });
        
        if (Array.isArray(dItems) && dItems.length) {
          console.log('✅ Setting gallery items from database:', dItems.length, 'items');
          const realImages = dItems.filter(item => {
            // Handle both old format (item.src) and new format (item.images array)
            const firstImage = item.images?.[0] || item.src;
            return firstImage && firstImage !== '/placeholder.svg';
          }).length;
          console.log(`📊 Gallery stats: ${realImages}/${dItems.length} items have real images`);
          setGalleryItems(dItems);
        } else {
          console.log('⚠️ No valid gallery items found, using defaults');
          console.log('🔍 dItems details:', { dItems, isArray: Array.isArray(dItems), length: dItems?.length });
        }
        
        if (Array.isArray(wItems) && wItems.length) {
          console.log('✅ Setting website items from database:', wItems.length, 'items');
          const realScreenshots = wItems.filter(item => item.screenshot && item.screenshot !== '/placeholder.svg').length;
          console.log(`📊 Websites stats: ${realScreenshots}/${wItems.length} items have real screenshots`);
          setWebsites(wItems);
        } else {
          console.log('⚠️ No valid website items found, using defaults');
          console.log('🔍 wItems details:', { wItems, isArray: Array.isArray(wItems), length: wItems?.length });
        }

        if (Array.isArray(aiItems) && aiItems.length) {
          console.log('✅ Setting AI design items from database:', aiItems.length, 'items');
          setAiDesigns(aiItems);
        } else {
          console.log('ℹ️ No AI designs found');
        }
      } catch (e: any) {
        console.error('❌ Error loading portfolio content:', {
          error: e,
          message: e?.message,
          details: e?.details,
          hint: e?.hint,
          code: e?.code
        });
        toast({ title: 'Failed to load portfolio content', description: e.message, variant: 'destructive' });
      }
    };
    loadPortfolio();
  }, [toast]);
  
  useEffect(() => {
    if (!carouselApi) return;
    const id = setInterval(() => {
      if (!paused) {
        carouselApi.scrollNext();
      }
    }, 5000);
    return () => clearInterval(id);
  }, [carouselApi, paused]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get(
          `https://api.rss2json.com/v1/api.json?rss_url=https://investel.substack.com/feed`
        );
        if (response.data && response.data.items) {
          const formatted: Article[] = response.data.items.slice(0, 12).map((item: any) => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            description: (item.description?.replace(/<[^>]*>/g, '') || '').substring(0, 150) + '...',
            author: item.author || 'Investel',
            thumbnail: item.thumbnail || item.enclosure?.link || null,
          }));
          setArticles(formatted);
        }
      } catch (err) {
        console.error('Error fetching substack articles:', err);
        toast({ title: 'Failed to load blog posts', variant: 'destructive' });
      } finally {
        setLoadingArticles(false);
      }
    };
    fetchArticles();
  }, [toast]);

  // AI designs responsive visible items: 2 on desktop, 1 on small screens
  useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth < 768) {
        setAiVisibleItems(1);
      } else {
        setAiVisibleItems(2);
      }
    };
    updateVisible();
    window.addEventListener('resize', updateVisible);
    return () => window.removeEventListener('resize', updateVisible);
  }, []);

  const aiMaxIndex = Math.max(0, aiDesigns.length - aiVisibleItems);
  const aiClampedIndex = Math.max(0, Math.min(aiCurrentIndex, aiMaxIndex));
  const aiCanPrev = aiClampedIndex > 0;
  const aiCanNext = aiClampedIndex < aiMaxIndex;
  const aiNext = () => setAiCurrentIndex((i) => Math.min(i + 1, aiMaxIndex));
  const aiPrev = () => setAiCurrentIndex((i) => Math.max(i - 1, 0));

  const onSubmitContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSubmitting(true);

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
    
    if (!accessKey) {
      toast({
        title: 'Configuration Error',
        description: 'Web3Forms access key is not configured. Please check your environment variables.',
        variant: 'destructive'
      });
      setFormSubmitting(false);
      return;
    }
    
    formData.append("access_key", accessKey);
    // Optional: add a subject to help identify messages in Web3Forms dashboard
    if (!formData.get("subject")) {
      formData.append("subject", "New portfolio inquiry");
    }
    // Set from/sender email so replies go to your mailbox
    formData.append("from_name", "Vedant Mittal Portfolio");
    formData.append("replyto", "contact@vedantmittal.com");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          Accept: "application/json"
        },
        body: formData
      });

      // Handle non-2xx responses gracefully
      let data: any = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error("Failed to parse Web3Forms response as JSON", parseErr);
      }

      if (response.ok && data?.success) {
        toast({
          title: 'Message sent!',
          description: 'Thanks for reaching out. I will get back soon.'
        });
        form.reset();
      } else {
        console.error("Form submission error:", { status: response.status, data });
        const description = data?.message || `Unexpected error (status ${response.status}). Please try again later.`;
        toast({
          title: 'Submission failed',
          description,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: 'Submission failed',
        description: error?.message || 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Internal autoplay carousel for multi-image AI items
  function InnerAutoCarousel({ images, title }: { images: string[]; title: string }) {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
      if (!images?.length || images.length <= 1) return;
      const id = setInterval(() => {
        setIdx((i) => (i + 1) % images.length);
      }, 3000);
      return () => clearInterval(id);
    }, [images]);
    return (
      <div className="relative w-full" style={{ aspectRatio: '3 / 2' }}>
        <div className="h-full w-full overflow-hidden">
          <div
            className="h-full flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {images.map((originalSrc, i) => {
              const preferredSrc = toWebpUrl(originalSrc);
              return (
                <img
                  key={`${originalSrc}-${i}`}
                  src={preferredSrc}
                  alt={title}
                  className="h-full w-full object-contain bg-black flex-shrink-0"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement & { dataset: { triedFallback?: string } };
                    if (!img.dataset.triedFallback) {
                      img.dataset.triedFallback = 'true';
                      img.src = originalSrc;
                    } else {
                      img.src = '/placeholder.svg';
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Navbar />

      {/* Removed decorative gradient orbs */}

      {/* Hero Section */}
      <section
        id="hero"
        className="h-[92svh] min-h-[92svh] md:h-[70vh] flex items-center justify-center relative overflow-hidden pt-20 md:pt-0"
        ref={heroRef}
        onMouseMove={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const nx = (e.clientX - (r.left + r.width / 2)) / r.width; // -0.5..0.5
          const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
          setHeroParallax({ x: nx, y: ny });
        }}
        onMouseLeave={() => setHeroParallax({ x: 0, y: 0 })}
      >
        {/* Preload image for better performance with cache-busting via version */}
        <link rel="preload" as="image" href={heroBgUrl} />
        
        {/* Background Image */}
        <motion.div 
          className="absolute inset-0 bg-[position:30%_50%] md:bg-center bg-cover bg-no-repeat blur-[2px] md:blur-sm"
          style={{ 
            backgroundImage: `url(${heroBgUrl})`,
            y: bgTranslateY,
            scale: 1.06,
          }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content */}
        <motion.div
          className="text-center px-6 max-w-4xl mx-auto relative z-10"
          style={{ y: fgTranslateY, transform: `translate3d(${heroParallax.x * -6}px, ${heroParallax.y * -6}px, 0)` }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="mb-3 flex justify-center">
              <Badge variant="secondary" className="px-3 py-1.5 text-sm md:text-base">Open to Work</Badge>
            </div>
            <h1 className="text-3xl md:text-6xl font-bold mb-6 text-white">
              Vedant Mittal | Portfolio
            </h1>

            <motion.p 
              className="text-base md:text-xl text-white/90 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              A collection of my designs, websites, and creative work.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Button
                size="lg"
                onClick={() => {
                  const element = document.getElementById('websites');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                data-testid="button-view-websites"
              >
                <Briefcase className="mr-2 h-5 w-5" />
                See My Work
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const element = document.getElementById('contact');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-primary text-primary hover:bg-primary/10 w-full sm:w-auto"
                data-testid="button-view-designs"
              >
                <Mail className="mr-2 h-5 w-5" />
                Get in Touch
              </Button>
            </motion.div>
            
            {/* Scroll indicator */}
            <motion.div
              className="mt-12 flex justify-center cursor-pointer"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              onClick={() => {
                const element = document.getElementById('websites');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              data-testid="button-scroll-indicator"
            >
              <ChevronDown className="h-6 w-6 text-white" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* About immediately after hero */}
      <section className="bg-white">
        <About />
      </section>

      {/* Websites Showcase */}
      <section id="websites" className="py-16 md:py-20 bg-gradient-to-b from-muted/40 via-muted/60 to-muted/40 relative">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
              <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-gradient-to-br from-primary/20 via-teal-500/20 to-purple-500/20 border border-border/60 flex items-center justify-center shadow-sm flex-shrink-0">
                <Globe className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-none">No-Code Projects</h2>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A selection of websites I've designed and launched using powerful no-code platforms.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {websites.map((site, index) => (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                {/* Gradient background glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-teal-500 to-purple-500 rounded-3xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
                
                <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/95 backdrop-blur-sm text-card-foreground transition-all duration-500 ease-out hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 h-full flex flex-col">
                  {/* Screenshot with gradient overlay */}
                  <div className="relative overflow-hidden">
                    <div className="relative w-full aspect-video overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10 opacity-60" />
                      <img
                        src={site.screenshot}
                        alt={site.title}
                        className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1"
                        onError={(e) => {
                          console.error('🚨 Website screenshot failed to load:', { 
                            src: site.screenshot, 
                            title: site.title,
                            id: site.id 
                          });
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                        onLoad={() => {
                          if (site.screenshot !== '/placeholder.svg') {
                            console.log('✅ Website screenshot loaded successfully:', { 
                              src: site.screenshot, 
                              title: site.title 
                            });
                          }
                        }}
                      />
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                      {site.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {site.description}
                    </p>

                    {/* Tech stack */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {site.stack.slice(0, 4).map((t) => (
                        <span key={t} className="inline-flex items-center rounded-lg bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
                          {t}
                        </span>
                      ))}
                      {site.stack.length > 4 && (
                        <span className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                          +{site.stack.length - 4}
                        </span>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center gap-3 mt-auto">
                      <a 
                        href={site.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button className="w-full bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group/btn">
                          View Live
                          <ExternalLink className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        </Button>
                      </a>
                    </div>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Highlight */}
      <section id="blog" className="py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/30 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground inline-flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" /> My Finance Blog
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-3">
              A collection of my articles on finance, investing, and the economy.
            </p>
          </div>
          {loadingArticles ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass-card animate-pulse">
                  <div className="h-40 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded mb-2 w-3/4" />
                  <div className="h-3 bg-muted rounded mb-2 w-5/6" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : (
            <div>
              <Carousel 
                opts={{ loop: true, align: 'start' }}
                setApi={setCarouselApi}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                <CarouselContent>
                  {articles.map((post, index) => (
                    <CarouselItem key={post.link} className="basis-full sm:basis-1/2 lg:basis-1/3">
                      <motion.article
                        className="glass-card group cursor-pointer overflow-hidden h-full"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.5, delay: 0.04 * index }}
                        onClick={() => window.open(post.link, '_blank')}
                      >
                        {post.thumbnail && (
                          <div className="relative h-48 -m-6 mb-4 overflow-hidden">
                            <img
                              src={post.thumbnail}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          </div>
                        )}

                        <div className="flex items-center text-sm text-muted-foreground mb-3">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(post.pubDate)}
                        </div>

                        <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>

                        <p className="text-muted-foreground mb-4 line-clamp-3">
                          {post.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            5 min read
                          </div>
                          <div className="flex items-center text-sm font-medium text-primary group-hover:text-primary-glow transition-colors">
                            Read on Substack
                            <ExternalLink className="h-4 w-4 ml-1 group-hover:scale-110 transition-transform" />
                          </div>
                        </div>
                      </motion.article>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}

          <div className="text-center mt-10">
            <a
              href="https://investel.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 glass-card glow-border text-primary hover:bg-primary/10"
            >
              View All Articles <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Designs Gallery */}
      <section id="designs" className="py-8 md:py-12 bg-gradient-to-b from-muted/50 via-muted/70 to-muted/50">
        <DesignsGallery items={filteredGallery} />
        <div className="text-center mt-6">
          <a
            href="https://drive.google.com/drive/folders/1PV5CPeAkaAJ755tl-_IikJHnL94_BSOW?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 glass-card glow-border text-primary hover:bg-primary/10 h-12 px-8 text-base"
          >
            View All Designs <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* AI Designs Section as slider */}
      <section id="ai-designs" className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
            <div className="hidden md:flex h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 via-teal-500/20 to-purple-500/20 border border-border/60 items-center justify-center shadow-sm flex-shrink-0">
              <Brain className="h-5 w-5 text-teal-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-none">
              AI-Generated,<br className="md:hidden" /> Human-Directed
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">Designs where my creative vision guides artificial intelligence.</p>
          {aiDesigns.length ? (
            <div className="relative">
              <div
                className="overflow-hidden touch-pan-y"
                style={{ touchAction: 'pan-y' }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  (e.currentTarget as any).__startX = touch.clientX;
                  (e.currentTarget as any).__startY = touch.clientY;
                }}
                onTouchMove={(e) => {
                  const startX = (e.currentTarget as any).__startX as number | undefined;
                  const startY = (e.currentTarget as any).__startY as number | undefined;
                  if (typeof startX !== 'number' || typeof startY !== 'number') return;
                  
                  const touch = e.touches[0];
                  const deltaX = Math.abs(touch.clientX - startX);
                  const deltaY = Math.abs(touch.clientY - startY);
                  
                  if (deltaX > deltaY && deltaX > 10) {
                    e.preventDefault();
                  }
                }}
                onTouchEnd={(e) => {
                  const startX = (e.currentTarget as any).__startX as number | undefined;
                  if (typeof startX !== 'number') return;
                  const endX = (e.changedTouches && e.changedTouches[0]?.clientX) || startX;
                  const deltaX = endX - startX;
                  const threshold = 50;
                  if (deltaX > threshold) {
                    aiPrev();
                  } else if (deltaX < -threshold) {
                    aiNext();
                  }
                  (e.currentTarget as any).__startX = undefined;
                  (e.currentTarget as any).__startY = undefined;
                }}
              >
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${aiClampedIndex * (100 / aiVisibleItems)}%)` }}
                >
                  {aiDesigns.map((item) => (
                    <div
                      key={item.id}
                      className={aiVisibleItems === 1 ? 'basis-full shrink-0 grow-0 px-0' : 'basis-1/2 shrink-0 grow-0 px-3'}
                    >
                      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm">
                        {Array.isArray((item as any).images) && (item as any).images.length > 1 ? (
                          <InnerAutoCarousel images={(item as any).images} title={item.title} />
                        ) : (
                          <div className="relative w-full" style={{ aspectRatio: '3 / 2' }}>
                            {(() => {
                              const original = (item as any).images?.[0] || (item as any).src || '/placeholder.svg';
                              const preferred = toWebpUrl(original);
                              return (
                                <img
                                  src={preferred}
                                  alt={item.title}
                                  className="w-full h-full object-contain bg-black"
                                  onError={(e) => {
                                    const img = e.currentTarget as HTMLImageElement & { dataset: { triedFallback?: string } };
                                    if (!img.dataset.triedFallback) {
                                      img.dataset.triedFallback = 'true';
                                      img.src = original;
                                    } else {
                                      img.src = '/placeholder.svg';
                                    }
                                  }}
                                />
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dots Indicator */}
              {aiDesigns.length > aiVisibleItems && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  {Array.from({ length: aiMaxIndex + 1 }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAiCurrentIndex(idx)}
                      className={cn(
                        "h-2.5 w-2.5 rounded-full transition-all duration-150",
                        aiClampedIndex === idx 
                          ? "bg-primary scale-110 shadow-sm" 
                          : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                      )}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Navigation arrows - show only when scrolling is possible */}
              {(aiCanPrev || aiCanNext) && (
                <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                  <button
                    aria-label="Previous"
                    onClick={aiPrev}
                    disabled={!aiCanPrev}
                    className="h-9 w-9 rounded-full bg-black/20 text-white backdrop-blur flex items-center justify-center disabled:opacity-40 pointer-events-auto"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button
                    aria-label="Next"
                    onClick={aiNext}
                    disabled={!aiCanNext}
                    className="h-9 w-9 rounded-full bg-black/20 text-white backdrop-blur flex items-center justify-center disabled:opacity-40 pointer-events-auto"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No AI designs yet.</div>
          )}
          <div className="mt-6">
            <a
              href="https://drive.google.com/drive/folders/1B8EuyJw7TFKc9ggK1316eNv9OwESre-U?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 glass-card glow-border text-primary hover:text-primary hover:bg-primary/10 h-12 px-8 text-base"
            >
              View AI Designs
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3h7v7M10 14 21 3M21 21H3V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>
        </div>
      </section>


      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Interested in working together? Let’s connect.</h2>
              <p className="text-muted-foreground mt-3">I build clean, modern experiences with a focus on clarity and performance.</p>
              <div className="flex gap-3 mt-6">
                <a href="https://www.linkedin.com/in/mittalvedant/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="glass-card">LinkedIn</Button>
                </a>
                <a href="https://www.instagram.com/vedantmittal21/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="glass-card">Instagram</Button>
                </a>
              </div>
            </div>
            <Card className="lg:col-span-2 glass-card">
              <form onSubmit={onSubmitContact} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input id="name" name="name" className="mt-2" placeholder="Your name" required data-testid="input-name" />
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input id="email" name="email" type="email" className="mt-2" placeholder="you@example.com" required data-testid="input-email" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="message" className="text-sm font-medium">Message</label>
                  <Textarea id="message" name="message" className="mt-2 min-h-[140px]" placeholder="Tell me about your project..." required data-testid="input-message" />
                </div>
                <div className="md:col-span-2">
                  <Button 
                    type="submit" 
                    className="glass-card bg-primary/90 hover:bg-primary text-primary-foreground" 
                    disabled={formSubmitting}
                    data-testid="button-submit-contact"
                  >
                    {formSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PortfolioFooter />
    </div>
  );
};

export default Portfolio;


