import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import toast from 'react-hot-toast';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

// Logo component matching landing page
const Logo = ({ className = "h-8 w-auto" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <svg width="28" height="28" viewBox="0 0 64 64" className="rounded-xl shadow-sm">
      <defs>
        <linearGradient id="register-gradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect rx="14" width="64" height="64" fill="url(#register-gradient)" />
      <path d="M18 44l7-24h6l7 24h-5l-1.4-5h-7.2L23 44h-5zm10.1-10h5.8L33 26.7 28.1 34z" fill="white" />
      <rect x="40" y="16" width="6" height="20" rx="2" fill="white" opacity="0.75" />
    </svg>
    <span className="font-semibold tracking-tight text-xl">Arinote</span>
  </div>
);

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, error, clearError } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      await register(email, password, name);
      toast.success('Account created successfully!');
      // Redirect to main app after successful registration
      setLocation('/');
    } catch (error) {
      // Error is already set in the auth context
      console.error('Registration error:', error);
    }
  };

  const handleBackToLanding = () => {
    setLocation('/landing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back to landing button */}
        <Button
          variant="ghost"
          className="mb-4 text-slate-600 hover:text-sky-600"
          onClick={handleBackToLanding}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Button>
        
        <Card className="rounded-2xl shadow-xl border-slate-200 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <Logo />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Create account</CardTitle>
            <CardDescription className="text-slate-600">
              Join Arinote to start creating medical documentation
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min. 8 characters)"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700 text-white shadow-sm transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
                disabled={isLoading}
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}