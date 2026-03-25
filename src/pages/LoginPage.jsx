import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const B = "#0000a0"; // Mars Blue
const Y = "#ffdc00"; // Mars Yellow
const R = "#ff3c14"; // Mars Red

export default function LoginPage() {
  const { login }               = useAuth();
  const [email, setEmail]       = useState("admin@mars.com");
  const [password, setPassword] = useState("password123");
  const [error, setError]       = useState("");
  const [show, setShow]         = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Please fill in both fields."); return; }
    const r = login(email.trim(), password);
    if (!r.success) setError(r.error || "Login failed.");
  }

  const inp = {
    width: "100%", padding: "11px 12px", borderRadius: 8,
    border: "1.5px solid #dde0ef", fontSize: 13, outline: "none",
    background: "#f8f9fc", color: "#1a1a2e", fontFamily: "inherit",
    transition: "border-color .15s",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'MarsCentra-Book',system-ui,sans-serif" }}>
      {/* Left — Mars Blue */}
      <div style={{ flex: 1, background: B, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 64, position: "relative", overflow: "hidden" }}>
        {/* decorative rings */}
        {[500, 350, 200].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: s, height: s, borderRadius: "50%", border: "1px solid rgba(255,220,0,.12)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        ))}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "'MarsExtrabold',system-ui", fontSize: 56, color: Y, letterSpacing: 5, textTransform: "uppercase", lineHeight: 1 }}>Mars</div>
          <div style={{ width: 64, height: 4, background: Y, borderRadius: 2, margin: "18px auto" }} />
          <div style={{ fontFamily: "'MarsBold',system-ui", fontSize: 13, color: "rgba(255,255,255,.85)", letterSpacing: 3, textTransform: "uppercase" }}>Revenue Growth Management</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 16, lineHeight: 1.8 }}>
            Integrated pricing, promotions<br />& portfolio management platform
          </div>
          {/* feature pills */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            {["Pricing & Pack", "Promotions", "Trade Terms", "Activation"].map(f => (
              <span key={f} style={{ fontSize: 10, fontFamily: "'MarsBold',system-ui", color: "rgba(255,255,255,.7)", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 20, padding: "4px 12px", letterSpacing: ".05em" }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — White form */}
      <div style={{ width: 440, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 44px", boxShadow: "-8px 0 40px rgba(0,0,160,.08)" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, background: B, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'MarsExtrabold',system-ui", fontSize: 12, color: Y, letterSpacing: 1 }}>RG</span>
            </div>
            <div>
              <div style={{ fontFamily: "'MarsExtrabold',system-ui", fontSize: 16, color: B, letterSpacing: 2, textTransform: "uppercase" }}>Mars | RG</div>
              <div style={{ fontSize: 10, color: "#8b8fb8", marginTop: 1 }}>Revenue Growth Management</div>
            </div>
          </div>
          <div style={{ height: 1, background: "#eef0f8", margin: "16px 0 0" }} />
        </div>

        <div style={{ width: "100%" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'MarsExtrabold',system-ui", fontSize: 22, color: B }}>Welcome back</div>
            <div style={{ fontSize: 13, color: "#8b8fb8", marginTop: 4 }}>Sign in to access your workspace</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, fontFamily: "'MarsBold',system-ui", color: "#555577", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Email</label>
              <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@mars.com" style={inp}
                onFocus={e => e.target.style.borderColor = B} onBlur={e => e.target.style.borderColor = "#dde0ef"} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, fontFamily: "'MarsBold',system-ui", color: "#555577", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inp, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = B} onBlur={e => e.target.style.borderColor = "#dde0ef"} />
                <button type="button" onClick={() => setShow(v => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#8b8fb8", fontFamily: "inherit" }}>
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: "10px 12px", background: "#fff1f0", border: "1px solid #ffd0cc", borderRadius: 8, fontSize: 12, color: R, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>⚠</span> {error}
              </div>
            )}

            <button type="submit"
              style={{ padding: "13px", borderRadius: 8, background: B, color: "#fff", fontFamily: "'MarsBold',system-ui", fontSize: 13, border: "none", cursor: "pointer", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 4, transition: "opacity .15s" }}
              onMouseOver={e => e.currentTarget.style.opacity = ".88"}
              onMouseOut={e => e.currentTarget.style.opacity = "1"}>
              Sign In →
            </button>
          </form>

          {/* hint */}
          <div style={{ marginTop: 20, padding: "12px 14px", background: "#f8f9fc", borderRadius: 10, border: "1px solid #eef0f8" }}>
            <div style={{ fontSize: 9, fontFamily: "'MarsBold',system-ui", color: "#aab", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Demo Access</div>
            <button type="button" onClick={() => { setEmail("admin@mars.com"); setPassword("password123"); setError(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, textAlign: "left", padding: 0, fontFamily: "inherit", width: "100%" }}>
              <span style={{ fontFamily: "'MarsBold',system-ui", color: B }}>admin@mars.com</span>
              <span style={{ color: "#aab" }}> · password123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}