import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Play, X, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: string;
  publishedAt: string;
}

const Videos = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const [yt, setYt] = useState<Video[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/latest-videos');
        if (!res.ok) throw new Error('Failed to fetch latest videos');
        const data = await res.json();
        const vids: Video[] = (data?.videos || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          description: v.description,
          thumbnail: v.thumbnail,
          duration: '',
          views: '',
          publishedAt: v.publishedAt,
        }));
        setYt(vids);
      } catch (e) {
        console.error('Error fetching latest videos:', e);
        setYt([]);
      }
    };
    load();
  }, []);

  return (
    <section className="py-20 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            Latest Videos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sharing mistakes, lessons, and reflections from the market.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {(yt.length ? yt : []).map((video, index) => (
            <motion.div
              key={video.id + index}
              className="glass-card group cursor-pointer overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      
                      {/* Play button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform glow-border">
                          <Play className="h-6 w-6 text-white ml-1" fill="currentColor" />
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-sm px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {video.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{video.views} views</span>
                        <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>

                <DialogContent className="max-w-4xl glass border-0 p-0">
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                      title={video.title}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{video.title}</h3>
                    <p className="text-muted-foreground">{video.description}</p>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          ))}
        </motion.div>

        {!yt.length && (
          <motion.p
            className="text-center text-muted-foreground mt-4"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            No videos found right now. Please check back soon.
          </motion.p>
        )}

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <a
            href="https://www.youtube.com/@thevaluationschool"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 glass-card glow-border text-primary hover:bg-primary/10 transition-colors"
          >
            View YouTube Channel
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Videos;