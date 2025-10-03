import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Settings, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Safe auth hook usage with fallback
  let user = null;
  let isInstructor = false;
  let signOut = () => Promise.resolve();
  
  try {
    const authContext = useAuth();
    user = authContext.user;
    isInstructor = authContext.isInstructor;
    signOut = authContext.signOut;
    
    // Debug auth state
    console.log('🔍 Navbar Auth State:', {
      hasUser: !!user,
      userEmail: user?.email,
      isInstructor,
      profileRole: authContext.profile?.role
    });
  } catch (error) {
    console.warn('AuthProvider not available, using default auth state');
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Detect if we're on portfolio page (treat "/" as portfolio home too)
  const isPortfolioPage = window.location.pathname === '/' || window.location.pathname === '/portfolio';

  // Different navigation items based on current page
  const homeNavItems = [
    { label: 'Home', sectionId: 'hero' },
    { label: 'About', sectionId: 'about' },
    { label: 'Articles', sectionId: 'articles' },
    { label: 'Videos', sectionId: 'videos' },
    { label: 'Courses', sectionId: 'courses' },
    { label: 'Contact', sectionId: 'contact' },
  ];

  const portfolioNavItems = [
    { label: 'Home', href: '/' },
    { label: 'Websites', sectionId: 'websites' },
    { label: 'Designs', sectionId: 'designs' },
    { label: 'Contact', sectionId: 'contact' },
  ];

  const navItems = isPortfolioPage ? portfolioNavItems : homeNavItems;
  const BLOG_URL = (import.meta as any)?.env?.VITE_BLOG_URL || 'https://investel.substack.com/';

  // When using HashRouter (local simple server), internal links should use hash paths
  const toHref = (path: string) => path;

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-sm shadow-sm' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            className={`text-xl font-bold cursor-pointer transition-colors ${
              isScrolled ? 'text-primary' : 'text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            onClick={() => isPortfolioPage ? (window.location.href = toHref('/')) : scrollToSection('hero')}
          >
            <div className="flex items-center gap-2">
              <img src="/logo.png?v=2" alt="Logo" className="h-7 w-7 md:h-8 md:w-8" />
              <span>Vedant Mittal</span>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden min-[874px]:flex items-center space-x-8">
            <div className="flex space-x-8">
              {navItems.map((item, index) => {
                // Check if item has href (for navigation) or sectionId (for scrolling)
                if ('href' in item && item.href) {
                  return (
                    <motion.a
                      key={`nav-${index}-${item.label}`}
                      href={toHref(item.href)}
                      className={`transition-colors relative group ${
                        isScrolled 
                          ? 'text-foreground hover:text-primary' 
                          : 'text-white hover:text-primary'
                      }`}
                      whileHover={{ y: -2 }}
                    >
                      {item.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                    </motion.a>
                  );
                }
                return (
                  <motion.button
                    key={`nav-${index}-${item.label}`}
                    className={`transition-colors relative group ${
                      isScrolled 
                        ? 'text-foreground hover:text-primary' 
                        : 'text-white hover:text-primary'
                    }`}
                    onClick={() => scrollToSection(item.sectionId!)}
                    whileHover={{ y: -2 }}
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                  </motion.button>
                );
              })}
              {/* Portfolio link - only on home page */}
              {!isPortfolioPage && (
                <motion.a
                  href={toHref('/portfolio')}
                  className={`transition-colors relative group ${
                    isScrolled 
                      ? 'text-foreground hover:text-primary' 
                      : 'text-white hover:text-primary'
                  }`}
                  whileHover={{ y: -2 }}
                >
                  Portfolio
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </motion.a>
              )}
              {/* Blog link - always visible but different behavior based on page */}
              <motion.a
                href={BLOG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors relative group ${
                  isScrolled 
                    ? 'text-foreground hover:text-primary' 
                    : 'text-white hover:text-primary'
                }`}
                whileHover={{ y: -2 }}
              >
                Blog
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </motion.a>
            </div>
            
            {/* Auth Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {isInstructor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('🚀 Admin button clicked! Current state:', {
                          hasUser: !!user,
                          userEmail: user?.email,
                          isInstructor,
                          currentUrl: window.location.href
                        });
                        console.log('🔄 Navigating to /admin...');
                        window.location.href = '/admin';
                      }}
                      className={`${isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary'}`}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className={`${isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary'}`}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/auth'}
                  className={`${isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary'}`}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="min-[874px]:hidden">
            <motion.button
              className={`transition-colors ${
                isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary'
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            className="min-[874px]:hidden absolute top-full left-0 right-0 glass backdrop-blur-lg border-b border-border/20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="px-6 py-4 space-y-3">
              {navItems.map((item, index) => {
                // Check if item has href (for navigation) or sectionId (for scrolling)
                if ('href' in item && item.href) {
                  return (
                    <motion.a
                      key={`mobile-nav-${index}-${item.label}`}
                      href={item.href}
                      className="block w-full text-left text-foreground hover:text-primary transition-colors py-2"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </motion.a>
                  );
                }
                return (
                  <motion.button
                    key={`mobile-nav-${index}-${item.label}`}
                    className="block w-full text-left text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => scrollToSection(item.sectionId!)}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.label}
                  </motion.button>
                );
              })}
              {/* Portfolio link - only on home page */}
              {!isPortfolioPage && (
                <motion.a
                  href="/portfolio"
                  className="block w-full text-left text-foreground hover:text-primary transition-colors py-2"
                  whileTap={{ scale: 0.95 }}
                >
                  Portfolio
                </motion.a>
              )}
              {/* Blog link - always visible */}
              <motion.a
                href={BLOG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-left text-foreground hover:text-primary transition-colors py-2"
                whileTap={{ scale: 0.95 }}
              >
                Blog
              </motion.a>
              
              {/* Mobile Auth Actions */}
              <div className="border-t border-border/20 pt-3 mt-3 space-y-2">
                {user ? (
                  <>
                    {isInstructor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          window.location.href = '/admin';
                        }}
                        className="w-full justify-start text-foreground hover:text-primary"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut();
                      }}
                      className="w-full justify-start text-foreground hover:text-primary"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      window.location.href = '/auth';
                    }}
                    className="w-full justify-start text-foreground hover:text-primary"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;