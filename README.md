# HomeSense React Dashboard

A responsive React + Vite smart-home dashboard connected to Firebase Realtime Database and Firebase Authentication. It is designed to work with the ESP32/Wokwi data structure:

- `commands/fan1/state`
- `commands/light1/state`
- `devices/fan1/state`
- `devices/fan1/isOnline`
- `devices/light1/state`
- `devices/light1/isOnline`
- `sensors/temperature/value`
- `sensors/humidity/value`

## 1. Requirements

- Node.js 18 or newer
- npm
- A Firebase project with Realtime Database
- Firebase Email/Password Authentication enabled
- ESP32 firmware connected to the same Firebase project and database URL

## 2. Install

```bash
npm install
```

Copy `.env.example` to `.env` and fill in the Firebase Web App configuration from:

Firebase Console -> Project settings -> General -> Your apps -> Web app.

Do not put your Firebase service-account private key in this frontend project. The Firebase web API key is intended to be used by client applications; database access must be protected with Authentication and Realtime Database Rules.

## 3. Enable Firebase Authentication

Firebase Console -> Authentication -> Sign-in method -> Email/Password -> Enable.

Create a test user in Authentication -> Users, or use the Sign up screen in this app.

## 4. Configure Realtime Database

The example `database.rules.json` allows authenticated users to read and write during initial development. Review and tighten these rules before production, especially if multiple homes/users will be supported.

You can publish the rules in Firebase Console -> Realtime Database -> Rules.

The React app writes only to `commands`. ESP32 should listen to those command paths, operate the GPIO/relay, and then update `devices` with the actual reported state and online status.

## 5. Run

```bash
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

For a production build:

```bash
npm run build
npm run preview
```

## 6. Important ESP32 integration contract

When a user presses a control in React:

- Fan ON/OFF writes boolean to `/commands/fan1/state`.
- Light ON/OFF writes boolean to `/commands/light1/state`.

The ESP32 firmware must continuously read or subscribe/poll these command paths. It must not only read them once during startup.

After the physical/simulated output has been changed, ESP32 should write the actual state to:

- `/devices/fan1/state`
- `/devices/light1/state`

It should also maintain:

- `/devices/fan1/isOnline`
- `/devices/light1/isOnline`

The dashboard displays the `devices` values as the reported state. A successful write to `commands` means the command was accepted by Firebase; it does not by itself prove the relay/LED changed.

## 7. Sensor format

The dashboard accepts either numeric sensor values or objects:

```json
{
  "sensors": {
    "temperature": { "value": 30.9, "unit": "°C" },
    "humidity": { "value": 57.5, "unit": "%" }
  }
}
```

## 8. Troubleshooting

- **Firebase setup required:** check `.env` names and values, then stop and restart Vite.
- **auth/operation-not-allowed:** enable Email/Password in Firebase Authentication.
- **Permission denied:** check Realtime Database Rules and confirm the user is signed in.
- **Button command writes but Wokwi does not react:** confirm ESP32 uses the exact same database URL/project and reads `/commands/fan1/state` and `/commands/light1/state`.
- **Dashboard says Offline:** ESP32 must update `devices/<device>/isOnline` to `true` while connected and set it to `false` when disconnected. Use a heartbeat/last-seen timeout in a robust implementation.
- **Status appears stale:** confirm ESP32 writes `devices/<device>/state` only after setting the GPIO output.

## 9. Security note

The Firebase web configuration is not a server secret. Never include service-account credentials or database admin secrets in a React app. Do not deploy with public database rules. For production, use per-user/per-home authorization rules and validate which users may control each device.
