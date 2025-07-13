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
  Calendar
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
      setRexModifications('');
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
    
    // Add to modified exercises set for highlighting
    const exerciseKey = `${editingExercise.dayIndex}-${editingExercise.exerciseIndex}`;
    setModifiedExercises(prev => new Set(prev).add(exerciseKey));
    
    // Remove highlight after 3 seconds
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
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Workout Plan Found</h2>
          <p className="text-muted-foreground mb-4">Please complete onboarding first.</p>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  if (modificationMode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Modify Your Schedule</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border hover:shadow-elevated transition-all duration-300 cursor-pointer"
                  onClick={() => setModificationMode('rex')}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-accent to-accent-glow rounded-full flex items-center justify-center mx-auto">
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

            <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border hover:shadow-elevated transition-all duration-300 cursor-pointer"
                  onClick={() => setModificationMode('manual')}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-center mx-auto">
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

  if (modificationMode === 'rex') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setModificationMode('select')} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="w-8 h-8 text-accent" />
              Modify with Rex
            </h1>
          </div>

          <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
            <div className="space-y-4">
              <Label htmlFor="rex-modifications">
                What would you like Rex to change about your workout plan?
              </Label>
              <Textarea
                id="rex-modifications"
                placeholder="E.g., I want more cardio, replace deadlifts with rack pulls, add more arm exercises, train 5 days instead of 4, focus more on strength..."
                value={rexModifications}
                onChange={(e) => setRexModifications(e.target.value)}
                className="min-h-[150px]"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleRexModification} 
                  disabled={isLoading}
                  variant="accent"
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Rex is thinking...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      Let Rex Modify
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setModificationMode('manual')}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Manual Edit Instead
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Manual editing mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setModificationMode('select')} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Manual Edit Schedule</h1>
          </div>
          <Button onClick={savePlan} variant="accent" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>

        <ScrollArea className="h-[70vh]">
          <div className="space-y-6">
            {localPlan?.days.map((day, dayIndex) => (
              <Card key={dayIndex} className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {day.day} - {day.name}
                </h3>
                
                <div className="space-y-4">
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <Card 
                      key={exerciseIndex} 
                      className={`p-4 transition-all duration-500 ${
                        modifiedExercises.has(`${dayIndex}-${exerciseIndex}`)
                          ? 'bg-accent/20 border-accent shadow-glow animate-pulse'
                          : 'bg-glass/20 border-glass-border/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-primary" />
                          <h4 className="font-medium">{exercise.name}</h4>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {exercise.muscleGroups.map((muscle, muscleIndex) => (
                            <Badge key={muscleIndex} variant="outline" className="text-xs">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
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
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExerciseEdit(dayIndex, exerciseIndex)}
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="w-3 h-3" />
                        Modify Exercise
                      </Button>
                    </Card>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Exercise Edit Dialog */}
        <Dialog open={!!editingExercise} onOpenChange={() => setEditingExercise(null)}>
          <DialogContent className="max-w-2xl bg-glass/95 backdrop-blur-glass border-glass-border">
            <DialogHeader>
              <DialogTitle>Edit Exercise</DialogTitle>
            </DialogHeader>
            
            {editingExercise && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Exercise Name</Label>
                    <Input
                      value={editingExercise.exercise.name}
                      onChange={(e) => setEditingExercise({
                        ...editingExercise,
                        exercise: { ...editingExercise.exercise, name: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Sets</Label>
                    <Input
                      type="number"
                      value={editingExercise.exercise.sets}
                      onChange={(e) => setEditingExercise({
                        ...editingExercise,
                        exercise: { ...editingExercise.exercise, sets: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Reps</Label>
                    <Input
                      value={editingExercise.exercise.reps}
                      onChange={(e) => setEditingExercise({
                        ...editingExercise,
                        exercise: { ...editingExercise.exercise, reps: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Weight</Label>
                    <Input
                      value={editingExercise.exercise.weight}
                      onChange={(e) => setEditingExercise({
                        ...editingExercise,
                        exercise: { ...editingExercise.exercise, weight: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Rest Time</Label>
                    <Input
                      value={editingExercise.exercise.restTime}
                      onChange={(e) => setEditingExercise({
                        ...editingExercise,
                        exercise: { ...editingExercise.exercise, restTime: e.target.value }
                      })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={editingExercise.exercise.notes}
                    onChange={(e) => setEditingExercise({
                      ...editingExercise,
                      exercise: { ...editingExercise.exercise, notes: e.target.value }
                    })}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingExercise(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveExerciseEdit} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Plan Modification Approval Dialog */}
        {showApprovalDialog && pendingModification && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[80vh] bg-glass/95 backdrop-blur-glass border-glass-border shadow-elevated overflow-hidden">
              <div className="p-6 border-b border-glass-border">
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Plan Modification Preview
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Review the changes Rex made to your workout plan
                </p>
              </div>
              
              <ScrollArea className="max-h-[50vh] p-6">
                <div className="space-y-4">
                  {pendingModification.days.map((day, dayIndex) => (
                    <Card key={dayIndex} className="p-4 bg-glass/30 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{day.day}</Badge>
                        <h4 className="font-semibold">{day.name}</h4>
                        <span className="text-sm text-muted-foreground">({day.duration} min)</span>
                      </div>
                      <div className="space-y-2">
                        {day.exercises.map((exercise, exerciseIndex) => {
                          const changeType = getChangeType(dayIndex, exerciseIndex);
                          const changeColors = {
                            added: 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-600',
                            modified: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-600',
                            removed: 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-600'
                          };
                          
                          return (
                            <div 
                              key={exerciseIndex} 
                              className={`text-sm p-3 rounded border ${
                                changeType ? changeColors[changeType] : 'bg-glass/20 border-glass-border'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{exercise.name}</span>
                                {changeType && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      changeType === 'added' ? 'text-green-700 border-green-300' :
                                      changeType === 'modified' ? 'text-yellow-700 border-yellow-300' :
                                      'text-red-700 border-red-300'
                                    }`}
                                  >
                                    {changeType.charAt(0).toUpperCase() + changeType.slice(1)}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-muted-foreground">
                                {exercise.sets} sets × {exercise.reps} reps
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-6 border-t border-glass-border flex gap-3">
                <Button 
                  onClick={handleRejectModification}
                  variant="outline" 
                  className="flex-1"
                >
                  Reject Changes
                </Button>
                <Button 
                  onClick={handleApproveModification}
                  variant="accent" 
                  className="flex-1"
                >
                  Approve & Apply Changes
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};