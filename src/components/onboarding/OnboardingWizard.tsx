import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Building2, Users, Briefcase, Heart, MapPin, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { africanCountries } from "@/data/countries";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

const ROLES = [
  { value: "citizen_reporter", label: "Citizen Reporter", description: "Track community projects", icon: User },
  { value: "ngo_member", label: "NGO Member", description: "Manage organization projects", icon: Users },
  { value: "government_official", label: "Government Official", description: "Oversee public projects", icon: Building2 },
  { value: "company_representative", label: "Corporate", description: "ESG & sustainability reporting", icon: Briefcase },
  { value: "change_maker", label: "Change Maker", description: "Lead community initiatives", icon: Heart },
];

const OnboardingWizard = ({ open, onComplete }: OnboardingWizardProps) => {
  const { session } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [country, setCountry] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step === 1 && !fullName) {
      toast.error("Please enter your name");
      return;
    }
    if (step === 2 && !country) {
      toast.error("Please select your country");
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          organization: organization || null,
          country,
        })
        .eq("user_id", session?.user?.id);

      if (profileError) throw profileError;

      // Add role
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: session?.user?.id,
          role: selectedRole as any,
          is_active: true,
        }, {
          onConflict: "user_id,role"
        });

      if (roleError) throw roleError;

      toast.success("Profile setup complete!");
      onComplete();
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to DevMapper!</DialogTitle>
          <DialogDescription>
            Let's set up your profile in a few quick steps
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-2 mb-4" />

        <div className="space-y-6 py-4">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Tell us about yourself
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="organization">Organization (optional)</Label>
                  <Input
                    id="organization"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Company, NGO, or government body"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Where are you based?
              </h3>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Role Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                What best describes you?
              </h3>

              <div className="grid gap-3">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                      selectedRole === role.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      selectedRole === role.value ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <role.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{role.label}</p>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    {selectedRole === role.value && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                You can add more roles later in Settings
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${
                  s === step ? "bg-primary" : s < step ? "bg-primary/50" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <Button onClick={handleNext} disabled={loading}>
            {step === totalSteps ? (
              loading ? "Saving..." : "Complete"
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
