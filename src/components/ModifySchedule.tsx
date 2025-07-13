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
  CheckCircle
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
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Workout Plan Found</h2>
          <p className="text-muted-foreground mb-4">Please complete onboarding first.</p>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  // Rest of the component implementation...
};