import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, AlertCircle, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RoleSelector from '@/components/auth/RoleSelector';
import { Turnstile, CAPTCHA_ENABLED } from '@/components/auth/Turnstile';
import type { UserRole } from '@/contexts/UserRoleContext';
import { validateEmailForRole } from '@/lib/emailDomainValidation';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen_reporter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetCaptchaToken, setResetCaptchaToken] = useState<string | null>(null);
  const [resetCaptchaKey, setResetCaptchaKey] = useState(0);
  
  const { signIn, signUp, resetPassword, updatePassword, user } = useAuth();
  const navigate = useNavigate();

  // Validate that the selected role is valid for the entered email
  const isRoleValid = useMemo(() => {
    if (!email || !email.includes('@')) return true; // Don't validate until email is entered
    const result = validateEmailForRole(email, selectedRole);
    return result.valid;
  }, [email, selectedRole]);

  useEffect(() => {
    if (user && mode !== 'reset') {
      navigate('/');
    }
  }, [user, navigate, mode]);

  const validateInputs = (isSignUp: boolean): string | null => {
    if (!email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
    if (!showForgotPassword) {
      if (!password) return 'Password is required';
      if (password.length < 6) return 'Password must be at least 6 characters';
    }
    if (isSignUp && !fullName.trim()) return 'Full name is required';
    if (isSignUp && password !== signupConfirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    const validationError = validateInputs(false);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please confirm your email before signing in. Check your inbox.');
      } else {
        setError(error.message);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    const validationError = validateInputs(true);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    // The chosen role travels in signUp's user metadata and is applied by
    // the handle_new_user() database trigger at account-creation time - a
    // client-side write here can't work because there's no session yet
    // until the user confirms their email (see migration for handle_new_user).
    const { error: signUpError } = await signUp(email.trim(), password, fullName.trim(), selectedRole);
    setLoading(false);

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('This email is already registered. Try signing in instead.');
      } else {
        setError(signUpError.message);
      }
      return;
    }
    setSuccessMessage('Account created! Please check your email to confirm your account before signing in.');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return;
    }
    
    if (CAPTCHA_ENABLED && !resetCaptchaToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email.trim(), resetCaptchaToken ?? undefined);
    setLoading(false);
    setResetCaptchaToken(null);
    setResetCaptchaKey((k) => k + 1);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage('Password reset email sent! Check your inbox for the reset link.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    if (!password) {
      setError('New password is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage('Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    }
  };


  // Password reset mode (after clicking email link)
  if (mode === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/')}
              aria-label="Back"
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Reset Password</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="mb-4 border-green-500 bg-green-50 text-green-800">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Forgot password view
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowForgotPassword(false)}
              aria-label="Back"
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Reset Password</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Forgot Password</CardTitle>
              <CardDescription>
                Enter your email to receive a password reset link
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="mb-4 border-green-500 bg-green-50 text-green-800">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <Turnstile key={resetCaptchaKey} onVerify={setResetCaptchaToken} onExpire={() => setResetCaptchaToken(null)} onError={() => setResetCaptchaToken(null)} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Back to Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
            aria-label="Back"
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Welcome to DevMapper</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full" onValueChange={() => { setError(null); setSuccessMessage(null); }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="mt-4 border-green-500 bg-green-50 text-green-800">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot your password?
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Your email domain determines available roles (e.g., .gov for government, .org for NGO)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <RoleSelector value={selectedRole} onChange={setSelectedRole} email={email} />
                  
                  <Button type="submit" className="w-full" disabled={loading || !isRoleValid}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;