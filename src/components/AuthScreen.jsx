import { useEffect, useState } from "react";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  Wifi,
  Zap
} from "lucide-react";

import { auth } from "../firebase";


const slides = [

  {
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=85",

    eyebrow: "A MORE CONNECTED HOME",

    title: (
      <>
        Comfort that
        <br />
        <span>feels effortless.</span>
      </>
    ),

    description:
      "Bring your home to life with simple controls, thoughtful automation and a space that responds to you.",

    tag: "Designed around your everyday"
  },


  {
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1500&q=85",

    eyebrow: "CONTROL FROM ANYWHERE",

    title: (
      <>
        Your space.
        <br />
        <span>Your control.</span>
      </>
    ),

    description:
      "Check device status and manage your connected appliances from one beautiful dashboard.",

    tag: "Smart control, made simple"
  },


  {
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1500&q=85",

    eyebrow: "INSIGHTFUL LIVING",

    title: (
      <>
        Know your home
        <br />
        <span>inside out.</span>
      </>
    ),

    description:
      "Stay informed with live environmental readings and real-time device connectivity.",

    tag: "Your home at a glance"
  }

];


export default function AuthScreen() {

  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [slide, setSlide] = useState(0);


  // Automatic carousel
  useEffect(() => {

    const timer = window.setInterval(() => {

      setSlide(current => (current + 1) % slides.length);

    }, 5500);


    return () => window.clearInterval(timer);

  }, []);


  // Switch between login and registration
  function changeMode(nextMode) {

    setMode(nextMode);

    setError("");

    setPassword("");

  }


  // Firebase authentication
  async function handleSubmit(event) {

    event.preventDefault();

    setError("");

    setBusy(true);


    try {

      if (mode === "signup") {

        const credential =
          await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );


        if (name.trim()) {

          await updateProfile(credential.user, {
            displayName: name.trim()
          });

        }

      } else {

        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      }


    } catch (err) {

      const messages = {

        "auth/invalid-email":
          "Please enter a valid email address.",

        "auth/user-not-found":
          "No account found with this email.",

        "auth/wrong-password":
          "Incorrect password. Try again.",

        "auth/invalid-credential":
          "Email or password is incorrect.",

        "auth/email-already-in-use":
          "This email is already registered. Please sign in.",

        "auth/weak-password":
          "Use a password with at least 6 characters.",

        "auth/too-many-requests":
          "Too many attempts. Please wait and try again.",

        "auth/network-request-failed":
          "Network error. Check your internet connection."

      };


      setError(
        messages[err.code] ||
        err.message ||
        "Authentication failed."
      );


    } finally {

      setBusy(false);

    }

  }


  const currentSlide = slides[slide];


  return (

    <main className="auth-shell">


      {/* LEFT SIDE - IMAGE CAROUSEL */}

      <section className="auth-visual">


        <div
          className="auth-photo"
          style={{
            backgroundImage: `url("${currentSlide.image}")`
          }}
        />


        <div className="auth-photo-overlay" />


        <div className="auth-visual-content">


          {/* BRAND */}

          <div className="brand">

            <span className="brand-mark">
              <Home size={20} />
            </span>

            <span>HomeSense</span>

          </div>


          {/* SLIDE CONTENT */}

          <div className="visual-copy">

            <span className="eyebrow">

              <span className="pulse-dot" />

              {currentSlide.eyebrow}

            </span>


            <h1 key={slide}>
              {currentSlide.title}
            </h1>


            <p key={`desc-${slide}`}>
              {currentSlide.description}
            </p>


            {/* FEATURES */}

            <div className="visual-benefits">

              <div>
                <Zap size={17} />
                <span>Instant device control</span>
              </div>

              <div>
                <Activity size={17} />
                <span>Live sensor monitoring</span>
              </div>

              <div>
                <ShieldCheck size={17} />
                <span>Secure personal access</span>
              </div>

            </div>

          </div>


          {/* CAROUSEL CONTROLS */}

          <div className="auth-carousel-footer">

            <span>
              {currentSlide.tag}
            </span>


            <div className="carousel-controls">


              <button
                type="button"
                onClick={() =>
                  setSlide(
                    (slide + slides.length - 1) % slides.length
                  )
                }
                aria-label="Previous slide"
              >
                <ArrowLeft size={16} />
              </button>


              <div className="carousel-dots">

                {slides.map((item, index) => (

                  <button
                    key={item.tag}
                    type="button"
                    aria-label={`Show slide ${index + 1}`}
                    className={
                      slide === index ? "active" : ""
                    }
                    onClick={() => setSlide(index)}
                  />

                ))}

              </div>


              <button
                type="button"
                onClick={() =>
                  setSlide((slide + 1) % slides.length)
                }
                aria-label="Next slide"
              >
                <ArrowRight size={16} />
              </button>


            </div>

          </div>

        </div>


        {/* IMAGE NUMBER */}

        <div className="auth-image-count">

          0{slide + 1}

          <span>
            / 0{slides.length}
          </span>

        </div>

      </section>



      {/* RIGHT SIDE - AUTHENTICATION */}

      <section className="auth-panel">


        <div className="auth-card">


          {/* MOBILE BRAND */}

          <div className="mobile-brand brand">

            <span className="brand-mark">
              <Home size={20} />
            </span>

            <span>HomeSense</span>

          </div>



          {/* HEADING */}

          <div className="auth-heading">

            <span className="eyebrow">

              {mode === "login"
                ? "WELCOME BACK"
                : "GET STARTED"}

            </span>


            <h2>

              {mode === "login"
                ? "Welcome back"
                : "Create your account"}

            </h2>


            <p>

              {mode === "login"
                ? "Sign in to continue to your smart home."
                : "A smarter, more connected home starts here."}

            </p>

          </div>



          {/* LOGIN / REGISTER SWITCH */}

          <div className="auth-mode-switch">

            <button
              type="button"
              className={
                mode === "login" ? "selected" : ""
              }
              onClick={() => changeMode("login")}
            >
              Sign in
            </button>


            <button
              type="button"
              className={
                mode === "signup" ? "selected" : ""
              }
              onClick={() => changeMode("signup")}
            >
              Create account
            </button>

          </div>



          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >


            {/* NAME FIELD */}

            {mode === "signup" && (

              <label className="field">

                <span>Your name</span>


                <div className="input-wrap">

                  <UserRound size={18} />

                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    required
                  />

                </div>

              </label>

            )}



            {/* EMAIL FIELD */}

            <label className="field">

              <span>Email address</span>


              <div className="input-wrap">

                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

              </div>

            </label>



            {/* PASSWORD FIELD */}

            <label className="field">

              <span>Password</span>


              <div className="input-wrap">

                <LockKeyhole size={18} />


                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  minLength={6}
                  required
                />


                <button
                  type="button"
                  className="icon-button password-toggle"
                  onClick={() =>
                    setShowPassword(value => !value)
                  }
                  aria-label="Toggle password visibility"
                >

                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />}

                </button>

              </div>

            </label>



            {/* ERROR */}

            {error && (

              <div className="form-error" role="alert">
                {error}
              </div>

            )}



            {/* SUBMIT BUTTON */}

            <button
              className="primary-button full-button"
              disabled={busy}
            >

              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in to HomeSense"
                  : "Create my account"}

              <span>→</span>

            </button>


          </form>



          {/* SWITCH ACCOUNT MODE */}

          <p className="auth-switch">

            {mode === "login"
              ? "New to HomeSense?"
              : "Already have an account?"}


            <button
              type="button"
              onClick={() =>
                changeMode(
                  mode === "login" ? "signup" : "login"
                )
              }
            >

              {mode === "login"
                ? "Create an account"
                : "Sign in instead"}

            </button>

          </p>



          {/* SECURITY NOTE */}

          <p className="auth-note">

            <CheckCircle2 size={13} />

            Secure access powered by Firebase Authentication.

          </p>


        </div>

      </section>

    </main>

  );

}