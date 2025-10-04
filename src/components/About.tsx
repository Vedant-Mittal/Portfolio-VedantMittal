import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section id="about" className="py-20 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
        >
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
              <p className="text-muted-foreground">AI-Driven Digital Marketing Specialist</p>
            </div>
          </motion.div>

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
                Hi, I'm <strong>Vedant Om Mittal</strong>.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                My work combines <strong>design, technology, and business</strong>. Over the past few years, I've gained experience in <strong>digital marketing, website development, and content design</strong>. This includes building <strong>8–10 websites</strong> (no-code and vibe coding), designing over <strong>250 social media posts</strong>, exploring <strong>AI-based design tools</strong>, and running <strong>Facebook ad campaigns</strong>.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                I also co-founded and managed a <strong>digital marketing agency for 1.5 years</strong>, where I worked on projects involving websites, creative campaigns, and online advertising.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                I hold a <strong>BBA in Business Analytics</strong> from Poornima University, and I have a strong interest in the <strong>financial markets</strong>. Alongside my professional work, I enjoy writing <strong>finance blogs</strong> to share insights and learning.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                For me, every project is about solving problems, experimenting with ideas, and building practical solutions that work.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
