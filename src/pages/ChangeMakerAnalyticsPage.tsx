
import ChangeMakerAnalytics from "@/components/changemaker/ChangeMakerAnalytics";
import { mockChangeMakers } from "@/data/mockChangeMakers";

const ChangeMakerAnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Change Maker Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive analytics and insights about change makers across Africa
        </p>
      </div>
      <ChangeMakerAnalytics changeMakers={mockChangeMakers} />
    </div>
  );
};

export default ChangeMakerAnalyticsPage;
