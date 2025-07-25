import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from 'react-oidc-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar } from 'lucide-react';

interface AddEventFormProps {
  groupId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddEventForm({ groupId, onClose, onSuccess }: AddEventFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: ''
  });
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  // Get today's date for minimum date validation
  const today = new Date().toISOString().split('T')[0];
  
  // Get 7 days from now for maximum date (group expiry)
  const maxDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.eventDate) {
      toast({
        title: "Error",
        description: "Event date is required",
        variant: "destructive"
      });
      return;
    }

    if (!auth.user?.id_token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive"
      });
      return;
    }

    // Combine date and time
    let eventDateTime = formData.eventDate;
    if (formData.eventTime) {
      eventDateTime += `T${formData.eventTime}:00`;
    } else {
      eventDateTime += 'T09:00:00'; // Default to 9 AM if no time specified
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user.id_token}`
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          eventDate: eventDateTime
        })
      });

      if (response.ok) {
        toast({
          title: "Event added!",
          description: "Event has been added to the group calendar",
        });
        setFormData({ title: '', description: '', eventDate: '', eventTime: '' });
        onSuccess();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add event",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add event",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ title: '', description: '', eventDate: '', eventTime: '' });
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white opacity-100 border border-gray-300 shadow-xl backdrop-blur-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Add Calendar Event
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Team Meeting"
              maxLength={100}
              disabled={loading}
              className="mt-1"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="eventDate">Date *</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                min={today}
                max={maxDate}
                disabled={loading}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="eventTime">Time (Optional)</Label>
              <Input
                id="eventTime"
                type="time"
                value={formData.eventTime}
                onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                disabled={loading}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about the event..."
              maxLength={300}
              disabled={loading}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">
              Events can only be scheduled within the group's 7-day lifespan. 
              If no time is specified, it defaults to 9:00 AM.
            </p>
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
              disabled={loading || !formData.title.trim() || !formData.eventDate}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}