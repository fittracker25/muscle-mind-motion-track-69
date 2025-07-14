
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  TrendingUp, 
  Clock, 
  Dumbbell, 
  Target, 
  Play, 
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { firestoreService, UserData } from '@/services/FirestoreService';
import { WorkoutPlan } from '@/services/GoogleAIService';

interface DashboardProps {
  onStartWorkout?: () => void;
  onModifySchedule?: () => void;
  onViewPlan?: () => void;
}

const CircularProgress = ({ percentage }: { percentage: number }) => {
  const circumference = 2 * Math.PI * 50; // radius of 50
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-primary transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ 
  onStartWorkout,
  onModifySchedule,
  onViewPlan 
}) => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Get today's workout
  const getTodaysWorkout = () => {
    if (!workoutPlan) return null;
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    console.log('Today is:', today);
    console.log('Available workout days:', workoutPlan.days.map(d => d.day));
    
    return workoutPlan.days.find(day => {
      const planDay = day.day.toLowerCase().trim();
      const todayLower = today.toLowerCase().trim();
      
      // Direct match
      if (planDay === todayLower) return true;
      
      // Check if plan day contains today or vice versa
      if (planDay.includes(todayLower) || todayLower.includes(planDay)) return true;
      
      return false;
    });
  };

  const todaysWorkout = getTodaysWorkout();

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const [userDataResponse, workoutPlanResponse] = await Promise.all([
            firestoreService.getUserData(user.uid),
            firestoreService.getWorkoutPlan(user.uid)
          ]);
          
          setUserData(userDataResponse);
          setWorkoutPlan(workoutPlanResponse);
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserData();
  }, [user]);

  // Calculate statistics from real data
  const calculateStats = () => {
    if (!workoutPlan) {
      return {
        totalExercises: 0,
        avgDuration: 0,
        programDuration: 'N/A',
        consistency: 0
      };
    }

    const totalExercises = workoutPlan.days.reduce((total, day) => total + day.exercises.length, 0);
    const avgDuration = workoutPlan.days.reduce((total, day) => total + day.duration, 0) / workoutPlan.days.length;
    const programDuration = workoutPlan.duration;
    // For now, consistency is a placeholder - you'd calculate this based on workout history
    const consistency = 85;

    return {
      totalExercises,
      avgDuration: Math.round(avgDuration),
      programDuration,
      consistency
    };
  };

  const stats = calculateStats();
  const userName = userData?.name || user?.email?.split('@')[0] || 'User';
  const userGoals = userData ? [userData.primaryGoal, userData.secondaryGoal].filter(Boolean) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary ml-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary ml-16">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome back, <span className="text-primary">{userName}</span>!
          </h1>
          <p className="text-xl text-muted-foreground">
            Ready to crush your fitness goals today?
          </p>
        </div>

        {/* Rest Day Section */}
        {todaysWorkout ? (
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-2xl mb-4">
              <Dumbbell className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{todaysWorkout.name}</h2>
            <p className="text-muted-foreground mb-4">
              {todaysWorkout.exercises.length} exercises • {todaysWorkout.duration} minutes
            </p>
            <Button 
              onClick={onStartWorkout} 
              variant="accent" 
              className="flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Today's Workout
            </Button>
          </div>
        ) : (
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-glass/30 rounded-2xl mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Rest Day</h2>
            <p className="text-muted-foreground">
              No workout scheduled for today. Enjoy your rest!
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Consistency with circular progress */}
          <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="font-semibold">Consistency</span>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <CircularProgress percentage={stats.consistency} />
            </div>
          </Card>

          {/* Avg Duration */}
          <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-secondary" />
              <span className="font-semibold">Avg Duration</span>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-1">{stats.avgDuration}</div>
              <div className="text-sm text-muted-foreground">min</div>
              <div className="text-xs text-muted-foreground mt-1">Per workout</div>
            </div>
          </Card>

          {/* Total Exercises */}
          <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="w-5 h-5 text-accent" />
              <span className="font-semibold">Total Exercises</span>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-1">{stats.totalExercises}</div>
              <div className="text-sm text-muted-foreground">exercises</div>
              <div className="text-xs text-muted-foreground mt-1">In your program</div>
            </div>
          </Card>

          {/* Program */}
          <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-semibold">Program</span>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">{stats.programDuration}</div>
              <div className="text-sm text-muted-foreground">duration</div>
            </div>
          </Card>
        </div>

        {/* Your Goals */}
        <div className="max-w-md mx-auto">
          <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
            <h3 className="text-xl font-bold mb-6">Your Goals</h3>
            <div className="space-y-4">
              {userGoals.length > 0 ? (
                userGoals.map((goal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-glass/20 rounded-lg">
                    <span className="font-medium">{goal}</span>
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                ))
              ) : (
                <div className="p-3 bg-glass/20 rounded-lg text-center text-muted-foreground">
                  No goals set yet
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
