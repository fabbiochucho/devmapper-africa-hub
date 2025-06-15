
export default function StatsSection() {
  return (
    <section className="py-12 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">1,247</div>
            <div className="text-muted-foreground">Projects Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">12</div>
            <div className="text-muted-foreground">African Countries</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">$45.6M</div>
            <div className="text-muted-foreground">Total Investment</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">89%</div>
            <div className="text-muted-foreground">Verification Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
}
