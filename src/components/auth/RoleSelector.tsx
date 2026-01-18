import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, Users, Building2, Briefcase, Heart, 
  AlertCircle, CheckCircle2, Info
} from "lucide-react";
import type { UserRole } from "@/contexts/UserRoleContext";
import { 
  validateEmailForRole, 
  getRoleConfig, 
  getSuggestedRoleForEmail,
  roleDomainConfigs 
} from "@/lib/emailDomainValidation";

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  email?: string;
}

const roleIcons: Record<UserRole, typeof User> = {
  citizen_reporter: User,
  ngo_member: Users,
  government_official: Building2,
  company_representative: Briefcase,
  change_maker: Heart,
  admin: User,
  country_admin: User,
  platform_admin: User,
};

const roleFeatures: Record<UserRole, string[]> = {
  citizen_reporter: ["Submit Reports", "Community Forum", "View Analytics"],
  ngo_member: ["NGO Dashboard", "Project Analytics", "Impact Reports"],
  government_official: ["Government Dashboard", "National Analytics", "Policy Tracking"],
  company_representative: ["Corporate Dashboard", "ESG Module", "Corporate Targets"],
  change_maker: ["Change Maker Profile", "Fundraising", "Impact Analytics"],
  admin: ["Admin Dashboard", "User Management", "All Features"],
  country_admin: ["Country Admin", "Regional Data", "All Features"],
  platform_admin: ["Platform Admin", "System Settings", "All Features"],
};

const RoleSelector = ({ value, onChange, email = '' }: RoleSelectorProps) => {
  const [validationErrors, setValidationErrors] = useState<Record<UserRole, string>>({} as Record<UserRole, string>);
  const [suggestedRole, setSuggestedRole] = useState<UserRole | null>(null);

  // Available roles for users to select (excluding admin roles)
  const selectableRoles: UserRole[] = [
    'citizen_reporter',
    'ngo_member',
    'government_official',
    'company_representative',
    'change_maker'
  ];

  useEffect(() => {
    if (email && email.includes('@')) {
      // Validate all roles for this email
      const errors: Record<UserRole, string> = {} as Record<UserRole, string>;
      
      for (const role of selectableRoles) {
        const result = validateEmailForRole(email, role);
        if (!result.valid) {
          errors[role] = result.message;
        }
      }
      
      setValidationErrors(errors);
      
      // Suggest the best role based on email domain
      const suggested = getSuggestedRoleForEmail(email);
      setSuggestedRole(suggested);
      
      // If current selection is invalid, switch to suggested role
      if (errors[value] && !errors[suggested]) {
        onChange(suggested);
      }
    } else {
      setValidationErrors({} as Record<UserRole, string>);
      setSuggestedRole(null);
    }
  }, [email, value, onChange]);

  const currentValidation = email ? validateEmailForRole(email, value) : { valid: true, message: '' };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Select Your Role</Label>
      
      {email && suggestedRole && suggestedRole !== value && !validationErrors[suggestedRole] && (
        <Alert className="border-primary/50 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Based on your email, we suggest: <strong>{getRoleConfig(suggestedRole)?.label}</strong>
          </AlertDescription>
        </Alert>
      )}
      
      {!currentValidation.valid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {currentValidation.message}
          </AlertDescription>
        </Alert>
      )}
      
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as UserRole)}
        className="grid gap-3"
      >
        {selectableRoles.map((role) => {
          const config = getRoleConfig(role);
          const Icon = roleIcons[role];
          const isSelected = value === role;
          const hasError = !!validationErrors[role];
          const isSuggested = suggestedRole === role;
          const features = roleFeatures[role] || [];
          
          return (
            <div key={role}>
              <RadioGroupItem
                value={role}
                id={role}
                className="sr-only"
                disabled={hasError && email.includes('@')}
              />
              <Label
                htmlFor={role}
                className={`cursor-pointer block ${hasError && email.includes('@') ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Card className={`transition-all ${
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : hasError && email.includes('@')
                    ? "border-destructive/30 bg-destructive/5"
                    : isSuggested
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : hasError && email.includes('@')
                          ? "bg-destructive/20 text-destructive"
                          : "bg-muted"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{config?.label}</span>
                          {isSelected && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Selected
                            </span>
                          )}
                          {isSuggested && !isSelected && !hasError && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          )}
                          {hasError && email.includes('@') && (
                            <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {config?.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1 italic">
                          {config?.domainHint}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {features.map((feature) => (
                            <span 
                              key={feature}
                              className="text-[10px] bg-muted px-1.5 py-0.5 rounded"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
      <p className="text-xs text-muted-foreground">
        Role availability depends on your email domain. You can request additional roles from settings.
      </p>
    </div>
  );
};

export default RoleSelector;
