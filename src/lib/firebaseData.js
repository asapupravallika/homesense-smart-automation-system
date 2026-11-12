import { onValue, ref, set } from "firebase/database";
import { database } from "../firebase";

// Send an ON/OFF command to the ESP32 through Firebase.
export async function sendDeviceCommand(device, state) {
  if (!["fan1", "light1"].includes(device)) {
    throw new Error("Unknown device.");
  }

  await set(
    ref(database, `commands/${device}/state`),
    Boolean(state)
  );
}

// Subscribe to a specific Firebase path.
export function subscribeToPath(path, callback, onError) {
  return onValue(
    ref(database, path),
    snapshot => callback(snapshot.val()),
    error => onError?.(error)
  );
}

// Subscribe to the complete HomeSense database.
export function subscribeToHome(callback, onError) {
  return onValue(
    ref(database),
    snapshot => callback(snapshot.val()),
    error => onError?.(error)
  );
}