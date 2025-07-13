import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Check, 
  Timer, 
  Dumbbell,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Trophy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkoutPlan } from '@/contexts/WorkoutPlanContext';
import { Calendar } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  restTime: number; // seconds
  muscleGroups: string[];
  instructions: string[];
  image?: string;
}

interface WorkoutSessionProps {
  onComplete: () => void;
  onExit: () => void;
}

const WorkoutSession: React.FC<WorkoutSessionProps> = ({ onComplete, onExit }) => {
  const { workoutPlan } = useWorkoutPlan();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [workoutStartTime] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completedSets, setCompletedSets] = useState<Record<string, Array<{reps: number, weight: number}>>>({});
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [appState, setAppState] = useState<'workout' | 'congratulations'>('workout');
  
  const { toast } = useToast();

  // Update current time every second for real-time duration
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get today's workout from the actual plan
  const getTodaysWorkout = () => {
    if (!workoutPlan) return [];
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    console.log('Today is:', today); // Debug log
    console.log('Available workout days:', workoutPlan.days.map(d => d.day)); // Debug log
    
    const todaysWorkoutDay = workoutPlan.days.find(day => {
      const planDay = day.day.toLowerCase().trim();
      
      // Direct match
      if (planDay === today) return true;
      
      // Check if plan day contains today or vice versa
      if (planDay.includes(today) || today.includes(planDay)) return true;
      
      return false;
    });
    
    console.log('Found workout day:', todaysWorkoutDay); // Debug log
    
    if (!todaysWorkoutDay) return [];
    
    // Convert workout plan exercises to the Exercise interface format
    return todaysWorkoutDay.exercises.map((exercise, index) => ({
      id: `${index + 1}`,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight,
      restTime: parseInt(exercise.restTime.split(' ')[0]) || 120, // Extract seconds from "2-3 minutes"
      muscleGroups: exercise.muscleGroups,
      instructions: exercise.notes ? [exercise.notes] : [
        'Maintain proper form throughout the movement',
        'Control the weight on both concentric and eccentric phases',
        'Breathe properly during the exercise',
        'Focus on the target muscle groups'
      ]
    }));
  };

  const workout = getTodaysWorkout();
  
  // If no workout for today, show message
  if (workout.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 flex items-center justify-center">
        <Card className="p-8 text-center bg-glass/30 backdrop-blur-glass border-glass-border">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Workout Today</h2>
          <p className="text-muted-foreground mb-4">Today is a rest day. Enjoy your recovery!</p>
          <Button onClick={onExit} variant="outline">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const currentExercise = workout[currentExerciseIndex];
  const totalExercises = workout.length;
  const workoutProgress = ((currentExerciseIndex + (currentSet / currentExercise.sets)) / totalExercises) * 100;

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setIsResting(false);
            toast({
              title: "Rest Complete!",
              description: "Time for your next set.",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, restTimer, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate real elapsed time
  const getElapsedTime = () => {
    const elapsed = Math.floor((currentTime.getTime() - workoutStartTime.getTime()) / 1000 / 60);
    return elapsed;
  };

  const handleSetComplete = () => {
    if (!currentReps || (currentExercise.weight && !currentWeight)) {
      toast({
        title: "Missing Information",
        description: "Please enter reps and weight (if applicable) before completing the set.",
        variant: "destructive"
      });
      return;
    }

    // Record the completed set
    const exerciseId = currentExercise.id;
    const setData = {
      reps: parseInt(currentReps),
      weight: currentWeight ? parseFloat(currentWeight) : 0
    };

    setCompletedSets(prev => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), setData]
    }));

    if (currentSet < currentExercise.sets) {
      // Start rest timer
      setCurrentSet(prev => prev + 1);
      setRestTimer(currentExercise.restTime);
      setIsResting(true);
      setIsTimerRunning(true);
      setCurrentReps('');
      if (!currentExercise.weight) setCurrentWeight('');
      
      toast({
        title: `Set ${currentSet} Complete!`,
        description: `Rest for ${formatTime(currentExercise.restTime)}`,
      });
    } else {
      // Move to next exercise
      nextExercise();
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setCurrentReps('');
      setCurrentWeight(workout[currentExerciseIndex + 1].weight || '');
      setIsResting(false);
      setIsTimerRunning(false);
      setRestTimer(0);
    } else {
      // Workout complete
      completeWorkout();
    }
  };

  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSet(1);
      setCurrentReps('');
      setCurrentWeight(workout[currentExerciseIndex - 1].weight || '');
      setIsResting(false);
      setIsTimerRunning(false);
      setRestTimer(0);
    }
  };

  const skipRest = () => {
    setIsTimerRunning(false);
    setIsResting(false);
    setRestTimer(0);
  };

  const completeWorkout = () => {
    const duration = getElapsedTime();
    toast({
      title: "Workout Complete! 🎉",
      description: `Great job! You completed your workout in ${duration} minutes.`,
    });
    // Show congratulation screen first
    setAppState('congratulations');
  };

  // Congratulations screen
  if (appState === 'congratulations') {
    const duration = getElapsedTime();
    const totalSets = workout.reduce((sum, exercise) => sum + exercise.sets, 0);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-12 bg-glass/30 backdrop-blur-glass border-glass-border shadow-elevated text-center animate-scale-in">
          <div className="space-y-6">
            <div className="text-6xl animate-bounce">🎉</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">
              Great Job Today!
            </h1>
            <p className="text-xl text-muted-foreground">
              You absolutely crushed it! 💪
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Card className="p-4 bg-accent/10 border-accent/20">
                <div className="text-2xl font-bold text-accent">{duration}</div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </Card>
              <Card className="p-4 bg-primary/10 border-primary/20">
                <div className="text-2xl font-bold text-primary">{workout.length}</div>
                <div className="text-sm text-muted-foreground">Exercises</div>
              </Card>
              <Card className="p-4 bg-secondary/10 border-secondary/20">
                <div className="text-2xl font-bold text-secondary">{totalSets}</div>
                <div className="text-sm text-muted-foreground">Total Sets</div>
              </Card>
            </div>
            
            <div className="mt-8">
              <p className="text-lg font-medium text-foreground mb-2">
                "Success isn't always about greatness. It's about consistency."
              </p>
              <p className="text-sm text-muted-foreground">— Dwayne Johnson</p>
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                variant="accent" 
                onClick={onComplete}
                className="flex items-center gap-2 text-accent-foreground bg-accent hover:bg-accent/90"
              >
                <Trophy className="w-5 h-5" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const startRestTimer = () => {
    setRestTimer(currentExercise.restTime);
    setIsResting(true);
    setIsTimerRunning(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onExit} className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Exit Workout
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {workoutPlan?.days.find(day => day.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }))?.name || 'Today\'s Workout'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {getElapsedTime()} min elapsed
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Exercise</p>
            <p className="text-lg font-bold">
              {currentExerciseIndex + 1} / {totalExercises}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Workout Progress</span>
            <span>{Math.round(workoutProgress)}%</span>
          </div>
          <Progress value={workoutProgress} className="h-3" />
        </div>

        {/* Rest Timer (if resting) */}
        {isResting && (
          <Card className="p-6 bg-accent/10 border-accent/20 backdrop-blur-glass text-center animate-glow-pulse">
            <div className="space-y-4">
              <Timer className="w-12 h-12 mx-auto text-accent" />
              <h2 className="text-2xl font-bold">Rest Time</h2>
              <div className="text-4xl font-mono font-bold text-accent">
                {formatTime(restTimer)}
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="flex items-center gap-2"
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isTimerRunning ? 'Pause' : 'Resume'}
                </Button>
                <Button variant="accent" onClick={skipRest} className="flex items-center gap-2">
                  <SkipForward className="w-4 h-4" />
                  Skip Rest
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Exercise Card */}
        {!isResting && (
          <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border shadow-elevated">
            <div className="space-y-6">
              
              {/* Exercise Header */}
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">{currentExercise.name}</h2>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-4 h-4" />
                    Set {currentSet} of {currentExercise.sets}
                  </span>
                  <span>Target: {currentExercise.reps} reps</span>
                  {currentExercise.weight && (
                    <span>Suggested: {currentExercise.weight}kg</span>
                  )}
                </div>
                
                {/* Muscle Groups */}
                <div className="flex flex-wrap justify-center gap-2">
                  {currentExercise.muscleGroups.map((muscle, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-lg"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              {/* Exercise Image Placeholder */}
              <div className="w-full h-48 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <img 
                    src="/lovable-uploads/7efaaa9c-effc-4d82-a2ac-e0998cbe814d.png"
                    alt="Exercise demonstration"
                    className="max-h-40 mx-auto rounded-lg"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <h3 className="font-semibold">Form Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  {currentExercise.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reps">Reps Completed</Label>
                  <Input
                    id="reps"
                    type="number"
                    placeholder="Enter reps"
                    value={currentReps}
                    onChange={(e) => setCurrentReps(e.target.value)}
                    className="text-center text-lg"
                  />
                </div>
                
                {currentExercise.weight && (
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight Used (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="Enter weight"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      className="text-center text-lg"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={prevExercise}
                  disabled={currentExerciseIndex === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <Button
                  variant="accent"
                  onClick={handleSetComplete}
                  className="flex items-center gap-2 min-w-[120px]"
                >
                  <Check className="w-4 h-4" />
                  Complete Set
                </Button>
                
                <Button
                  variant="outline"
                  onClick={nextExercise}
                  disabled={currentExerciseIndex === totalExercises - 1}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Rest Timer Button */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={startRestTimer}
                  className="flex items-center gap-2 w-full"
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Rest Timer ({formatTime(currentExercise.restTime)})
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Set History for Current Exercise */}
        {completedSets[currentExercise.id] && completedSets[currentExercise.id].length > 0 && (
          <Card className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
            <h3 className="font-semibold mb-3">Completed Sets:</h3>
            <div className="flex gap-2 flex-wrap">
              {completedSets[currentExercise.id].map((set, index) => (
                <div 
                  key={index}
                  className="px-3 py-2 bg-success/20 text-success rounded-lg text-sm"
                >
                  Set {index + 1}: {set.reps} reps
                  {set.weight > 0 && ` @ ${set.weight}kg`}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WorkoutSession;
