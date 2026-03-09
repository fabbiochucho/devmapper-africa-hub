import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SessionTimeoutWarning() {
  const { showWarning, remainingSeconds, extendSession } = useSessionTimeout();
  const { signOut } = useAuth();

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <Dialog open={showWarning}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription>
            Your session will expire in{' '}
            <span className="font-mono font-bold text-foreground">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>{' '}
            due to inactivity. Would you like to stay signed in?
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={() => signOut()} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
          <Button onClick={extendSession} className="gap-2">
            Stay Signed In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
