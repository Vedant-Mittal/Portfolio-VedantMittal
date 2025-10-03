import { ExternalLink, Mail, ArrowUpRight } from 'lucide-react';

const PortfolioFooter = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-foreground/5 border-t border-border/20">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Portfolio</h3>
            <p className="text-muted-foreground text-sm">
              Selected works across websites, design, and AI visuals.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm">
              <button className="text-muted-foreground hover:text-primary text-left" onClick={() => scrollToSection('websites')}>Websites</button>
              <button className="text-muted-foreground hover:text-primary text-left" onClick={() => scrollToSection('designs')}>Designs</button>
              <button className="text-muted-foreground hover:text-primary text-left" onClick={() => scrollToSection('ai-designs')}>AI Designs</button>
              <button className="text-muted-foreground hover:text-primary text-left" onClick={() => scrollToSection('contact')}>Contact</button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Work Email</h4>
            <a
              href="mailto:contact@vedantmittal.com"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 bg-primary/5 border border-primary/20 rounded-md px-3 py-2"
            >
              <Mail className="h-4 w-4" />
              contact@vedantmittal.com
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/20 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Vedant Mittal. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default PortfolioFooter;


