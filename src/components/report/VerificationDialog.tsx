
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface VerificationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'confirm' | 'dispute';
  onSubmit: (notes?: string) => void;
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({ isOpen, onOpenChange, action, onSubmit }) => {
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onSubmit(notes);
    setNotes(''); // Clear notes after submission
  };

  const title = action === 'confirm' ? 'Confirm Project Verification' : 'Dispute Project Verification';
  const description = action === 'confirm'
    ? 'You are about to confirm this project. You can add optional notes below.'
    : 'You are about to dispute this project. Please provide a reason or notes if possible.';

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="verification-notes">Notes (Optional)</Label>
          <Textarea
            id="verification-notes"
            placeholder="Add any relevant notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setNotes('')}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit}>
            {action === 'confirm' ? 'Confirm' : 'Dispute'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default VerificationDialog;
