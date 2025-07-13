import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, ChevronLeft, ChevronRight, Dumbbell, Clock } from 'lucide-react';
import { WorkoutPlan } from '@/services/GoogleAIService';

interface CalendarViewProps {
  workoutPlan: WorkoutPlan | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ workoutPlan }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getWorkoutForDay = (dayName: string) => {
    if (!workoutPlan) return null;
    
    // More flexible day matching
    const normalizedDayName = dayName.toLowerCase().trim();
    
    return workoutPlan.days.find(day => {
      const planDay = day.day.toLowerCase().trim();
      
      // Direct match
      if (planDay === normalizedDayName) return true;
      
      // Check if plan day is contained in the calendar day or vice versa
      if (planDay.includes(normalizedDayName) || normalizedDayName.includes(planDay)) return true;
      
      // Check for common abbreviations
      const dayMappings = {
        'sun': 'sunday',
        'mon': 'monday', 
        'tue': 'tuesday',
        'wed': 'wednesday',
        'thu': 'thursday',
        'fri': 'friday',
        'sat': 'saturday'
      };
      
      const expandedCalendarDay = dayMappings[normalizedDayName] || normalizedDayName;
      const expandedPlanDay = dayMappings[planDay] || planDay;
      
      return expandedCalendarDay === expandedPlanDay;
    });
  };

  const getWorkoutType = (workout: any) => {
    if (!workout) return 'rest';
    
    const name = workout.name.toLowerCase();
    if (name.includes('push') || name.includes('chest') || name.includes('shoulder')) return 'push';
    if (name.includes('pull') || name.includes('back') || name.includes('lat')) return 'pull';
    if (name.includes('leg') || name.includes('squat') || name.includes('lower')) return 'legs';
    if (name.includes('cardio') || name.includes('running') || name.includes('bike')) return 'cardio';
    if (name.includes('full') || name.includes('total')) return 'fullbody';
    return 'fullbody';
  };

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'push': return 'bg-red-500';
      case 'pull': return 'bg-blue-500';
      case 'legs': return 'bg-green-500';
      case 'cardio': return 'bg-orange-500';
      case 'fullbody': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getWorkoutTypeLabel = (type: string) => {
    switch (type) {
      case 'push': return 'Push';
      case 'pull': return 'Pull';
      case 'legs': return 'Legs';
      case 'cardio': return 'Cardio';
      case 'fullbody': return 'Full Body';
      default: return 'Rest';
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-20 p-2 border border-glass-border/50"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayName = daysOfWeek[date.getDay()];
      const workout = getWorkoutForDay(dayName);
      
      console.log(`Day ${day} (${dayName}):`, workout); // Debug log
      
      const workoutType = getWorkoutType(workout);
      const typeColor = getWorkoutTypeColor(workoutType);
      const typeLabel = getWorkoutTypeLabel(workoutType);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={`h-20 p-2 border border-glass-border/50 ${
            isToday ? 'bg-primary/10 border-primary/50' : 'bg-glass/20'
          } ${workout ? 'hover:bg-glass/30' : ''} transition-colors`}
        >
          <div className="h-full flex flex-col">
            <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
              {day}
            </span>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className={`w-12 h-6 rounded-md ${typeColor} flex items-center justify-center mb-1`}>
                <span className="text-white text-[10px] font-medium">{typeLabel}</span>
              </div>
              {workout && (
                <div className="text-[8px] text-muted-foreground text-center">
                  <div>{workout.exercises.length} exercises</div>
                  <div>{workout.duration}min</div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="justify-start h-12">
          <Calendar className="w-5 h-5 mr-3" />
          <div className="text-left">
            <p className="font-medium">View Schedule</p>
            <p className="text-xs opacity-70">Check upcoming workouts</p>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-glass/95 backdrop-blur-glass border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Workout Schedule
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-4">
            {!workoutPlan ? (
              <Card className="p-8 text-center bg-glass/30 backdrop-blur-glass border-glass-border">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Workout Plan</h3>
                <p className="text-muted-foreground">Complete your onboarding to generate a personalized workout schedule.</p>
              </Card>
            ) : (
              <>
                  {/* Calendar Header */}
                  <Card className="p-4 bg-glass/30 backdrop-blur-glass border-glass-border">
                    <div className="flex items-center justify-between mb-4">
                      <Button variant="ghost" size="sm" onClick={previousMonth}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <h3 className="text-lg font-semibold">
                        {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                      </h3>
                      <Button variant="ghost" size="sm" onClick={nextMonth}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Days of week header */}
                    <div className="grid grid-cols-7 mb-2">
                      {daysOfWeek.map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendar()}
                    </div>
                  </Card>

                  {/* Weekly Schedule Overview */}
                  <Card className="p-4 bg-glass/30 backdrop-blur-glass border-glass-border">
                    <h4 className="font-semibold mb-3">Weekly Training Schedule</h4>
                    <div className="space-y-2">
                      {workoutPlan.days.map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-glass/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="min-w-[60px] justify-center">
                              {day.day}
                            </Badge>
                            <div>
                              <p className="font-medium">{day.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {day.exercises.length} exercises
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {day.duration} min
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};