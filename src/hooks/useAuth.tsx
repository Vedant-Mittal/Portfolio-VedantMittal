import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  email?: string;
  role: 'admin' | 'instructor' | 'student';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isInstructor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
              } else if (profileData) {
                setProfile({
                  ...profileData,
                  role: profileData.role as 'admin' | 'instructor' | 'student'
                });
              } else if (error?.code === 'PGRST116') {
                // Profile doesn't exist, but this shouldn't happen due to the trigger
                // Let's try to update the existing profile to instructor role instead
                console.log('🚀 No profile found, checking if trigger created one...');
                
                // Wait a bit for trigger to complete and try again
                setTimeout(async () => {
                  try {
                    const { data: retryProfileData, error: retryError } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('user_id', session.user.id)
                      .single();

                    if (retryProfileData) {
                      // Profile exists but might have wrong role, update to instructor
                      console.log('🔄 Updating profile to instructor role');
                      const { data: updatedProfile, error: updateError } = await supabase
                        .from('profiles')
                        .update({ role: 'instructor' })
                        .eq('user_id', session.user.id)
                        .select()
                        .single();

                      if (updateError) {
                        console.error('Error updating profile role:', updateError);
                        setProfile({
                          ...retryProfileData,
                          role: retryProfileData.role as 'admin' | 'instructor' | 'student'
                        });
                      } else if (updatedProfile) {
                        setProfile({
                          ...updatedProfile,
                          role: updatedProfile.role as 'admin' | 'instructor' | 'student'
                        });
                        console.log('✅ Profile updated to instructor role successfully');
                      }
                    } else {
                      // Still no profile, create one
                      console.log('🚀 Creating instructor profile for user:', session.user.email);
                      const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert({
                          user_id: session.user.id,
                          display_name: session.user.email?.split('@')[0] || 'Instructor',
                          role: 'instructor'
                        })
                        .select()
                        .single();

                      if (createError) {
                        console.error('Error creating profile:', createError);
                      } else if (newProfile) {
                        setProfile({
                          ...newProfile,
                          role: newProfile.role as 'admin' | 'instructor' | 'student'
                        });
                        console.log('✅ Instructor profile created successfully');
                      }
                    }
                  } catch (error) {
                    console.error('Error in profile retry logic:', error);
                  }
                }, 1000);
              }
            } catch (error) {
              console.error('Error in profile fetch:', error);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isInstructor = profile?.role === 'instructor' || profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signOut,
      isAdmin,
      isInstructor
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};