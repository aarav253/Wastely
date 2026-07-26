import { MapPin, ChevronDown } from "lucide-react";
import { US_STATES } from "../lib/location";

interface LocationSelectorProps {
  value: string;
  onChange: (state: string) => void;
}

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  return (
    <label className="location-selector">
      <MapPin size={13} />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Your state">
        <option value="">General (US-wide rules)</option>
        {US_STATES.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="location-selector-caret" />
    </label>
  );
}
