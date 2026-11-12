import { Droplets, Thermometer } from "lucide-react";

export default function SensorCard({ type, value, unit, label }) {
  const Icon = type === "temperature" ? Thermometer : Droplets;
  const numeric = Number(value);
  const shown = value === null || value === undefined || value === "" || Number.isNaN(numeric) ? "--" : numeric.toFixed(1);
  return (
    <article className="sensor-card">
      <div className={`sensor-icon ${type}`}><Icon size={20} /></div>
      <div className="sensor-copy"><span>{label}</span><strong>{shown}<small>{unit}</small></strong></div>
      <span className="sensor-live"><i /> LIVE</span>
    </article>
  );
}
