import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import OnboardingForm from '@/components/OnboardingForm';
import Dashboard from '@/components/Dashboard';
import WorkoutSession from '@/components/WorkoutSession';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { ScheduleApproval } from '@/components/ScheduleApproval';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { RexChatbot } from '@/components/RexChatbot';

import { googleAIService, WorkoutPlan } from '@/services/GoogleAIService';
import { ModifySchedule } from '@/components/ModifySchedule';
import { ViewPlan } from '@/components/ViewPlan';
import { SignInDialog } from '@/components/SignInDialog';
import { LoginDialog } from '@/components/LoginDialog';
import { SignInPage } from '@/components/SignInPage';
import { useWorkoutPlan } from '@/contexts/WorkoutPlanContext';
import { Sidebar } from '@/components/Sidebar';
import { AccountPage } from '@/components/AccountPage';
import { UpdateMetrics } from '@/components/UpdateMetrics';
import { ProgressCharts } from '@/components/ProgressCharts';
import { useAuth } from '@/hooks/useAuth';
import { firestoreService, UserData } from '@/services/FirestoreService';
import { authService } from '@/services/AuthService';
import { auth } from '@/lib/firebase';
import { Play, Target, BarChart3, Sparkles, Dumbbell, Zap, Trophy, ArrowLeft } from 'lucide-react';
import heroImage from '@/assets/hero-fitness.jpg';
import { useToast } from '@/hooks/use-toast';

type AppState = 'landing' | 'sign-in' | 'onboarding' | 'dashboard' | 'workout' | 'schedule-approval' | 'modify-schedule' | 'view-plan' | 'account' | 'update-metrics' | 'progress-charts' | 'view-prs';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pendingPlan, setPendingPlan] = useState<WorkoutPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { setWorkoutPlan, workoutPlan } = useWorkoutPlan();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  // Load user data when user is authenticated
  useEffect(() => {
    const loadUserData = async () => {
      console.log('LoadUserData effect running:', { user: !!user, userData: !!userData, appState, loading });
      
      if (user && !userData) {
        try {
          const data = await firestoreService.getUserData(user.uid);
          console.log('Loaded user data from Firestore:', !!data);
          
          if (data) {
            setUserData(data);
            // Only redirect to dashboard if we're on landing page
            if (appState === 'landing') {
              console.log('Redirecting to dashboard from landing');
              setAppState('dashboard');
            }
            // Don't redirect if we're in other states - let the current flow complete
            
            // Load workout plan
            const plan = await firestoreService.getWorkoutPlan(user.uid);
            if (plan) {
              setWorkoutPlan(plan);
            }
          } else if (appState === 'landing') {
            // New user, go to onboarding only if we're on landing
            console.log('New user, redirecting to onboarding');
            setAppState('onboarding');
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else if (!user && !loading && appState !== 'landing' && appState !== 'sign-in' && appState !== 'onboarding' && appState !== 'schedule-approval') {
        // User is not authenticated and not on landing/sign-in/onboarding/schedule-approval, reset state
        console.log('User not authenticated, resetting state');
        setAppState('landing');
        setUserData(null);
        setWorkoutPlan(null);
      }
    };

    // Only run this effect if we're not in loading state
    if (!loading) {
      loadUserData();
    }
  }, [user, loading, userData, setWorkoutPlan, appState]);

  const handleOnboardingComplete = async (data: Omit<UserData, 'userId'>) => {
    // Store the data temporarily
    setUserData({ ...data, userId: '' } as UserData);
    
    // Generate workout plan immediately
    setIsGeneratingPlan(true);
    
    toast({
      title: "Generating Your Plan",
      description: "Our AI is creating a personalized workout plan for you...",
    });
    
    try {
      const workoutPlan = await googleAIService.generateWorkoutPlan(data);
      setPendingPlan(workoutPlan);
      setAppState('schedule-approval');
    } catch (error) {
      console.error('Error generating workout plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate workout plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSignInComplete = async () => {
    setShowSignInDialog(false);
    
    // Wait a bit for auth state to update after signup
    setTimeout(async () => {
      // If we have a pending plan, save everything and go to dashboard
      if (pendingPlan && userData && user) {
        await handleConfirmAndSignUp(pendingPlan);
      } else {
        // Check if we have onboarding data to save
        if (userData) {
          // Wait for user state to be available
          let currentUser = user;
          let attempts = 0;
          while (!currentUser && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            currentUser = auth.currentUser;
            attempts++;
          }
          
          if (currentUser) {
            try {
              const userDataToSave = { ...userData, userId: currentUser.uid };
              await firestoreService.saveUserData(currentUser.uid, userDataToSave);
              setUserData(userDataToSave);
              
              // If we have a pending plan, save it too
              if (pendingPlan) {
                await firestoreService.saveWorkoutPlan(currentUser.uid, pendingPlan);
                setWorkoutPlan(pendingPlan);
                setPendingPlan(null);
              }
              
              setAppState('dashboard');
              
              toast({
                title: "Welcome!",
                description: "Your profile has been saved successfully.",
              });
            } catch (error) {
              console.error('Error saving user data:', error);
              toast({
                title: "Error",
                description: "Failed to save data. Please try again.",
                variant: "destructive",
              });
            }
          } else {
            console.error('User not available after signup');
            toast({
              title: "Error",
              description: "Authentication issue. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          // Direct sign in from landing page
          setAppState('dashboard');
        }
      }
    }, 500);
  };

  const handleDirectSignIn = () => {
    setShowLoginDialog(true);
  };

  const handleLoginComplete = () => {
    setShowLoginDialog(false);
    // User data will be loaded by useEffect
  };

  const handleScheduleApproved = async (plan: WorkoutPlan) => {
    // Trigger sign up flow with the approved plan
    setShowSignInDialog(true);
  };

  const handleConfirmAndSignUp = async (plan: WorkoutPlan) => {
    if (user && userData) {
      try {
        // Save both user data and workout plan
        const userDataToSave = { ...userData, userId: user.uid };
        await firestoreService.saveUserData(user.uid, userDataToSave);
        await firestoreService.saveWorkoutPlan(user.uid, plan);
        
        setUserData(userDataToSave);
        setWorkoutPlan(plan);
        setPendingPlan(null);
        setAppState('dashboard');
        
        toast({
          title: "Welcome to Your Fitness Journey!",
          description: "Your personalized workout plan is now ready to use.",
        });
      } catch (error) {
        console.error('Error saving user data and workout plan:', error);
        toast({
          title: "Error",
          description: "Failed to save your data. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handlePlanModification = async (modifiedPlan: WorkoutPlan) => {
    setPendingPlan(modifiedPlan);
    // Stay in schedule-approval state to show the updated plan
  };

  const handleStartWorkout = () => {
    setAppState('workout');
  };

  const handleWorkoutComplete = () => {
    setAppState('dashboard');
  };

  const handleWorkoutExit = () => {
    setAppState('dashboard');
  };

  const handleModifySchedule = () => {
    setAppState('modify-schedule');
  };

  const handleViewPlan = () => {
    setAppState('view-plan');
  };

  const handleNavigate = (page: string) => {
    switch (page) {
      case 'dashboard':
        setAppState('dashboard');
        break;
      case 'workout':
        handleStartWorkout();
        break;
      case 'view-schedule':
        setAppState('view-plan');
        break;
      case 'modify-schedule':
        handleModifySchedule();
        break;
      case 'progress-charts':
        setAppState('progress-charts');
        break;
      case 'view-prs':
        setAppState('view-prs');
        break;
      case 'account':
        setAppState('account');
        break;
      case 'update-metrics':
        setAppState('update-metrics');
        break;
      default:
        setAppState('dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setAppState('landing');
      setUserData(null);
      setWorkoutPlan(null);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMetrics = async (updatedData: UserData) => {
    if (user) {
      try {
        await firestoreService.updateUserData(user.uid, updatedData);
        setUserData(updatedData);
        toast({
          title: "Success",
          description: "Your metrics have been updated successfully.",
        });
      } catch (error) {
        console.error('Error updating metrics:', error);
        toast({
          title: "Error",
          description: "Failed to update metrics. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return <LoadingAnimation message="Loading your fitness journey..." />;
  }

  if (appState === 'onboarding') {
    return (
      <>
        <DarkModeToggle />
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 flex items-center justify-center">
          {isGeneratingPlan ? (
            <LoadingAnimation message="Our AI is analyzing your profile and creating a personalized workout plan..." />
          ) : (
            <>
              <Card className="w-full max-w-4xl p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-elevated">
                <OnboardingForm onComplete={handleOnboardingComplete} />
              </Card>
              <SignInDialog 
                isOpen={showSignInDialog}
                onClose={() => setShowSignInDialog(false)}
                onSignInComplete={handleSignInComplete}
              />
            </>
          )}
        </div>
      </>
    );
  }

  if (appState === 'schedule-approval' && pendingPlan) {
    return (
      <>
        <DarkModeToggle />
        <ScheduleApproval
          workoutPlan={pendingPlan}
          onApprove={handleScheduleApproved}
          onModify={handlePlanModification}
          isOpen={true}
          onClose={() => setAppState('onboarding')}
          showSignUp={true}
        />
        <SignInDialog 
          isOpen={showSignInDialog}
          onClose={() => setShowSignInDialog(false)}
          onSignInComplete={handleSignInComplete}
        />
      </>
    );
  }

  if (appState === 'dashboard') {
    return (
      <>
        <Sidebar 
          onNavigate={handleNavigate} 
          userName={userData?.name || 'User'} 
          currentPage="dashboard"
        />
        <DarkModeToggle />
        {userData && <RexChatbot userData={userData} workoutPlan={workoutPlan} onPlanModified={setWorkoutPlan} />}
        <Dashboard 
          userName={userData?.name}
          onStartWorkout={handleStartWorkout}
          onModifySchedule={handleModifySchedule}
          onViewPlan={handleViewPlan}
        />
      </>
    );
  }

  if (appState === 'modify-schedule') {
    return (
      <>
        <Sidebar 
          onNavigate={handleNavigate} 
          userName={userData?.name || 'User'} 
          currentPage="modify"
        />
        <DarkModeToggle />
        <RexChatbot userData={userData} workoutPlan={workoutPlan} />
        <ModifySchedule 
          workoutPlan={workoutPlan}
          onBack={() => setAppState('dashboard')}
          onPlanUpdated={async (updatedPlan) => {
            if (user) {
              try {
                await firestoreService.updateWorkoutPlan(user.uid, updatedPlan);
                setWorkoutPlan(updatedPlan);
                setAppState('dashboard');
              } catch (error) {
                console.error('Error updating workout plan:', error);
                toast({
                  title: "Error",
                  description: "Failed to update workout plan. Please try again.",
                  variant: "destructive",
                });
              }
            }
          }}
          userData={userData}
        />
      </>
    );
  }

  if (appState === 'view-plan') {
    return (
      <>
        <Sidebar 
          onNavigate={handleNavigate} 
          userName={userData?.name || 'User'} 
          currentPage="view-plan"
        />
        <DarkModeToggle />
        <ViewPlan 
          workoutPlan={workoutPlan}
          onBack={() => setAppState('dashboard')}
        />
      </>
    );
  }

  if (appState === 'workout') {
    return (
      <>
        <Sidebar 
          onNavigate={handleNavigate} 
          userName={userData?.name || 'User'} 
          currentPage="workout"
        />
        <DarkModeToggle />
        <RexChatbot userData={userData} workoutPlan={workoutPlan} isWorkoutMode={true} />
        <WorkoutSession
          onComplete={handleWorkoutComplete}
          onExit={handleWorkoutExit}
        />
      </>
    );
  }

  if (appState === 'progress-charts') {
    return (
      <>
        <Sidebar 
          onNavigate={handleNavigate} 
          userName={userData?.name || 'User'} 
          currentPage="progress-charts"
        />
        <DarkModeToggle />
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 ml-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={() => setAppState('dashboard')} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold">Progress Analytics</h1>
            </div>
            <ProgressCharts />
          </div>
        </div>
      </>
    );
  }

  if (appState === 'view-prs') {
    return (
      <>
        <Sidebar 
          onNavigate={handleNavigate} 
          userName={userData?.name || 'User'} 
          currentPage="view-prs"
        />
        <DarkModeToggle />
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 ml-16">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setAppState('dashboard')} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold">Personal Records</h1>
            </div>
            
            <Card className="p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-elevated">
              <div className="text-center space-y-4">
                <Trophy className="w-16 h-16 mx-auto text-accent" />
                <h2 className="text-2xl font-bold">Your Personal Records</h2>
                <p className="text-muted-foreground">Track your strength progress and celebrate your achievements!</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  {[
                    { name: 'Bench Press', current: userData?.benchPress || '0', unit: 'kg' },
                    { name: 'Squat', current: userData?.squat || '0', unit: 'kg' },
                    { name: 'Deadlift', current: userData?.deadlift || '0', unit: 'kg' },
                    { name: 'Overhead Press', current: userData?.overheadPress || '0', unit: 'kg' }
                  ].map((lift, index) => (
                    <Card key={index} className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
                      <h3 className="font-semibold text-lg mb-2">{lift.name}</h3>
                      <div className="text-3xl font-bold text-primary">{lift.current} {lift.unit}</div>
                      <p className="text-sm text-muted-foreground mt-1">Current PR</p>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (appState === 'account') {
    return (
      <>
        <Sidebar 
          onNavigate={handleNavigate} 
          userName={userData?.name || 'User'} 
          currentPage="account"
        />
        <DarkModeToggle />
        <AccountPage
          userName={userData?.name || 'User'}
          userEmail={user?.email || 'user@email.com'}
          onBack={() => setAppState('dashboard')}
          onLogout={handleLogout}
        />
      </>
    );
  }

  if (appState === 'update-metrics') {
    return (
      <>
        <Sidebar 
          onNavigate={handleNavigate} 
          userName={userData?.name || 'User'} 
          currentPage="update-metrics"
        />
        <DarkModeToggle />
        <UpdateMetrics
          onBack={() => setAppState('dashboard')}
          userData={userData}
          onUpdate={handleUpdateMetrics}
        />
      </>
    );
  }

  if (appState === 'sign-in') {
    return (
      <SignInPage 
        onBack={() => setAppState('landing')}
        onSignInComplete={handleDirectSignIn}
        onCreateAccount={() => setAppState('onboarding')}
      />
    );
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary">
      <DarkModeToggle />
      
      {/* Sign In Button */}
      <Button
        variant="outline"
        onClick={() => setAppState('sign-in')}
        className="fixed top-4 right-20 z-50 bg-glass/20 backdrop-blur-glass border border-glass-border hover:bg-glass/30 transition-all duration-300"
      >
        Sign In
      </Button>
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column - Text */}
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-accent" />
                  <span className="text-accent font-medium">AI-Powered Fitness</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  Transform Your{' '}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Fitness Journey
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Get personalized workout plans, track your progress with precision, 
                  and achieve your fitness goals with AI-powered insights.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="xl" 
                  variant="accent" 
                  onClick={() => setAppState('onboarding')}
                  className="flex items-center gap-2 animate-glow-pulse"
                >
                  <Play className="w-5 h-5" />
                  Start Your Journey
                </Button>
              </div>

              {/* Stats */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything You Need to{' '}
              <span className="text-primary">Succeed</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform adapts to your needs, creating personalized 
              experiences that evolve with your progress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <Card className="p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-glass hover:shadow-elevated transition-all duration-300 hover:scale-105">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-light rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">AI Workout Generation</h3>
                <p className="text-muted-foreground">
                  Get custom workout plans tailored to your goals, equipment, 
                  and schedule. Our AI learns from your progress and adapts.
                </p>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-glass hover:shadow-elevated transition-all duration-300 hover:scale-105">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-r from-secondary to-secondary-light rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Progress Tracking</h3>
                <p className="text-muted-foreground">
                  Visualize your journey with detailed analytics, PR tracking, 
                  and performance insights that keep you motivated.
                </p>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-glass hover:shadow-elevated transition-all duration-300 hover:scale-105">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-r from-accent to-accent-glow rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Smart Goal Setting</h3>
                <p className="text-muted-foreground">
                  Set realistic, achievable goals with our intelligent system 
                  that adjusts based on your progress and lifestyle.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-12 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 backdrop-blur-glass shadow-elevated">
            <div className="space-y-6">
              <Zap className="w-16 h-16 mx-auto text-accent animate-glow-pulse" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Level Up Your Fitness?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of fitness enthusiasts who have transformed their 
                bodies and minds with our AI-powered training system.
              </p>
              <Button 
                size="xl" 
                variant="accent" 
                onClick={() => setAppState('onboarding')}
                className="flex items-center gap-2 mx-auto animate-glow-pulse"
              >
                <Dumbbell className="w-5 h-5" />
                Get Started Free
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Login Dialog */}
      <LoginDialog 
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onLoginComplete={handleLoginComplete}
      />
    </div>
  );
};

export default Index;
