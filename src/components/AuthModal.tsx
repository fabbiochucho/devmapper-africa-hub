
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import SignInForm from "./auth/SignInForm";
import SignUpForm from "./auth/SignUpForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: any, token: string) => void;
}

const AuthModal = ({ isOpen, onClose, onAuthSuccess }: AuthModalProps) => {
  const [isSigningUp, setIsSigningUp] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isSigningUp ? "Create an Account" : "Sign In"}</DialogTitle>
          <DialogDescription>
            {isSigningUp ? "Join DevMapper to start tracking projects." : "Access your DevMapper dashboard."}
          </DialogDescription>
        </DialogHeader>
        {isSigningUp ? (
          <SignUpForm onAuthSuccess={onAuthSuccess} />
        ) : (
          <SignInForm onAuthSuccess={onAuthSuccess} />
        )}
        <div className="mt-4 text-center text-sm">
          {isSigningUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsSigningUp(!isSigningUp)} className="font-medium text-primary hover:underline">
            {isSigningUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
