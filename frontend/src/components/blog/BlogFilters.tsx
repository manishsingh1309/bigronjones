
import { Search } from "lucide-react";

const categories = [
  "All",
  "Fitness",
  "Nutrition",
  "Mindset",
  "Family",
  "Recovery",
  "Motivation",
];

interface BlogFiltersProps {
  activeCategory: string;
  searchQuery: string;
  onCategoryChange: (cat: string) => void;
  onSearchChange: (q: string) => void;
}

export default function BlogFilters({
  activeCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
}: BlogFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 font-body ${
              activeCategory === cat
                ? "bg-brand-red text-white"
                : "border border-white/10 text-brand-gray-light hover:border-brand-blue/40 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray"
        />
        <input
          type="text"
          placeholder="Search Ron's posts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-full border border-white/10 bg-[#111827] py-2.5 pl-10 pr-4 text-sm text-white placeholder-brand-gray outline-none transition-colors focus:border-brand-red font-body sm:w-64"
        />
      </div>
    </div>
  );
}
