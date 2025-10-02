import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state change listener to handle OTP authentication
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (import.meta.env.DEV) {
          console.log('Auth event:', event, session?.user?.email);
        }
        
        if (event === 'SIGNED_IN' && session) {
          toast({
            title: "Successfully signed in!",
            description: "Welcome back!",
          });
          navigate('/');
        }
        
        if (event === 'TOKEN_REFRESHED' && session) {
          navigate('/');
        }
      }
    );

    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkAuth();

    return () => subscription.unsubscribe();
  }, [navigate, toast]);
  
  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (import.meta.env.DEV) {
        console.log('Sending OTP to email:', trimmedEmail);
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: true,
        }
      });
      
      if (error) throw error;
      setStep('verify');
      setResendCountdown(30);
      toast({ title: 'Verification code sent', description: 'Check your email for the 6-digit code.' });
    } catch (error: any) {
      console.error('signInWithOtp error:', error);
      const description = error?.message || 'Unable to send verification code. Please try again.';
      toast({ title: 'Send failed', description, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (import.meta.env.DEV) {
        console.log('Verifying OTP for email:', trimmedEmail);
      }
      
      const { error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: otp,
        type: 'email'
      });
      
      if (error) throw error;
      // Auth state change listener will handle navigation
      toast({ title: 'Verification successful', description: 'Signing you in...' });
    } catch (error: any) {
      console.error('verifyOtp error:', error);
      const description = error?.message || 'Invalid verification code. Please try again.';
      toast({ title: 'Verification failed', description, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('email');
    setOtp('');
    setResendCountdown(0);
  };

  useEffect(() => {
    if (step !== 'verify') return;
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [step, resendCountdown]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2"
          data-testid="link-back-home"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-primary">Sign in</h1>
              <p className="text-muted-foreground mt-2">
                {step === 'email' 
                  ? 'Enter your email to receive a verification code. New accounts allowed.'
                  : `Enter the 6-digit code sent to ${email}`
                }
              </p>
            </div>

            {step === 'email' ? (
              <form onSubmit={sendOTP} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    className="glass-card"
                    required
                    data-testid="input-email"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full glass-card bg-primary/90 hover:bg-primary text-primary-foreground"
                  disabled={isLoading}
                  data-testid="button-send-code"
                >
                  {isLoading ? 'Sending…' : 'Send verification code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyOTP} className="space-y-4">
                <div>
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="glass-card text-center text-lg tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    autoComplete="one-time-code"
                    data-testid="input-otp"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="submit"
                    className="w-full glass-card bg-primary/90 hover:bg-primary text-primary-foreground"
                    disabled={isLoading || otp.length !== 6}
                    data-testid="button-verify-code"
                  >
                    {isLoading ? 'Verifying…' : 'Verify code'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={sendOTP}
                    disabled={isLoading || resendCountdown > 0}
                    data-testid="button-resend-code"
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={resetForm}
                    disabled={isLoading}
                    data-testid="button-change-email"
                  >
                    Use different email
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;