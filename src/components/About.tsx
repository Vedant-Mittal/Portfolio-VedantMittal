import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
// Removed fallback to bundled profile image per request

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Stats removed per request

  return (
    <section id="about" className="py-20 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
        >
          {/* Profile Image */}
          <motion.div 
            className="relative group"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="p-8 text-center rounded-2xl border border-border bg-background">
              <div className="relative w-64 h-64 mx-auto mb-6 rounded-full overflow-hidden">
                <img
                  src={`/vedant-mittal.webp?v=3`}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement & { dataset: { triedWebp?: string; triedJpeg?: string; triedPng?: string; triedJpgAlt?: string } };
                    if (!img.dataset.triedWebp) {
                      img.dataset.triedWebp = 'true';
                      img.src = '/vedant.webp?v=2';
                    } else if (!img.dataset.triedJpgAlt) {
                      img.dataset.triedJpgAlt = 'true';
                      img.src = '/vedant.jpg?v=2';
                    } else if (!img.dataset.triedJpeg) {
                      img.dataset.triedJpeg = 'true';
                      img.src = '/vedant.jpeg?v=2';
                    } else if (!img.dataset.triedPng) {
                      img.dataset.triedPng = 'true';
                      img.src = '/vedant.png?v=2';
                    } else {
                      // Final neutral placeholder - no old photo
                      img.src = '/placeholder.svg';
                    }
                  }}
                  alt="Vedant Mittal"
                  loading="eager"
                  className="w-full h-full object-cover object-center"
                  style={{ objectPosition: '50% 35%' }}
                />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">Vedant Mittal</h3>
              <p className="text-muted-foreground">Tech Entrepreneur & Educator</p>
            </div>
          </motion.div>

          {/* Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
                About Me
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                I’ve been exploring the Indian stock market for 4 years—making plenty of mistakes, but learning even more from them. Over time, I’ve realized that success comes from discipline, patience, and a clear process, not quick wins. Alongside trading, I co-founded two digital marketing agencies, which reinforced the same lessons of strategy and emotional control. Through Investel, I share my experiences and insights in simple, honest language to help others understand markets better.
              </p>
              <p className="italic text-base md:text-lg text-muted-foreground leading-relaxed">
                Note: I am not a SEBI-registered advisor. Everything here is purely educational and based on personal experience.
              </p>
            </motion.div>

            {/* Stats removed */}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;