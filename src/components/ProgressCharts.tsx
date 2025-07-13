import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Target, Calendar } from 'lucide-react';

export const ProgressCharts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false); // Control dialog state
  
  // Mock data - in real app this would come from user's workout history
  const strengthData = [
    { week: 'Week 1', benchPress: 70, squat: 85, deadlift: 110, overheadPress: 45 },
    { week: 'Week 2', benchPress: 72, squat: 87, deadlift: 112, overheadPress: 46 },
    { week: 'Week 3', benchPress: 75, squat: 90, deadlift: 115, overheadPress: 47 },
    { week: 'Week 4', benchPress: 77, squat: 92, deadlift: 118, overheadPress: 48 },
    { week: 'Week 5', benchPress: 80, squat: 95, deadlift: 120, overheadPress: 50 },
    { week: 'Week 6', benchPress: 82, squat: 97, deadlift: 122, overheadPress: 51 },
  ];

  const volumeData = [
    { week: 'Week 1', totalVolume: 8500, upperBody: 4200, lowerBody: 4300 },
    { week: 'Week 2', totalVolume: 9200, upperBody: 4600, lowerBody: 4600 },
    { week: 'Week 3', totalVolume: 9800, upperBody: 4900, lowerBody: 4900 },
    { week: 'Week 4', totalVolume: 10500, upperBody: 5200, lowerBody: 5300 },
    { week: 'Week 5', totalVolume: 11200, upperBody: 5500, lowerBody: 5700 },
    { week: 'Week 6', totalVolume: 11800, upperBody: 5800, lowerBody: 6000 },
  ];

  const muscleGroupData = [
    { name: 'Chest', sessions: 12, color: '#3b82f6' },
    { name: 'Back', sessions: 14, color: '#10b981' },
    { name: 'Legs', sessions: 10, color: '#f59e0b' },
    { name: 'Shoulders', sessions: 8, color: '#ef4444' },
    { name: 'Arms', sessions: 6, color: '#8b5cf6' },
  ];

  const workoutConsistency = [
    { month: 'Jan', planned: 16, completed: 14 },
    { month: 'Feb', planned: 16, completed: 15 },
    { month: 'Mar', planned: 18, completed: 16 },
    { month: 'Apr', planned: 16, completed: 16 },
    { month: 'May', planned: 18, completed: 17 },
    { month: 'Jun', planned: 16, completed: 15 },
  ];

  return (
    <div className="space-y-6">
      {/* Render charts directly without dialog wrapper */}
      <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border shadow-elevated">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
          Progress Analytics
        </h2>

        <div className="space-y-6">
          <Tabs defaultValue="strength" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-glass/30 backdrop-blur-glass">
              <TabsTrigger value="strength">Strength</TabsTrigger>
              <TabsTrigger value="volume">Volume</TabsTrigger>
              <TabsTrigger value="consistency">Consistency</TabsTrigger>
              <TabsTrigger value="muscle-groups">Muscle Groups</TabsTrigger>
            </TabsList>

            <TabsContent value="strength" className="space-y-4">
              <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <h3 className="text-lg font-semibold">Strength Progress</h3>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Bench Press</span>
                        <span className="font-medium">82 kg</span>
                      </div>
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-muted-foreground">+12 kg from start</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Squat</span>
                        <span className="font-medium">97 kg</span>
                      </div>
                      <Progress value={80} className="h-2" />
                      <p className="text-xs text-muted-foreground">+12 kg from start</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Deadlift</span>
                        <span className="font-medium">122 kg</span>
                      </div>
                      <Progress value={85} className="h-2" />
                      <p className="text-xs text-muted-foreground">+12 kg from start</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overhead Press</span>
                        <span className="font-medium">51 kg</span>
                      </div>
                      <Progress value={70} className="h-2" />
                      <p className="text-xs text-muted-foreground">+6 kg from start</p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Bench Press', current: 82, start: 70, color: 'primary' },
                  { name: 'Squat', current: 97, start: 85, color: 'secondary' },
                  { name: 'Deadlift', current: 122, start: 110, color: 'accent' },
                  { name: 'Overhead Press', current: 51, start: 45, color: 'warning' }
                ].map((lift, index) => (
                  <Card key={index} className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
                    <h4 className="font-medium text-sm mb-2">{lift.name}</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Current</span>
                        <span className="font-bold">{lift.current} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <Badge variant="secondary" className="text-xs">
                          +{lift.current - lift.start} kg
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="volume" className="space-y-4">
              <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Training Volume</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
                      <h4 className="font-medium text-sm mb-2">Total Volume</h4>
                      <p className="text-2xl font-bold text-primary">11.8k kg</p>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </Card>
                    <Card className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
                      <h4 className="font-medium text-sm mb-2">Upper Body</h4>
                      <p className="text-2xl font-bold text-secondary">5.8k kg</p>
                      <p className="text-xs text-muted-foreground">49% of total</p>
                    </Card>
                    <Card className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
                      <h4 className="font-medium text-sm mb-2">Lower Body</h4>
                      <p className="text-2xl font-bold text-accent">6.0k kg</p>
                      <p className="text-xs text-muted-foreground">51% of total</p>
                    </Card>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="consistency" className="space-y-4">
              <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold">Workout Consistency</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-success/10 border-success/20">
                      <h4 className="font-medium text-sm mb-2">This Month</h4>
                      <p className="text-2xl font-bold text-success">15/16</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </Card>
                    <Card className="p-4 bg-primary/10 border-primary/20">
                      <h4 className="font-medium text-sm mb-2">Streak</h4>
                      <p className="text-2xl font-bold text-primary">7</p>
                      <p className="text-xs text-muted-foreground">Days</p>
                    </Card>
                    <Card className="p-4 bg-warning/10 border-warning/20">
                      <h4 className="font-medium text-sm mb-2">Total</h4>
                      <p className="text-2xl font-bold text-warning">94</p>
                      <p className="text-xs text-muted-foreground">Workouts</p>
                    </Card>
                    <Card className="p-4 bg-accent/10 border-accent/20">
                      <h4 className="font-medium text-sm mb-2">Success Rate</h4>
                      <p className="text-2xl font-bold text-accent">94%</p>
                      <p className="text-xs text-muted-foreground">Average</p>
                    </Card>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="muscle-groups" className="space-y-4">
              <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-secondary" />
                  <h3 className="text-lg font-semibold">Muscle Group Distribution</h3>
                </div>
                <div className="space-y-3">
                  {muscleGroupData.map((group, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{group.name}</span>
                        <Badge variant="outline">{group.sessions} sessions</Badge>
                      </div>
                      <Progress 
                        value={(group.sessions / 14) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};