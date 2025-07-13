import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Home, 
  Play, 
  Calendar, 
  Edit3, 
  User, 
  Settings,
  LogOut,
  BarChart3,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onNavigate: (page: string) => void;
  userName: string;
  currentPage: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, userName, currentPage }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', action: () => onNavigate('dashboard') },
    { id: 'workout', icon: Play, label: 'Start Workout', action: () => onNavigate('workout') },
    { id: 'view-plan', icon: Calendar, label: 'View Schedule', action: () => onNavigate('view-schedule') },
    { id: 'modify', icon: Edit3, label: 'Modify Plan', action: () => onNavigate('modify-schedule') },
    { id: 'progress', icon: BarChart3, label: 'Progress Charts', action: () => onNavigate('progress-charts') },
    { id: 'prs', icon: Trophy, label: 'View PRs', action: () => onNavigate('view-prs') },
  ];

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 h-full bg-glass/95 backdrop-blur-glass border-r border-glass-border shadow-elevated z-40 transition-all duration-300",
        isExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        
        {/* Logo */}
        <div className="p-4 border-b border-glass-border">
          <div className={cn(
            "flex items-center gap-3 transition-all duration-300",
            !isExpanded && "justify-center"
          )}>
            <div className="w-8 h-8 bg-gradient-to-r from-accent to-accent-glow rounded-lg flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-sm">FT</span>
            </div>
            {isExpanded && (
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                FitTracker Pro
              </span>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4">
          <nav className="space-y-2 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-12 transition-all duration-300",
                    !isExpanded && "px-3 justify-center",
                    isActive && "bg-primary/20 text-primary border-primary/30"
                  )}
                  onClick={item.action}
                >
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isExpanded && "mr-3"
                  )} />
                  {isExpanded && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Update Metrics Button */}
        <div className="px-2 pb-2">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start h-12 transition-all duration-300",
              !isExpanded && "px-3 justify-center"
            )}
            onClick={() => onNavigate('update-metrics')}
          >
            <Settings className={cn(
              "w-5 h-5 flex-shrink-0",
              isExpanded && "mr-3"
            )} />
            {isExpanded && (
              <span className="truncate">Update Metrics</span>
            )}
          </Button>
        </div>

        {/* Account Section */}
        <div className="p-4 border-t border-glass-border">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-12 transition-all duration-300",
              !isExpanded && "px-3 justify-center"
            )}
            onClick={() => onNavigate('account')}
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isExpanded && (
              <div className="ml-3 text-left truncate">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground">View Account</p>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};