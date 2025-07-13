import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Bot, 
  Edit3, 
  Save, 
  X, 
  Dumbbell, 
  Clock, 
  Target,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { WorkoutPlan, Exercise } from '@/services/GoogleAIService';
import { googleAIService } from '@/services/GoogleAIService';
import { useToast } from '@/hooks/use-toast';

interface ModifyScheduleProps {
  workoutPlan: WorkoutPlan | null;
  onBack: () => void;
  onPlanUpdated: (plan: WorkoutPlan) => void;
  userData: any;
}

export const ModifySchedule: React.FC<ModifyScheduleProps> = ({
  workoutPlan,
  onBack,
  onPlanUpdated,
  userData
}) => {
  const [modificationMode, setModificationMode] = useState<'select' | 'rex' | 'manual'>('select');
  const [rexModifications, setRexModifications] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [pendingModification, setPendingModification] = useState<WorkoutPlan | null>(null);
  const [originalPlan, setOriginalPlan] = useState<WorkoutPlan | null>(workoutPlan);
  const [editingExercise, setEditingExercise] = useState<{
    dayIndex: number;
    exerciseIndex: number;
    exercise: Exercise;
  } | null>(null);
  const [localPlan, setLocalPlan] = useState<WorkoutPlan | null>(workoutPlan);
  const [modifiedExercises, setModifiedExercises] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleRexModification = async () => {
    if (!rexModifications.trim() || !workoutPlan) {
      toast({
        title: "Please enter modifications",
        description: "Tell Rex what you'd like to change about your plan.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const modifiedPlan = await googleAIService.adaptWorkoutPlan(workoutPlan, rexModifications);
      setPendingModification(modifiedPlan);
      setShowApprovalDialog(true);
      setRexModifications('');
      toast({
        title: "Plan Modified!",
        description: "Rex has created a new version of your workout plan. Please review the changes.",
      });
    } catch (error) {
      console.error('Error modifying plan:', error);
      toast({
        title: "Error modifying plan",
        description: "Please try again or use manual editing.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveModification = () => {
    if (pendingModification) {
      onPlanUpdated(pendingModification);
      setShowApprovalDialog(false);
      setPendingModification(null);
      setModificationMode('select');
      toast({
        title: "Plan Updated! 🎉",
        description: "Your workout plan has been successfully modified.",
      });
    }
  };

  const handleRejectModification = () => {
    setShowApprovalDialog(false);
    setPendingModification(null);
    toast({
      title: "Changes Rejected",
      description: "Your original workout plan remains unchanged.",
    });
  };

  const getChangeType = (dayIndex: number, exerciseIndex: number) => {
    if (!originalPlan || !pendingModification) return null;
    
    const originalExercise = originalPlan.days[dayIndex]?.exercises[exerciseIndex];
    const newExercise = pendingModification.days[dayIndex]?.exercises[exerciseIndex];
    
    if (!originalExercise && newExercise) return 'added';
    if (originalExercise && !newExercise) return 'removed';
    if (originalExercise && newExercise && 
        (originalExercise.name !== newExercise.name || 
         originalExercise.sets !== newExercise.sets ||
         originalExercise.reps !== newExercise.reps)) return 'modified';
    
    return null;
  };

  const handleExerciseEdit = (dayIndex: number, exerciseIndex: number) => {
    if (!localPlan) return;
    
    const exercise = localPlan.days[dayIndex].exercises[exerciseIndex];
    setEditingExercise({ dayIndex, exerciseIndex, exercise: { ...exercise } });
  };

  const saveExerciseEdit = () => {
    if (!editingExercise || !localPlan) return;

    const updatedPlan = { ...localPlan };
    updatedPlan.days[editingExercise.dayIndex].exercises[editingExercise.exerciseIndex] = editingExercise.exercise;
    
    const exerciseKey = `${editingExercise.dayIndex}-${editingExercise.exerciseIndex}`;
    setModifiedExercises(prev => new Set(prev).add(exerciseKey));
    
    setTimeout(() => {
      setModifiedExercises(prev => {
        const newSet = new Set(prev);
        newSet.delete(exerciseKey);
        return newSet;
      });
    }, 3000);
    
    setLocalPlan(updatedPlan);
    setEditingExercise(null);
    
    toast({
      title: "Exercise Updated",
      description: "Your exercise has been modified successfully.",
    });
  };

  const savePlan = () => {
    if (localPlan) {
      onPlanUpdated(localPlan);
      toast({
        title: "Plan Saved! 💾",
        description: "Your modified workout plan has been saved.",
      });
    }
  };

  if (!workoutPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 flex items-center justify-center ml-16">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Workout Plan Found</h2>
          <p className="text-muted-foreground mb-4">Please complete onboarding first.</p>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  // Selection Mode - Choose modification type
  if (modificationMode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 ml-16">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Modify Your Schedule</h1>
          </div>

          {/* Current Plan Overview */}
          <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
            <h2 className="text-xl font-semibold mb-4">Current Plan: {workoutPlan.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Training Days</p>
                  <p className="font-medium">{workoutPlan.days.length} days/week</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{workoutPlan.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Goals</p>
                  <div className="flex flex-wrap gap-1">
                    {workoutPlan.goals.map((goal, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Modification Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Rex AI Modification */}
            <Card className="p-8 bg-glass/30 backdrop-blur-glass border-glass-border hover:shadow-elevated transition-all duration-300 cursor-pointer group"
                  onClick={() => setModificationMode('rex')}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-accent to-accent-glow rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Bot className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Modify using Rex</h3>
                <p className="text-muted-foreground">
                  Tell Rex what you'd like to change and let AI regenerate your plan automatically.
                </p>
                <Button variant="accent" className="w-full">
                  Use Rex AI
                </Button>
              </div>
            </Card>

            {/* Manual Edit */}
            <Card className="p-8 bg-glass/30 backdrop-blur-glass border-glass-border hover:shadow-elevated transition-all duration-300 cursor-pointer group"
                  onClick={() => setModificationMode('manual')}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Edit3 className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Manual Edit</h3>
                <p className="text-muted-foreground">
                  Manually edit individual exercises, sets, reps, and weights in your schedule.
                </p>
                <Button variant="default" className="w-full">
                  Edit Manually
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Rex AI Modification Mode
  if (modificationMode === 'rex') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 ml-16">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setModificationMode('select')} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-accent" />
              <h1 className="text-3xl font-bold">Modify with Rex AI</h1>
            </div>
          </div>

          {/* Rex Modification Interface */}
          <Card className="p-8 bg-glass/30 backdrop-blur-glass border-glass-border">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-accent to-accent-glow rounded-2xl flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-bold">Tell Rex What to Change</h2>
                <p className="text-muted-foreground">
                  Describe what you'd like to modify about your current workout plan
                </p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="modifications">What would you like to change?</Label>
                <Textarea
                  id="modifications"
                  placeholder="E.g., I want more cardio, replace deadlifts with rack pulls, add more arm exercises, train 5 days instead of 4, focus more on upper body..."
                  value={rexModifications}
                  onChange={(e) => setRexModifications(e.target.value)}
                  className="min-h-[120px]"
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRexModification} 
                    disabled={isLoading || !rexModifications.trim()}
                    variant="accent"
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Modified Plan
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setModificationMode('select')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Example suggestions */}
              <div className="space-y-3">
                <h3 className="font-semibold">Example modifications:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Add more cardio exercises",
                    "Focus more on upper body",
                    "Replace squats with leg press",
                    "Increase training to 5 days",
                    "Add more core exercises",
                    "Reduce workout duration"
                  ].map((example, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => setRexModifications(example)}
                      className="justify-start text-left h-auto p-2"
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Manual Edit Mode
  if (modificationMode === 'manual') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 ml-16">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setModificationMode('select')} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-bold">Manual Edit</h1>
              </div>
            </div>
            <Button onClick={savePlan} variant="accent" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>

          {/* Workout Days */}
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6">
              {localPlan?.days.map((day, dayIndex) => (
                <Card key={dayIndex} className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{day.day}</h3>
                      <p className="text-primary font-medium">{day.name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {day.duration} min
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {day.exercises.map((exercise, exerciseIndex) => {
                      const exerciseKey = `${dayIndex}-${exerciseIndex}`;
                      const isModified = modifiedExercises.has(exerciseKey);
                      
                      return (
                        <Card 
                          key={exerciseIndex} 
                          className={`p-4 border-glass-border/50 transition-all duration-300 ${
                            isModified ? 'bg-accent/10 border-accent/30 shadow-glow' : 'bg-glass/20'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <Dumbbell className="w-4 h-4 text-primary" />
                              {exercise.name}
                            </h4>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExerciseEdit(dayIndex, exerciseIndex)}
                                className="flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                Edit
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-2">
                            <div>
                              <span className="text-muted-foreground">Sets:</span>
                              <span className="ml-1 font-medium">{exercise.sets}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Reps:</span>
                              <span className="ml-1 font-medium">{exercise.reps}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Weight:</span>
                              <span className="ml-1 font-medium">{exercise.weight}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Rest:</span>
                              <span className="ml-1 font-medium">{exercise.restTime}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {exercise.muscleGroups.map((muscle, muscleIndex) => (
                              <Badge key={muscleIndex} variant="outline" className="text-xs">
                                {muscle}
                              </Badge>
                            ))}
                          </div>
                          
                          {exercise.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              {exercise.notes}
                            </p>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Rex Approval Dialog
  return (
    <>
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-glass/95 backdrop-blur-glass border-glass-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Review Plan Changes
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Summary */}
              <Card className="p-4 bg-accent/10 border-accent/20">
                <h3 className="font-semibold text-accent mb-2">Rex's Modifications</h3>
                <p className="text-sm text-muted-foreground">
                  Based on your request: "{rexModifications}"
                </p>
              </Card>

              {/* Side by side comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Original Plan */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Current Plan</h3>
                  <div className="space-y-3">
                    {originalPlan?.days.map((day, index) => (
                      <Card key={index} className="p-3 bg-glass/20 border-glass-border/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{day.day}</span>
                          <span className="text-xs text-muted-foreground">{day.exercises.length} exercises</span>
                        </div>
                        <p className="text-sm text-primary">{day.name}</p>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Modified Plan */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-accent">Modified Plan</h3>
                  <div className="space-y-3">
                    {pendingModification?.days.map((day, index) => (
                      <Card key={index} className="p-3 bg-accent/10 border-accent/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{day.day}</span>
                          <span className="text-xs text-muted-foreground">{day.exercises.length} exercises</span>
                        </div>
                        <p className="text-sm text-accent">{day.name}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Changes */}
              <Card className="p-4 bg-glass/30 backdrop-blur-glass border-glass-border">
                <h3 className="font-semibold mb-3">Key Changes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Training Days</p>
                    <p className="font-medium">
                      {originalPlan?.days.length} → {pendingModification?.days.length} days
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{pendingModification?.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Focus</p>
                    <div className="flex flex-wrap gap-1">
                      {pendingModification?.goals.map((goal, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {goal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </ScrollArea>

          <div className="flex gap-3 pt-4 border-t border-glass-border">
            <Button 
              onClick={handleRejectModification}
              variant="outline" 
              className="flex-1 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Reject Changes
            </Button>
            <Button 
              onClick={handleApproveModification}
              variant="accent" 
              className="flex-1 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Approve & Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise Edit Dialog */}
      {editingExercise && (
        <Dialog open={!!editingExercise} onOpenChange={() => setEditingExercise(null)}>
          <DialogContent className="max-w-md bg-glass/95 backdrop-blur-glass border-glass-border">
            <DialogHeader>
              <DialogTitle>Edit Exercise</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exerciseName">Exercise Name</Label>
                <Input
                  id="exerciseName"
                  value={editingExercise.exercise.name}
                  onChange={(e) => setEditingExercise(prev => prev ? {
                    ...prev,
                    exercise: { ...prev.exercise, name: e.target.value }
                  } : null)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sets">Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    value={editingExercise.exercise.sets}
                    onChange={(e) => setEditingExercise(prev => prev ? {
                      ...prev,
                      exercise: { ...prev.exercise, sets: parseInt(e.target.value) || 0 }
                    } : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    value={editingExercise.exercise.reps}
                    onChange={(e) => setEditingExercise(prev => prev ? {
                      ...prev,
                      exercise: { ...prev.exercise, reps: e.target.value }
                    } : null)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={editingExercise.exercise.weight}
                    onChange={(e) => setEditingExercise(prev => prev ? {
                      ...prev,
                      exercise: { ...prev.exercise, weight: e.target.value }
                    } : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="restTime">Rest Time</Label>
                  <Input
                    id="restTime"
                    value={editingExercise.exercise.restTime}
                    onChange={(e) => setEditingExercise(prev => prev ? {
                      ...prev,
                      exercise: { ...prev.exercise, restTime: e.target.value }
                    } : null)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editingExercise.exercise.notes}
                  onChange={(e) => setEditingExercise(prev => prev ? {
                    ...prev,
                    exercise: { ...prev.exercise, notes: e.target.value }
                  } : null)}
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingExercise(null)}>
                Cancel
              </Button>
              <Button onClick={saveExerciseEdit} variant="accent">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};