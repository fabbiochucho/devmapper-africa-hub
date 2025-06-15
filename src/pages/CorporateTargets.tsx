
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CorporateTarget, getCorporateTargets } from '@/data/mockCorporateTargets';
import AddTargetDialog from '@/components/targets/AddTargetDialog';
import { PlusCircle } from 'lucide-react';

const CorporateTargets = () => {
  const [targets, setTargets] = useState<CorporateTarget[]>([]);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    const fetchTargets = async () => {
      const data = await getCorporateTargets();
      setTargets(data);
    };
    fetchTargets();
  }, []);

  const handleTargetAdded = (newTarget: CorporateTarget) => {
    setTargets(prevTargets => [...prevTargets, newTarget].sort((a, b) => a.id - b.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold">Corporate ESG Targets</h1>
            <p className="text-muted-foreground">Track and manage your company's ESG goals.</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Target
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracked Targets</CardTitle>
          <CardDescription>
            An overview of all active corporate environmental, social, and governance targets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Target</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.length > 0 ? targets.map((target) => (
                <TableRow key={target.id}>
                  <TableCell>
                    <div className="font-medium">{target.title}</div>
                    <div className="text-sm text-muted-foreground">{target.metric}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={target.progress} className="w-[100px]" />
                      <span>{target.progress}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {target.currentValue} / {target.targetValue} {target.targetUnit}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(target.deadline).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {new Date(target.updatedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No targets found. Get started by adding a new target.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddTargetDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        onTargetAdded={handleTargetAdded}
      />
    </div>
  );
};

export default CorporateTargets;

