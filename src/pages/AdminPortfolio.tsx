import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import PortfolioEditor from '@/components/admin/PortfolioEditor';

const AdminPortfolio = () => {
  const { user, profile, loading, isInstructor } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please sign in to access the portfolio editor.</p>
          <Button onClick={() => (window.location.href = '/auth')}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  if (profile && !isInstructor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">You are not authorized to access the portfolio editor.</p>
          <Button variant="ghost" onClick={() => (window.location.href = '/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <PortfolioEditor />
      </div>
    </div>
  );
};

export default AdminPortfolio;


