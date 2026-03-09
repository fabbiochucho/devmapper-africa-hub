import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, TrendingUp, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface BudgetAnalytics {
  sdg_goal: number;
  sdg_label: string;
  total_budget: number;
  total_spent: number;
  project_count: number;
  avg_completion: number;
}

const SDG_COLORS: Record<number, string> = {
  1: '#e5243b', 2: '#dda63a', 3: '#4c9f38', 4: '#c5192d', 5: '#ff3a21',
  6: '#26bde2', 7: '#fcc30b', 8: '#a21942', 9: '#fd6925', 10: '#dd1367',
  11: '#fd9d24', 12: '#bf8b2e', 13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b',
  16: '#00689d', 17: '#19486a',
};

export default function BudgetAnalyticsDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<BudgetAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggregateFeedback, setAggregateFeedback] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch budget analytics by SDG
      const { data: reports } = await supabase
        .from('reports')
        .select('id, sdg_goal, cost, project_status')
        .eq('user_id', user.id);

      if (reports) {
        // Group by SDG
        const sdgMap: Record<number, BudgetAnalytics> = {};

        for (const report of reports) {
          const sdg = report.sdg_goal;
          if (!sdgMap[sdg]) {
            sdgMap[sdg] = {
              sdg_goal: sdg,
              sdg_label: `SDG ${sdg}`,
              total_budget: 0,
              total_spent: 0,
              project_count: 0,
              avg_completion: 0,
            };
          }
          sdgMap[sdg].total_budget += report.cost || 0;
          sdgMap[sdg].project_count += 1;

          // Fetch budget spent from project_budgets
          const { data: budgets } = await supabase
            .from('project_budgets')
            .select('budget_spent')
            .eq('report_id', report.id);

          if (budgets) {
            sdgMap[sdg].total_spent += budgets.reduce((sum, b) => sum + (b.budget_spent || 0), 0);
          }

          // Calculate completion
          const completion = report.project_status === 'completed' ? 100 :
            report.project_status === 'in_progress' ? 50 : 10;
          sdgMap[sdg].avg_completion = 
            (sdgMap[sdg].avg_completion * (sdgMap[sdg].project_count - 1) + completion) / sdgMap[sdg].project_count;
        }

        setAnalytics(Object.values(sdgMap).sort((a, b) => b.total_budget - a.total_budget));
      }

      // Fetch aggregate citizen feedback
      const { data: feedback } = await supabase
        .from('citizen_project_feedback')
        .select('rating, is_issue_report, issue_severity, comment, report_id')
        .in('report_id', reports?.map(r => r.id) || []);

      if (feedback) {
        const totalFeedback = feedback.length;
        const positiveCount = feedback.filter(f => (f.rating || 0) >= 4).length;
        const issueCount = feedback.filter(f => f.is_issue_report).length;
        const avgRating = feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / (totalFeedback || 1);

        setAggregateFeedback({
          total_feedback: totalFeedback,
          positive_count: positiveCount,
          issue_count: issueCount,
          avg_rating: avgRating.toFixed(1),
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const totalBudget = analytics.reduce((sum, a) => sum + a.total_budget, 0);
  const totalSpent = analytics.reduce((sum, a) => sum + a.total_spent, 0);
  const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const pieData = analytics.slice(0, 5).map(a => ({
    name: a.sdg_label,
    value: a.total_budget,
    color: SDG_COLORS[a.sdg_goal] || 'hsl(var(--primary))',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Budget & Spending Analytics</h2>
        <p className="text-muted-foreground text-sm">Cross-project financial overview by SDG</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
            <Progress value={utilizationRate} className="mt-2 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{utilizationRate.toFixed(1)}% utilized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citizen Feedback</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateFeedback?.total_feedback || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg rating: {aggregateFeedback?.avg_rating || 'N/A'}/5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issue Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateFeedback?.issue_count || 0}</div>
            {(aggregateFeedback?.issue_count || 0) > 0 && (
              <Badge variant="destructive" className="text-xs mt-1">Needs attention</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget by SDG Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget Allocation by SDG</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No budget data available yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.slice(0, 8)} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={10} />
                  <YAxis type="category" dataKey="sdg_label" width={60} fontSize={10} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="total_budget" name="Budget" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="total_spent" name="Spent" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Budget Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 SDG Budget Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data to display.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SDG Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed SDG Budget Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Submit projects to see budget analytics.
            </p>
          ) : (
            <div className="space-y-2">
              {analytics.map((a) => (
                <div key={a.sdg_goal} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: SDG_COLORS[a.sdg_goal] || 'hsl(var(--primary))' }}
                    />
                    <div>
                      <p className="font-medium text-sm">{a.sdg_label}</p>
                      <p className="text-xs text-muted-foreground">{a.project_count} projects</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">${a.total_budget.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.total_budget > 0 ? ((a.total_spent / a.total_budget) * 100).toFixed(0) : 0}% spent
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
