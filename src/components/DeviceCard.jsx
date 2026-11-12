
import {
  Fan,
  Lightbulb,
  Wifi,
  WifiOff,
  Power
} from "lucide-react";

export default function DeviceCard({
  type,
  title,
  state,
  isOnline,
  onToggle,
  pending
}) {
  const isFan = type === "fan";
  const Icon = isFan ? Fan : Lightbulb;

  return (
    <article className={`device-card ${state ? "device-on" : ""}`}>

      <div className="device-card-top">

        <div
          className={`device-icon ${
            isFan ? "fan-icon" : "light-icon"
          } ${state && isFan ? "fan-spinning" : ""}`}
        >
          <Icon size={25} strokeWidth={1.8} />
        </div>

        <span className={`connection ${
          isOnline ? "connected" : "disconnected"
        }`}>
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          {isOnline ? "Online" : "Offline"}
        </span>

      </div>


      <div className="device-info">

        <h3>{title}</h3>

        <p>
          {pending
            ? "Waiting for ESP32 confirmation..."
            : state
              ? "Currently switched on"
              : "Currently switched off"}
        </p>

      </div>


      <div className="device-card-bottom">

        <div>
          <span className={`state-dot ${state ? "dot-on" : ""}`} />

          <strong>
            {pending ? "WAITING" : state ? "ON" : "OFF"}
          </strong>
        </div>


        <button
          className={`power-button ${state ? "power-active" : ""}`}
          onClick={onToggle}
          disabled={pending}
          aria-label={`${state ? "Turn off" : "Turn on"} ${title}`}
          title={
            !isOnline
              ? "ESP32 is offline; command will still be sent"
              : undefined
          }
        >

          {pending
            ? <span className="mini-spinner" />
            : <Power size={19} />}

          <span>
            {pending
              ? "Waiting..."
              : state
                ? "Turn off"
                : "Turn on"}
          </span>

        </button>

      </div>

    </article>
  );
}
