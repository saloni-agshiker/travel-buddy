import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const DESTINATIONS = [
  { label: "All Destinations", value: "ALL" },
  { label: "Atlanta, GA", value: "ATL" },
  { label: "Newark, NJ", value: "EWR" },
  { label: "Dallas, TX", value: "DFW" },
  { label: "Los Angeles, CA", value: "LAX" },
  { label: "Orlando, FL", value: "MCO" },
  { label: "Delhi, India", value: "DEL" },
];


const TRANSPORT_MODES = [
  { label: "All transport modes", value: "ALL" },
  { label: "Personal car", value: "Personal car" },
  { label: "Rideshare", value: "Rideshare" } ,
  { label: "Public transit", value: "Public transit" },
  { label: "Other", value: "Other" }
];

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedDestination,
  onDestinationChange,
  selectedTransportMode,
  onSelectedTransportMode
}) {
  return (
    <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, destination, or interests..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Filters:</span>
          </div>

          <Select value={selectedDestination} onValueChange={onDestinationChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Destination" />
            </SelectTrigger>
            <SelectContent>
              {DESTINATIONS.map((dest) => (
                <SelectItem key={dest.value} value={dest.value}>
                  {dest.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTransportMode} onValueChange={onSelectedTransportMode}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Mode of Transport" />
            </SelectTrigger>
            <SelectContent>
              {TRANSPORT_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
