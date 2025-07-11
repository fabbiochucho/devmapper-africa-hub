
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Download, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/UserRoleContext";
import { getCorporateTargets, addCorporateEsgTarget, updateCorporateTarget, CorporateTarget } from "@/data/mockCorporateTargets";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const CorporateTargets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ["corporateTargets"],
    queryFn: getCorporateTargets,
    enabled: !!user,
  });

  const [isAddingTarget, setIsAddingTarget] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<CorporateTarget | null>(null);

  const [newTarget, setNewTarget] = useState({
    sdgGoal: "",
    title: "",
    description: "",
    targetValue: "",
    targetUnit: "",
    targetDate: "",
    countryCode: "",
    region: "",
  });

  const [progressUpdate, setProgressUpdate] = useState({
    value: "",
    notes: "",
  });

  const createTargetMutation = useMutation({
    mutationFn: addCorporateEsgTarget,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["corporateTargets"] });
      toast.success("ESG Target Created", { description: `Successfully created target: "${data.title}"` });
      setIsAddingTarget(false);
      setNewTarget({ sdgGoal: "", title: "", description: "", targetValue: "", targetUnit: "", targetDate: "", countryCode: "", region: "" });
    },
    onError: () => {
      toast.error("Failed to create target");
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: updateCorporateTarget,
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["corporateTargets"] });
        toast.success("Progress Updated", { description: `Successfully updated progress for: "${data.title}"` });
        setIsUpdatingProgress(false);
        setSelectedTarget(null);
        setProgressUpdate({ value: "", notes: "" });
      }
    },
    onError: () => {
      toast.error("Failed to update progress");
    },
  });

  const handleCreateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    createTargetMutation.mutate(newTarget);
  };

  const handleUpdateProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget) return;
    updateProgressMutation.mutate({ targetId: selectedTarget.id, progressData: progressUpdate });
  };

  const generateEsgReport = async () => {
    toast.info("Generating Report...", { description: "This feature is for demonstration purposes." });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-blue-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getSdgColor = (goal: number) => {
    const colors: Record<number, string> = { 1: "#E5243B", 2: "#DDA63A", 3: "#4C9F38", 4: "#C5192D", 5: "#FF3A21", 6: "#26BDE2", 7: "#FCC30B", 8: "#A21942", 9: "#FD6925", 10: "#DD1367", 11: "#FD9D24", 12: "#BF8B2E", 13: "#3F7E44", 14: "#0A97D9", 15: "#56C02B", 16: "#00689D", 17: "#19486A" };
    return colors[goal] || "#666666";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">This dashboard is only available to Company Representatives.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Corporate Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Building className="w-6 h-6" />
              ESG Dashboard - {user.email || 'Corporate Dashboard'}
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddingTarget(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Target
              </Button>
              <Button variant="outline" onClick={generateEsgReport} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{targets.length}</div>
              <div className="text-sm text-gray-600">Active Targets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{targets.filter((t: any) => t.progress >= 80).length}</div>
              <div className="text-sm text-gray-600">On Track</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(targets.reduce((sum: number, t: any) => sum + t.progress, 0) / (targets.length || 1))}%
              </div>
              <div className="text-sm text-gray-600">Avg Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {[...new Set(targets.map(t => t.sdgGoal))].length}
              </div>
              <div className="text-sm text-gray-600">SDG Goals</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ESG Targets */}
      <Tabs defaultValue="targets" className="w-full">
        <TabsList>
          <TabsTrigger value="targets">ESG Targets</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          <TabsTrigger value="impact">Impact Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="targets">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {targets.map((target: any) => (
              <Card key={target.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getSdgColor(target.sdgGoal) }} />
                      <CardTitle className="text-lg">{target.title}</CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTarget(target);
                        setProgressUpdate({ value: target.currentValue.toString(), notes: "" });
                        setIsUpdatingProgress(true);
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">{target.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {target.progress}% ({target.currentValue.toLocaleString()} / {target.targetValue.toLocaleString()} {target.targetUnit})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(target.progress)}`}
                          style={{ width: `${target.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>SDG {target.sdgGoal}.{target.sdgTarget}</span>
                      <span>Target: {new Date(target.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
             {targets.length === 0 && <p className="text-center text-muted-foreground col-span-full py-8">No targets found. Click "Add Target" to get started.</p>}
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader><CardTitle>Progress Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-6">
                {targets.map((target: any) => (
                  <div key={target.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">{target.title}</h3>
                    <div className="space-y-3">
                      {target.progressHistory?.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div>
                            <span className="font-medium">{entry.value.toLocaleString()} {target.targetUnit}</span>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{entry.notes}</p>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(entry.recordedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                       {(!target.progressHistory || target.progressHistory.length === 0) && <p className="text-sm text-muted-foreground">No progress history for this target.</p>}
                    </div>
                  </div>
                ))}
                {targets.length === 0 && <p className="text-center text-muted-foreground py-8">No targets to track.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact">
           <Card>
            <CardHeader><CardTitle>Impact Metrics (Demo)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg"><div className="text-2xl font-bold text-blue-600">45,000</div><div className="text-sm text-gray-600">People Reached</div></div>
                <div className="text-center p-4 border rounded-lg"><div className="text-2xl font-bold text-green-600">1,200</div><div className="text-sm text-gray-600">Jobs Created</div></div>
                <div className="text-center p-4 border rounded-lg"><div className="text-2xl font-bold text-purple-600">850t</div><div className="text-sm text-gray-600">CO₂ Reduced</div></div>
                <div className="text-center p-4 border rounded-lg"><div className="text-2xl font-bold text-orange-600">$2.5M</div><div className="text-sm text-gray-600">Investment</div></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Target Modal */}
      <Dialog open={isAddingTarget} onOpenChange={setIsAddingTarget}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New ESG Target</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateTarget} className="space-y-4 py-4">
            <div>
              <Label htmlFor="target-sdg">SDG Goal</Label>
              <Select value={newTarget.sdgGoal} onValueChange={(value) => setNewTarget((prev) => ({ ...prev, sdgGoal: value }))}>
                <SelectTrigger><SelectValue placeholder="Select SDG Goal" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 17 }, (_, i) => i + 1).map((goal) => (<SelectItem key={goal} value={goal.toString()}>SDG {goal}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="target-title">Target Title</Label>
              <Input id="target-title" value={newTarget.title} onChange={(e) => setNewTarget((prev) => ({ ...prev, title: e.target.value }))} placeholder="e.g., Clean Water Access" required/>
            </div>
            <div>
              <Label htmlFor="target-description">Description</Label>
              <Textarea id="target-description" value={newTarget.description} onChange={(e) => setNewTarget((prev) => ({ ...prev, description: e.target.value }))} placeholder="Describe your ESG target..." rows={3}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target-value">Target Value</Label>
                <Input id="target-value" type="number" value={newTarget.targetValue} onChange={(e) => setNewTarget((prev) => ({ ...prev, targetValue: e.target.value }))} placeholder="1000" required/>
              </div>
              <div>
                <Label htmlFor="target-unit">Unit</Label>
                <Input id="target-unit" value={newTarget.targetUnit} onChange={(e) => setNewTarget((prev) => ({ ...prev, targetUnit: e.target.value }))} placeholder="people, MW, tons" required />
              </div>
            </div>
            <div>
              <Label htmlFor="target-date">Target Date</Label>
              <Input id="target-date" type="date" value={newTarget.targetDate} onChange={(e) => setNewTarget((prev) => ({ ...prev, targetDate: e.target.value }))} required/>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddingTarget(false)}>Cancel</Button>
              <Button type="submit" disabled={createTargetMutation.isPending}>{createTargetMutation.isPending ? "Creating..." : "Create Target"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Progress Modal */}
      <Dialog open={isUpdatingProgress} onOpenChange={setIsUpdatingProgress}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Update Progress - {selectedTarget?.title}</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateProgress} className="space-y-4 py-4">
            <div>
              <Label htmlFor="progress-value">Current Value ({selectedTarget?.targetUnit})</Label>
              <Input id="progress-value" type="number" value={progressUpdate.value} onChange={(e) => setProgressUpdate((prev) => ({ ...prev, value: e.target.value }))} placeholder={`Current: ${selectedTarget?.currentValue || 0}`} required/>
              <p className="text-sm text-gray-600 mt-1">Target: {selectedTarget?.targetValue.toLocaleString()} {selectedTarget?.targetUnit}</p>
            </div>
            <div>
              <Label htmlFor="progress-notes">Progress Notes</Label>
              <Textarea id="progress-notes" value={progressUpdate.notes} onChange={(e) => setProgressUpdate((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Describe the progress made..." rows={3}/>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsUpdatingProgress(false)}>Cancel</Button>
              <Button type="submit" disabled={updateProgressMutation.isPending}>{updateProgressMutation.isPending ? "Updating..." : "Update Progress"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CorporateTargets;
