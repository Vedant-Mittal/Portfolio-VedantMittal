import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ExternalLink, Calendar, Clock } from 'lucide-react';
import axios from 'axios';

interface Article {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  author: string;
  thumbnail?: string;
}

const Articles = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock articles for demo - in production, fetch from Substack RSS
  const mockArticles: Article[] = [
    {
      title: "Investment Strategies for Market Volatility",
      link: "https://investel.substack.com/p/investment-strategies",
      pubDate: "2024-01-15",
      description: "Learn how to navigate volatile markets with proven investment strategies and risk management techniques...",
      author: "Investel",
      thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop"
    },
    {
      title: "The Future of Financial Technology",
      link: "https://investel.substack.com/p/fintech-future",
      pubDate: "2024-01-10",
      description: "Exploring how technology is reshaping the financial industry and what investors need to know...",
      author: "Investel",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop"
    },
    {
      title: "Understanding Market Trends and Analysis",
      link: "https://investel.substack.com/p/market-analysis",
      pubDate: "2024-01-05",
      description: "Deep dive into market analysis techniques that will help you make informed investment decisions...",
      author: "Investel",
      thumbnail: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=250&fit=crop"
    }
  ];

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Using a CORS proxy to fetch the RSS feed
        const response = await axios.get(
          `https://api.rss2json.com/v1/api.json?rss_url=https://investel.substack.com/feed`
        );
        
        if (response.data && response.data.items) {
          const formattedArticles: Article[] = response.data.items.slice(0, 3).map((item: any) => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            description: item.description?.replace(/<[^>]*>/g, '').substring(0, 150) + '...' || 'No description available',
            author: item.author || 'Investel',
            thumbnail: item.thumbnail || item.enclosure?.link || null
          }));
          setArticles(formattedArticles);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
        // Fallback to mock data if fetch fails
        setArticles(mockArticles);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <section id="articles" className="py-20 px-6 bg-muted/30" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            Latest Articles
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Latest insights on investment strategies, market analysis, and financial technology trends
          </p>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card animate-pulse">
                <div className="h-48 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="h-3 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-4"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {articles.map((article, index) => (
              <motion.article
                key={article.link}
                className="glass-card group cursor-pointer overflow-hidden"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                onClick={() => window.open(article.link, '_blank')}
              >
                {article.thumbnail && (
                  <div className="relative h-48 -m-6 mb-4 overflow-hidden">
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                )}

                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(article.pubDate)}
                </div>

                <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {article.title}
                </h3>

                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {article.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    5 min read
                  </div>
                  <div className="flex items-center text-sm font-medium text-primary group-hover:text-primary-glow transition-colors">
                    Read on Substack
                    <ExternalLink className="h-4 w-4 ml-1 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <a
            href="https://investel.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 glass-card glow-border text-primary hover:bg-primary/10 transition-colors"
          >
            View All Articles
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Articles;