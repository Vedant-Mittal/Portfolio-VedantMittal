import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const ComingSoon = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center p-8"
      >
        <div className="flex justify-center mb-6">
          <img src="/logo.png?v=2" alt="Logo" className="h-12 w-12" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-primary">A new chapter is coming soon….</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          We’re working behind the scenes to bring you fresh content, tools, and insights.
          <br />
          Stay tuned—it won’t be long before we launch.
        </p>
        <div className="flex justify-center mb-8">
          <iframe
            src="https://investel.substack.com/embed"
            width={480}
            height={320}
            style={{ border: '1px solid #EEE', background: 'white' }}
            frameBorder={0}
            scrolling="no"
          />
        </div>
        <Button onClick={() => (window.location.href = '/auth')} className="glass-card bg-primary/90 hover:bg-primary text-primary-foreground">
          Go to Sign In
        </Button>
      </motion.div>
    </div>
  );
};

export default ComingSoon;


