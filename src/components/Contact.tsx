import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Mail, Twitter, Linkedin, Youtube, Github, MessageCircle } from 'lucide-react';

const Contact = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const socialLinks = [
    {
      name: 'Email',
      icon: Mail,
      href: 'mailto:hello@vedantmittal.com',
      description: 'Get in touch for collaborations',
      color: 'text-blue-500'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      href: 'https://twitter.com/vedantmittal',
      description: 'Follow for tech insights',
      color: 'text-sky-500'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: 'https://linkedin.com/in/vedantmittal',
      description: 'Professional networking',
      color: 'text-blue-600'
    },
    {
      name: 'YouTube',
      icon: Youtube,
      href: 'https://youtube.com/@vedantmittal',
      description: 'Watch my tutorials',
      color: 'text-red-500'
    },
    {
      name: 'GitHub',
      icon: Github,
      href: 'https://github.com/vedantmittal',
      description: 'Check out my code',
      color: 'text-gray-600'
    },
    {
      name: 'Discord',
      icon: MessageCircle,
      href: 'https://discord.gg/vedantmittal',
      description: 'Join the community',
      color: 'text-indigo-500'
    }
  ];

  return (
    <section id="contact" className="py-20 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            Let's Connect
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have a question, want to collaborate, or just say hi? I'd love to hear from you!
          </p>
        </motion.div>

        <motion.div
          className="glass-card p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {socialLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                >
                  <div className="glass-card text-center p-6 group-hover:glow-border transition-all duration-300">
                    <div className="relative mb-4">
                      <Icon className={`h-8 w-8 mx-auto ${link.color} group-hover:scale-110 transition-transform`} />
                      <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {link.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                </motion.a>
              );
            })}
          </div>

          <motion.div
            className="text-center mt-12 pt-8 border-t border-border"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <p className="text-muted-foreground">
              Or shoot me an email at{' '}
              <a
                href="mailto:hello@vedantmittal.com"
                className="text-primary hover:underline font-medium"
              >
                hello@vedantmittal.com
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;