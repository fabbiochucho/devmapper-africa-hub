import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SDG_OPTIONS } from "@/data/fundraisingOptions";

interface FundraisingFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (value: string) => void;
  filterSDG: string;
  onFilterSDGChange: (value: string) => void;
}

export const FundraisingFilters = ({
  searchTerm, onSearchTermChange,
  filterStatus, onFilterStatusChange,
  filterCategory, onFilterCategoryChange,
  filterSDG, onFilterSDGChange,
}: FundraisingFiltersProps) => (
  <div className="flex flex-col sm:flex-row gap-3">
    <div className="relative flex-1">
      <Input
        placeholder="Search campaigns by title, description, or location..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
      />
    </div>
    <Select value={filterStatus} onValueChange={onFilterStatusChange}>
      <SelectTrigger className="w-full sm:w-40">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
        <SelectItem value="expired">Expired</SelectItem>
      </SelectContent>
    </Select>
    <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue placeholder="Category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        <SelectItem value="nano">Nano Grants (&lt;$1K)</SelectItem>
        <SelectItem value="micro">Micro Grants ($1K-$10K)</SelectItem>
        <SelectItem value="small">Small Grants ($10K+)</SelectItem>
      </SelectContent>
    </Select>
    <Select value={filterSDG} onValueChange={onFilterSDGChange}>
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue placeholder="Filter by SDG" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All SDGs</SelectItem>
        {SDG_OPTIONS.map(sdg => (
          <SelectItem key={sdg.value} value={sdg.value.toString()}>
            {sdg.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
