
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/AuthService';

interface SignInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInComplete: () => void;
}

export const SignInDialog: React.FC<SignInDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSignInComplete 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      await authService.signUp(email, password);
      
      toast({
        title: "Account Created Successfully! 🎉",
        description: `Welcome to FitTracker Pro!`,
      });
      
      onSignInComplete();
      onClose();
    } catch (error: any) {
      console.error('Sign up error:', error);
      setErrors({ general: error.message || 'Failed to create account. Please try again.' });
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'email':
        setEmail(value);
        if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
        break;
      case 'password':
        setPassword(value);
        if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-glass/95 backdrop-blur-glass border-glass-border shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Create Your Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-2">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-accent to-accent-glow rounded-full flex items-center justify-center mx-auto">
              <UserPlus className="w-8 h-8 text-accent-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Join thousands of fitness enthusiasts on their journey to better health
            </p>
          </div>

          {errors.general && (
            <Alert className="py-2">
              <AlertDescription className="text-sm text-destructive">
                {errors.general}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`transition-all duration-300 ${
                  errors.email ? 'border-destructive' : ''
                }`}
                autoComplete="off"
              />
              {errors.email && (
                <Alert className="py-2">
                  <AlertDescription className="text-sm text-destructive">
                    {errors.email}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`pr-10 transition-all duration-300 ${
                    errors.password ? 'border-destructive' : ''
                  }`}
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <Alert className="py-2">
                  <AlertDescription className="text-sm text-destructive">
                    {errors.password}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`pr-10 transition-all duration-300 ${
                    errors.confirmPassword ? 'border-destructive' : ''
                  }`}
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <Alert className="py-2">
                  <AlertDescription className="text-sm text-destructive">
                    {errors.confirmPassword}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Password Match Indicator */}
          {password && confirmPassword && (
            <div className="flex items-center gap-2 text-sm">
              {password === confirmPassword ? (
                <>
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-success">Passwords match</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span className="text-destructive">Passwords don't match</span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleSignUp}
              disabled={isLoading || !email || !password || !confirmPassword || password !== confirmPassword}
              className="w-full"
              variant="accent"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
