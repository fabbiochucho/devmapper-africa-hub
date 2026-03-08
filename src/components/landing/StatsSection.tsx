import { useDashboardStats } from "@/hooks/useDashboardStats";

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function StatsSection() {
  const { data: stats, isLoading } = useDashboardStats();

  const items = [
    { value: stats?.total_reports?.toLocaleString() ?? "—", label: "Projects Tracked", color: "text-primary" },
    { value: stats?.countries_count?.toString() ?? "—", label: "African Countries", color: "text-green-600" },
    { value: stats ? formatCurrency(stats.total_funds_raised) : "—", label: "Total Investment", color: "text-purple-600" },
    { value: stats?.total_campaigns?.toString() ?? "—", label: "Active Campaigns", color: "text-orange-600" },
  ];

  return (
    <section className="py-12 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {items.map((item, i) => (
            <div key={i} className="text-center">
              <div className={`text-3xl font-bold mb-2 ${item.color}`}>
                {isLoading ? <span className="animate-pulse">...</span> : item.value}
              </div>
              <div className="text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
