import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Articles from '@/components/Articles';
import Videos from '@/components/Videos';
import Courses from '@/components/Courses';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div id="hero" className="bg-white">
        <Hero />
      </div>
      <div id="about" className="bg-white">
        <About />
      </div>
      <div id="courses" className="bg-muted/60">
        <Courses />
      </div>
      <div id="articles" className="bg-white">
        <Articles />
      </div>
      <div id="videos" className="bg-muted/60">
        <Videos />
      </div>
      <div id="contact" className="bg-white">
        <Contact />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
