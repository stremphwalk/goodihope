import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';

interface JoinGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JoinGroupModal({ open, onClose, onSuccess }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanCode = inviteCode.replace(/\s/g, '').toUpperCase();
    
    if (cleanCode.length !== 6) {
      toast({
        title: "Error",
        description: "Invite code must be exactly 6 characters",
        variant: "destructive"
      });
      return;
    }

    if (!auth.session?.access_token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.session.access_token}`
        },
        body: JSON.stringify({
          inviteCode: cleanCode
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Joined group!",
          description: `Welcome to ${data.group.name}`,
        });
        setInviteCode('');
        onSuccess();
      } else {
        const error = await response.json();
        let errorMessage = "Failed to join group";
        
        if (response.status === 404) {
          errorMessage = "Invalid invite code or group has expired";
        } else if (response.status === 409) {
          errorMessage = error.error || "Already in a group or group is full";
        } else if (error.error) {
          errorMessage = error.error;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setInviteCode('');
      onClose();
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '').toUpperCase();
    if (value.length <= 6) {
      setInviteCode(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white opacity-100 border border-gray-300 shadow-xl backdrop-blur-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Join Team Group
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="inviteCode">6-Character Invite Code</Label>
            <Input
              id="inviteCode"
              value={inviteCode}
              onChange={handleCodeChange}
              placeholder="ABC123"
              maxLength={6}
              disabled={loading}
              className="mt-1 font-mono text-center text-lg tracking-widest"
              style={{ letterSpacing: '0.5em' }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the code shared by your team leader or colleague
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Joining a group:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• You can only be in one group at a time</li>
              <li>• If you're already in a group, you'll leave it automatically</li>
              <li>• You can leave and join different groups anytime</li>
              <li>• Groups expire after 7 days</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || inviteCode.length !== 6}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Group'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}