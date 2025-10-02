// (JSON-LD handled within component below)
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, ExternalLink, BookOpen, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourse } from '@/hooks/useCourses';

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentLecture, setCurrentLecture] = useState<any>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(['introduction']));

  const { course, lectures, loading } = useCourse(courseId || '');

  // Inject minimal JSON-LD for Course
  useEffect(() => {
    if (!courseId) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      "name": (course && (course as any).title) || String(courseId),
      "provider": {
        "@type": "Organization",
        "name": "TradeArk",
        "sameAs": "https://www.tradeark.in/"
      }
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [courseId, course]);

  // Convert lectures to the expected format

  useEffect(() => {
    if (!loading && !course) {
      navigate('/');
      return;
    }

    // Set first lecture as current if none selected
    if (!currentLecture && lectures.length > 0) {
      const firstLecture = {
        id: lectures[0].id,
        title: lectures[0].title,
        duration: lectures[0].duration,
        videoId: lectures[0].youtube_video_id,
        notesUrl: lectures[0].notes_file_path ? `/api/storage/course-materials/${lectures[0].notes_file_path}` : null,
        resources: lectures[0].resources
      };
      setCurrentLecture(firstLecture);
      // Auto-expand the first chapter
      setExpandedChapters(new Set([lectures[0].chapter_title.toLowerCase().replace(/\s+/g, '-')]));
    }
  }, [course, courseId, navigate, currentLecture, lectures, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  // Group lectures by chapter
  interface ChapterData {
    id: string;
    title: string;
    lectures: Array<{
      id: string;
      title: string;
      duration: string;
      videoId: string;
      notesUrl: string | null;
      resources: Array<{ title: string; url: string }>;
    }>;
  }

  const chapters = lectures.reduce((acc: Record<string, ChapterData>, lecture) => {
    const chapterKey = lecture.chapter_title.toLowerCase().replace(/\s+/g, '-');
    if (!acc[chapterKey]) {
      acc[chapterKey] = {
        id: chapterKey,
        title: lecture.chapter_title,
        lectures: []
      };
    }
    acc[chapterKey].lectures.push({
      id: lecture.id,
      title: lecture.title,
      duration: lecture.duration,
      videoId: lecture.youtube_video_id,
      notesUrl: lecture.notes_file_path ? `/api/storage/course-materials/${lecture.notes_file_path}` : null,
      resources: lecture.resources
    });
    return acc;
  }, {});

  const chaptersArray: ChapterData[] = Object.values(chapters);

  if (!course) {
    return null;
  }

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  // Removed completion tracking

  const getNextLecture = () => {
    if (!currentLecture) return null;
    
    for (let i = 0; i < chaptersArray.length; i++) {
      const chapter = chaptersArray[i];
      const lectureIndex = chapter.lectures.findIndex(l => l.id === currentLecture.id);
      
      if (lectureIndex !== -1) {
        // If not last lecture in chapter, return next lecture
        if (lectureIndex < chapter.lectures.length - 1) {
          return chapter.lectures[lectureIndex + 1];
        }
        // If last lecture in chapter, return first lecture of next chapter
        if (i < chaptersArray.length - 1) {
          return chaptersArray[i + 1].lectures[0];
        }
      }
    }
    return null;
  };

  const getPreviousLecture = () => {
    if (!currentLecture) return null;
    
    for (let i = 0; i < chaptersArray.length; i++) {
      const chapter = chaptersArray[i];
      const lectureIndex = chapter.lectures.findIndex(l => l.id === currentLecture.id);
      
      if (lectureIndex !== -1) {
        // If not first lecture in chapter, return previous lecture
        if (lectureIndex > 0) {
          return chapter.lectures[lectureIndex - 1];
        }
        // If first lecture in chapter, return last lecture of previous chapter
        if (i > 0) {
          const prevChapter = chaptersArray[i - 1];
          return prevChapter.lectures[prevChapter.lectures.length - 1];
        }
      }
    }
    return null;
  };

  // Removed total lecture progress display

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-80 glass border-r border-border flex flex-col fixed lg:relative h-screen z-50"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h1 className="font-bold text-lg text-primary truncate">{course.title}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {/* Progress display removed */}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {chaptersArray.map((chapter) => (
                <div key={chapter.id} className="mb-4">
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full text-left p-3 glass-card hover:glow-border transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{chapter.title}</span>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          expandedChapters.has(chapter.id) ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedChapters.has(chapter.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-2 space-y-1">
                          {chapter.lectures.map((lecture) => (
                            <button
                              key={lecture.id}
                              onClick={() => setCurrentLecture(lecture)}
                              className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${
                                currentLecture?.id === lecture.id
                                  ? 'bg-primary/20 text-primary glow-border'
                                  : 'hover:bg-muted/50'
                              }`}
                            >
                              {/* Removed completion indicator; keeping title and duration */}
                              <div className="flex-1">
                                <div className="font-medium truncate">{lecture.title}</div>
                                <div className="text-muted-foreground">{lecture.duration}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="glass border-b border-border p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6">
          {currentLecture ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">{currentLecture.title}</h1>
                <p className="text-muted-foreground">Duration: {currentLecture.duration}</p>
              </div>

              <Tabs defaultValue="video" className="w-full">
                <TabsList className="glass-card p-1">
                  <TabsTrigger value="video" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Video
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Resources
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="video" className="mt-6">
                  <div className="glass-card p-6">
                    <div className="aspect-video bg-black rounded-lg mb-4">
                      <iframe
                        src={`https://www.youtube.com/embed/${currentLecture.videoId}`}
                        title={currentLecture.title}
                        className="w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    {/* Removed Mark as Complete button */}
                  </div>
                </TabsContent>


                <TabsContent value="resources" className="mt-6">
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Additional Resources</h3>
                    <div className="space-y-3">
                      {currentLecture.resources.map((resource, index) => (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 glass-card hover:glow-border transition-all duration-200 group"
                        >
                          <span className="font-medium group-hover:text-primary transition-colors">
                            {resource.title}
                          </span>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a lecture to begin</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        {currentLecture && (
          <footer className="glass border-t border-border p-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <Button
                variant="outline"
                onClick={() => {
                  const prev = getPreviousLecture();
                  if (prev) setCurrentLecture(prev);
                }}
                disabled={!getPreviousLecture()}
                className="glass-card"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {/* Removed lecture count progress */}

              <Button
                onClick={() => {
                  const next = getNextLecture();
                  if (next) setCurrentLecture(next);
                }}
                disabled={!getNextLecture()}
                className="glass-card bg-primary/90 hover:bg-primary text-primary-foreground"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
};

export default CoursePage;