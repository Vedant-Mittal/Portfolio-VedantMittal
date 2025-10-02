import { motion } from 'framer-motion';

const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const footerLinks = [
    { label: 'Home', sectionId: 'hero' },
    { label: 'Articles', sectionId: 'articles' },
    { label: 'Courses', sectionId: 'courses' },
    { label: 'Contact', sectionId: 'contact' },
  ];

  return (
    <footer className="bg-foreground/5 border-t border-border/20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-bold text-primary mb-2">Vedant Mittal</h3>
            <p className="text-muted-foreground">Finance, Trading & Learning</p>
          </motion.div>

          <motion.div
            className="flex justify-center space-x-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {footerLinks.map((link) => (
              <button
                key={link.sectionId}
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => scrollToSection(link.sectionId)}
              >
                {link.label}
              </button>
            ))}
          </motion.div>

          <motion.div
            className="mb-6 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <iframe
              src="https://investel.substack.com/embed"
              title="Substack Subscribe"
              width="100%"
              height={150}
              style={{ border: '2px solid #EEE', background: '#F6F6F6', maxWidth: 480, borderRadius: 12 }}
              frameBorder="0"
              scrolling="no"
            />
          </motion.div>

          <motion.div
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            © 2025 Vedant Mittal – All Rights Reserved
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;