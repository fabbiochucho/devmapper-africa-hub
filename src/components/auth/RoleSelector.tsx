import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, Users, Building2, Briefcase, Heart, 
  FileText, BarChart3, Target, Leaf, Globe
} from "lucide-react";
import type { UserRole } from "@/contexts/UserRoleContext";

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

const roleOptions: Array<{
  value: UserRole;
  label: string;
  description: string;
  icon: typeof User;
  features: string[];
}> = [
  {
    value: "citizen_reporter",
    label: "Citizen Reporter",
    description: "Report SDG projects in your community",
    icon: User,
    features: ["Submit Reports", "Community Forum", "View Analytics"]
  },
  {
    value: "ngo_member",
    label: "NGO Member",
    description: "Manage NGO projects and impact",
    icon: Users,
    features: ["NGO Dashboard", "Project Analytics", "Impact Reports"]
  },
  {
    value: "government_official",
    label: "Government Official",
    description: "Track national SDG progress",
    icon: Building2,
    features: ["Government Dashboard", "National Analytics", "Policy Tracking"]
  },
  {
    value: "company_representative",
    label: "Corporate Representative",
    description: "Manage corporate sustainability",
    icon: Briefcase,
    features: ["Corporate Dashboard", "ESG Module", "Corporate Targets"]
  },
  {
    value: "change_maker",
    label: "Change Maker",
    description: "Lead grassroots impact initiatives",
    icon: Heart,
    features: ["Change Maker Profile", "Fundraising", "Impact Analytics"]
  },
];

const RoleSelector = ({ value, onChange }: RoleSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Select Your Role</Label>
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as UserRole)}
        className="grid gap-3"
      >
        {roleOptions.map((role) => {
          const Icon = role.icon;
          const isSelected = value === role.value;
          
          return (
            <div key={role.value}>
              <RadioGroupItem
                value={role.value}
                id={role.value}
                className="sr-only"
              />
              <Label
                htmlFor={role.value}
                className={`cursor-pointer block`}
              >
                <Card className={`transition-all ${
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border hover:border-primary/50"
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{role.label}</span>
                          {isSelected && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {role.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {role.features.map((feature) => (
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
        You can add more roles later from your settings.
      </p>
    </div>
  );
};

export default RoleSelector;
