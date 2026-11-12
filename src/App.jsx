
import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Activity,
  AlertCircle,
  Bell,
  ChevronDown,
  Clock3,
  Droplets,
  Home,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wifi,
  X,
  Zap,
  Thermometer,
  ArrowRight,
  Fan,
  Lightbulb,
  CheckCircle2
} from "lucide-react";

import AuthScreen from "./components/AuthScreen";
import DeviceCard from "./components/DeviceCard";
import SensorCard from "./components/SensorCard";

import {
  auth,
  firebaseConfigured,
  firebaseConfigError
} from "./firebase";

import {
  sendDeviceCommand,
  subscribeToHome
} from "./lib/firebaseData";


function normalizeBoolean(value) {
  return value === true || value === 1 || value === "true";
}


function formatTime(date) {
  return date
    ? new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(date)
    : "Waiting for data";
}


export default function App() {

  const [user, setUser] = useState(undefined);
  const [home, setHome] = useState(null);
  const [dbError, setDbError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  const [pending, setPending] = useState({});
  const [optimisticStates, setOptimisticStates] = useState({});

  const toastTimer = useRef(null);

  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");


  // Firebase authentication listener
  useEffect(() => {
    if (!firebaseConfigured || !auth) return undefined;

    return onAuthStateChanged(auth, setUser);
  }, []);


  // Firebase Realtime Database listener
  useEffect(() => {

    if (!user) {
      setHome(null);
      return undefined;
    }

    setDbError("");

    return subscribeToHome(
      data => {
        setHome(data || {});
        setLastUpdate(new Date());
      },
      error => {
        setDbError(
          error.message ||
          "Could not read the database. Check your Firebase rules."
        );
      }
    );

  }, [user]);


  // Clear toast timer when component unmounts
  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);


  // Device data
  const fan = home?.devices?.fan1 || {};
  const light = home?.devices?.light1 || {};

  const sensors = home?.sensors || {};


  // Optimistic device states
  // Update the UI immediately after clicking ON/OFF.
  const fanState =
    optimisticStates.fan1 ?? normalizeBoolean(fan.state);

  const lightState =
    optimisticStates.light1 ?? normalizeBoolean(light.state);


  // Sensor readings
  const temperature =
    sensors.temperature?.value ?? sensors.temperature;

  const humidity =
    sensors.humidity?.value ?? sensors.humidity;


  // Online devices count
  const onlineCount = [fan, light].filter(
    device => normalizeBoolean(device.isOnline)
  ).length;


  // Active devices count
  const activeCount = [fanState, lightState].filter(Boolean).length;


  // Username
  const welcomeName = useMemo(() => {

    const display = user?.displayName?.trim();

    return display
      ? display.split(" ")[0]
      : user?.email?.split("@")[0] || "there";

  }, [user]);


  // ESP32 confirmation listener
  // Keep the optimistic display until ESP32 reports the requested state.
  useEffect(() => {

    const reportedStates = {
      fan1: normalizeBoolean(fan.state),
      light1: normalizeBoolean(light.state)
    };

    Object.entries(reportedStates).forEach(
      ([deviceKey, actualState]) => {

        const requestedState = optimisticStates[deviceKey];

        if (
          requestedState !== undefined &&
          requestedState === actualState
        ) {

          // ESP32 confirmation received.
          setOptimisticStates(prev => {
            const updated = { ...prev };
            delete updated[deviceKey];
            return updated;
          });

          const deviceName =
            deviceKey === "fan1" ? "Fan" : "Light";

          setToast(
            `${deviceName} successfully turned ${actualState ? "ON" : "OFF"}`
          );

          if (toastTimer.current) {
            window.clearTimeout(toastTimer.current);
          }

          toastTimer.current = window.setTimeout(() => {
            setToast("");
          }, 2000);

        }

      }
    );

  }, [fan.state, light.state, optimisticStates]);


  // Device control
  // Update the UI immediately and clear WAITING
  // as soon as Firebase accepts the command write.
  async function toggleDevice(deviceKey, currentState) {

    if (pending[deviceKey]) return;

    const nextState = !normalizeBoolean(currentState);

    const deviceName =
      deviceKey === "fan1" ? "Fan" : "Light";


    // 1. Update dashboard immediately
    setOptimisticStates(prev => ({
      ...prev,
      [deviceKey]: nextState
    }));


    // 2. Show pending state while writing to Firebase
    setPending(prev => ({
      ...prev,
      [deviceKey]: true
    }));


    setDbError("");

    setToast(`Updating ${deviceName.toLowerCase()}...`);


    try {

      // 3. Send command to Firebase
      await sendDeviceCommand(deviceKey, nextState);


      // 4. Firebase accepted the command.
      // Stop showing WAITING immediately.
      setPending(prev => ({
        ...prev,
        [deviceKey]: false
      }));


      setToast(
        `${deviceName} command sent successfully`
      );


      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }

      toastTimer.current = window.setTimeout(() => {
        setToast("");
      }, 2000);


      // Keep optimisticStates until ESP32 reports:
      // devices/<deviceKey>/state === nextState.
      // The confirmation listener above clears it.

    } catch (error) {

      // Roll back only if Firebase command writing fails.
      setOptimisticStates(prev => {
        const updated = { ...prev };
        delete updated[deviceKey];
        return updated;
      });


      setPending(prev => ({
        ...prev,
        [deviceKey]: false
      }));


      setDbError(
        error.message ||
        "Could not send the command. Check your connection and database rules."
      );

      setToast("");

    }

  }


  // Sign out
  async function handleSignOut() {
    await signOut(auth);
  }


  // Firebase setup screen
  if (!firebaseConfigured) {

    return (
      <div className="setup-screen">

        <div className="setup-card">

          <div className="brand">
            <span className="brand-mark">
              <Home size={20} />
            </span>
            HomeSense
          </div>

          <div className="setup-icon">
            <AlertCircle size={26} />
          </div>

          <h1>Firebase setup required</h1>

          <p>{firebaseConfigError}</p>

          <ol>
            <li>Copy .env.example to .env.</li>
            <li>Fill in your Firebase web app configuration.</li>
            <li>Restart the development server using npm run dev.</li>
          </ol>

        </div>

      </div>
    );

  }


  // Loading screen
  if (user === undefined) {

    return (
      <div className="loading-screen">
        <span className="loader" />
        <p>Connecting to HomeSense…</p>
      </div>
    );

  }


  // Authentication screen
  if (!user) {
    return <AuthScreen />;
  }


  const goToDevices = () => setActiveTab("Devices");


  return (

    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>

        <div className="sidebar-brand">

          <span className="brand-mark">
            <Home size={20} />
          </span>

          <span>HomeSense</span>

          <button
            className="icon-button close-nav"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={20} />
          </button>

        </div>


        <div className="home-selector">

          <div className="home-avatar">
            <Home size={18} />
          </div>

          <div>
            <strong>My Home</strong>
            <span>Smart residence</span>
          </div>

          <ChevronDown size={16} />

        </div>


        <span className="nav-label">WORKSPACE</span>


        <nav className="side-nav">

          <button
            className={
              activeTab === "Overview"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setActiveTab("Overview");
              setMobileNavOpen(false);
            }}
          >
            <Activity size={18} />
            Overview
          </button>


          <button
            className={
              activeTab === "Devices"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setActiveTab("Devices");
              setMobileNavOpen(false);
            }}
          >
            <Zap size={18} />
            Devices
            <span className="nav-count">2</span>
          </button>

        </nav>


        <div className="sidebar-bottom">

          <div className="help-card">

            <div className="help-icon">
              <ShieldCheck size={18} />
            </div>

            <strong>Your home, secured</strong>

            <p>
              Device commands are sent through your private Firebase connection.
            </p>

          </div>


          <div className="profile-row">

            <div className="profile-avatar">
              {welcomeName.charAt(0).toUpperCase()}
            </div>

            <div className="profile-details">
              <strong>{welcomeName}</strong>
              <span>{user.email}</span>
            </div>

            <button
              className="icon-button"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut size={17} />
            </button>

          </div>

        </div>

      </aside>


      {mobileNavOpen && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}


      {/* MAIN CONTENT */}

      <main className="main-content">


        {/* TOPBAR */}

        <header className="topbar">

          <div className="topbar-left">

            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div className="breadcrumb">
              Workspace <span>/</span>
              <strong>{activeTab}</strong>
            </div>

          </div>


          <div className="topbar-right">

            <div
              className={`system-status ${
                onlineCount > 0 ? "status-good" : "status-muted"
              }`}
            >
              <span className="status-dot" />
              {onlineCount}/2 devices online
            </div>

            <button
              className="icon-button notification-button"
              title="Notifications"
            >
              <Bell size={18} />
            </button>

            <div className="top-avatar">
              {welcomeName.charAt(0).toUpperCase()}
            </div>

          </div>

        </header>


        <div className="page-container">

          {dbError && (
            <div className="alert-banner">
              <AlertCircle size={18} />
              <span>{dbError}</span>
            </div>
          )}


          {/* OVERVIEW PAGE */}

          {activeTab === "Overview" ? (

            <>

              {/* HERO SECTION */}

              <section className="overview-hero">

                <div className="overview-hero-copy">

                  <span className="hero-pill">
                    <span className="pulse-dot" />
                    YOUR HOME, CONNECTED
                  </span>

                  <h1>
                    Welcome home,
                    <br />
                    <span>{welcomeName}.</span>
                  </h1>

                  <p>
                    Everything you need to create a more comfortable,
                    connected and intelligent home is right here.
                  </p>

                  <button
                    className="hero-action"
                    onClick={goToDevices}
                  >
                    Explore your devices
                    <ArrowRight size={17} />
                  </button>

                </div>


                <div
                  className="overview-hero-image"
                  role="img"
                  aria-label="Modern smart home living room"
                >

                  <div className="hero-image-caption">

                    <span>
                      <CheckCircle2 size={15} />
                      Home status
                    </span>

                    <strong>
                      {onlineCount === 2
                        ? "All systems looking good"
                        : `${onlineCount} of 2 devices connected`}
                    </strong>

                  </div>

                </div>

              </section>


              {/* METRICS */}

              <section className="overview-metrics">

                <article className="metric-card metric-blue">

                  <div className="metric-icon">
                    <Wifi size={19} />
                  </div>

                  <span>Connected devices</span>

                  <strong>
                    {onlineCount}
                    <small> / 2</small>
                  </strong>

                  <p><i /> Live connection</p>

                </article>


                <article className="metric-card">

                  <div className="metric-icon violet">
                    <Zap size={19} />
                  </div>

                  <span>Devices switched on</span>

                  <strong>
                    {activeCount}
                    <small> / 2</small>
                  </strong>

                  <p>Currently active</p>

                </article>


                <article className="metric-card">

                  <div className="metric-icon amber">
                    <Thermometer size={19} />
                  </div>

                  <span>Temperature</span>

                  <strong>
                    {temperature ?? "--"}
                    <small> °C</small>
                  </strong>

                  <p>Indoor environment</p>

                </article>


                <article className="metric-card">

                  <div className="metric-icon cyan">
                    <Droplets size={19} />
                  </div>

                  <span>Humidity</span>

                  <strong>
                    {humidity ?? "--"}
                    <small> %</small>
                  </strong>

                  <p>Indoor environment</p>

                </article>

              </section>


              {/* OVERVIEW LOWER GRID */}

              <section className="overview-lower-grid">


                {/* DEVICE STATUS */}

                <div className="overview-panel">

                  <div className="panel-heading">

                    <div>
                      <span className="section-kicker">
                        AT A GLANCE
                      </span>

                      <h2>Device status</h2>

                      <p>
                        A quick look at your connected appliances.
                      </p>
                    </div>

                    <button
                      className="text-link"
                      onClick={goToDevices}
                    >
                      Manage devices
                      <ArrowRight size={15} />
                    </button>

                  </div>


                  <div className="status-list">

                    <div className="status-row">

                      <div className="status-device-icon fan-icon">
                        <Fan size={21} />
                      </div>

                      <div className="status-device-copy">
                        <strong>Ceiling Fan</strong>

                        <span>
                          {normalizeBoolean(fan.isOnline)
                            ? "Connected to HomeSense"
                            : "Not connected"}
                        </span>
                      </div>

                      <span
                        className={`status-chip ${
                          fanState ? "chip-on" : "chip-off"
                        }`}
                      >
                        {pending.fan1
                          ? "WAITING"
                          : fanState ? "ON" : "OFF"}
                      </span>

                    </div>


                    <div className="status-row">

                      <div className="status-device-icon light-icon">
                        <Lightbulb size={21} />
                      </div>

                      <div className="status-device-copy">
                        <strong>Living Room Light</strong>

                        <span>
                          {normalizeBoolean(light.isOnline)
                            ? "Connected to HomeSense"
                            : "Not connected"}
                        </span>
                      </div>

                      <span
                        className={`status-chip ${
                          lightState ? "chip-on" : "chip-off"
                        }`}
                      >
                        {pending.light1
                          ? "WAITING"
                          : lightState ? "ON" : "OFF"}
                      </span>

                    </div>

                  </div>


                  <div className="panel-bottom-note">
                    <Activity size={15} />
                    Device status is synchronized with Firebase Realtime Database.
                  </div>

                </div>


                {/* ENVIRONMENT */}

                <div className="overview-panel environment-panel">

                  <div className="panel-heading">

                    <div>
                      <span className="section-kicker">
                        YOUR ENVIRONMENT
                      </span>

                      <h2>Indoor comfort</h2>

                      <p>
                        Latest readings from your ESP32 sensors.
                      </p>
                    </div>

                  </div>


                  <div className="comfort-reading">

                    <div className="comfort-icon temp">
                      <Thermometer size={20} />
                    </div>

                    <div>
                      <span>Temperature</span>

                      <strong>
                        {temperature ?? "--"}
                        <small>°C</small>
                      </strong>
                    </div>

                    <span className="reading-live">LIVE</span>

                  </div>


                  <div className="comfort-reading">

                    <div className="comfort-icon humid">
                      <Droplets size={20} />
                    </div>

                    <div>
                      <span>Humidity</span>

                      <strong>
                        {humidity ?? "--"}
                        <small>%</small>
                      </strong>
                    </div>

                    <span className="reading-live">LIVE</span>

                  </div>


                  <div className="last-sync">
                    <Clock3 size={14} />
                    Last updated: {formatTime(lastUpdate)}
                  </div>

                </div>

              </section>


              {/* TIP */}

              <section className="overview-tip">

                <div className="tip-icon">
                  <Sparkles size={20} />
                </div>

                <div>
                  <strong>A smarter home starts here</strong>

                  <p>
                    Use your Devices workspace to switch appliances
                    on or off and monitor their connection status in real time.
                  </p>
                </div>

                <button onClick={goToDevices}>
                  Open controls
                  <ArrowRight size={15} />
                </button>

              </section>

            </>

          ) : (

            /* DEVICES PAGE */

            <>

              <section className="welcome-row devices-welcome">

                <div>

                  <div className="eyebrow">
                    <Zap size={14} />
                    SMART DEVICE MANAGEMENT
                  </div>

                  <h1>Your devices</h1>

                  <p>
                    Control your appliances and monitor their live connection status.
                  </p>

                </div>


                <div className="date-chip">

                  <Clock3 size={16} />

                  <span>Updated {formatTime(lastUpdate)}</span>

                  <button
                    className="icon-button refresh-button"
                    onClick={() => window.location.reload()}
                    title="Refresh"
                  >
                    <RefreshCw size={15} />
                  </button>

                </div>

              </section>


              {/* DEVICE CONTROLS */}

              <section className="section-block">

                <div className="section-heading">

                  <div>

                    <span className="section-kicker">
                      CONTROL CENTER
                    </span>

                    <h2>
                      Appliances
                      <span className="heading-count">02</span>
                    </h2>

                    <p>
                      Send commands to your connected home appliances.
                    </p>

                  </div>

                  <span className="section-live">
                    <i />
                    REALTIME
                  </span>

                </div>


                <div className="device-grid">

                  <DeviceCard
                    type="fan"
                    title="Ceiling Fan"
                    state={fanState}
                    isOnline={normalizeBoolean(fan.isOnline)}
                    pending={!!pending.fan1}
                    onToggle={() => toggleDevice("fan1", fanState)}
                  />


                  <DeviceCard
                    type="light"
                    title="Living Room Light"
                    state={lightState}
                    isOnline={normalizeBoolean(light.isOnline)}
                    pending={!!pending.light1}
                    onToggle={() => toggleDevice("light1", lightState)}
                  />

                </div>


                <p className="device-hint">
                  <span className="hint-dot" />
                  The display updates immediately. ESP32 confirmation synchronizes the actual device state.
                </p>

              </section>


              {/* SENSOR READINGS */}

              <section className="section-block sensor-section">

                <div className="section-heading">

                  <div>

                    <span className="section-kicker">
                      ENVIRONMENT MONITORING
                    </span>

                    <h2>Live sensor readings</h2>

                    <p>
                      Environmental data received from your ESP32.
                    </p>

                  </div>

                  <span className="section-live">
                    <i />
                    LIVE DATA
                  </span>

                </div>


                <div className="sensor-grid">

                  <SensorCard
                    type="temperature"
                    label="Temperature"
                    value={temperature}
                    unit="°C"
                  />


                  <SensorCard
                    type="humidity"
                    label="Humidity"
                    value={humidity}
                    unit="%"
                  />

                </div>

              </section>

            </>

          )}


          {/* FOOTER */}

          <footer className="page-footer">

            <span>
              © {new Date().getFullYear()} HomeSense
            </span>

            <span>
              <span className="footer-dot" />
              Firebase Realtime Database connected
            </span>

            <span>Made for smarter living</span>

          </footer>

        </div>

      </main>


      {/* TOAST */}

      {toast && (

        <div className="toast">
          <span className="toast-check">✓</span>
          {toast}
        </div>

      )}

    </div>
  );
}
