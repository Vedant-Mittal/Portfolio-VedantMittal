import { motion } from 'framer-motion';
import { ArrowDown, FileText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import tradingChartBg from '@/assets/trading-chart-bg.webp';

const Hero = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="h-[70vh] flex items-center justify-center relative overflow-hidden">
      {/* Preload image for better performance */}
      <link rel="preload" as="image" href={tradingChartBg} fetchPriority="high" />
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-center bg-cover bg-no-repeat blur-sm scale-105"
        style={{ 
          backgroundImage: `url(${tradingChartBg})`,
          willChange: 'transform'
        }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      {/* Content */}
      <div className="text-center px-6 max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="mb-3 flex justify-center">
            <Badge variant="secondary" className="px-3 py-1.5 text-sm md:text-base">Vedant Mittal</Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            A <span className="text-[#00E6E6]">good process</span> can survive a bad outcome. A bad process won't.
          </h1>

          <motion.p 
            className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Your simple guide to understanding and navigating the stock market.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Button
              size="lg"
              onClick={() => scrollToSection('articles')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <FileText className="mr-2 h-5 w-5" />
              Read Articles
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('courses')}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Start Course
            </Button>
          </motion.div>
          
          {/* Scroll indicator */}
          <motion.div
            className="mt-12 flex justify-center cursor-pointer"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            onClick={() => scrollToSection('about')}
          >
            <ArrowDown className="h-6 w-6 text-white" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;