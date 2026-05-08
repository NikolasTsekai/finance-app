import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus, Trash2, Wallet, ShoppingBag, Car, Home, Heart,
  Music, ShoppingCart, Zap, BookOpen, MoreHorizontal,
  X, ChevronDown, TrendingUp, Calendar,
  PieChart as PieIcon, Lightbulb, Target, Shield, Repeat,
  CreditCard, Coins, Star,
  Mail, Lock, User, LogOut, Eye, EyeOff, Edit2, Key, Camera, Download,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";

// ─── EmailJS Configuration ────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'service_jocc9op';
const EMAILJS_TEMPLATE_ID = 'template_mh4hdfr';
const EMAILJS_PUBLIC_KEY          = 'LftDBiFBE-95S_apT';
const EMAILJS_CONTACT_TEMPLATE_ID = 'template_contact'; // set your contact template ID here

// ─── Category Registry ────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "food",          label: "Food & Dining",   Icon: ShoppingBag,    color: "#f59e0b", ring: "bg-amber-500/15",   text: "text-amber-400"   },
  { id: "transport",     label: "Transport",        Icon: Car,            color: "#3b82f6", ring: "bg-blue-500/15",    text: "text-blue-400"    },
  { id: "housing",       label: "Housing",          Icon: Home,           color: "#8b5cf6", ring: "bg-violet-500/15",  text: "text-violet-400"  },
  { id: "health",        label: "Health",           Icon: Heart,          color: "#ef4444", ring: "bg-red-500/15",     text: "text-red-400"     },
  { id: "entertainment", label: "Entertainment",    Icon: Music,          color: "#ec4899", ring: "bg-pink-500/15",    text: "text-pink-400"    },
  { id: "shopping",      label: "Shopping",         Icon: ShoppingCart,   color: "#f97316", ring: "bg-orange-500/15",  text: "text-orange-400"  },
  { id: "utilities",     label: "Utilities",        Icon: Zap,            color: "#06b6d4", ring: "bg-cyan-500/15",    text: "text-cyan-400"    },
  { id: "education",     label: "Education",        Icon: BookOpen,       color: "#10b981", ring: "bg-emerald-500/15", text: "text-emerald-400" },
  { id: "other",         label: "Other",            Icon: MoreHorizontal, color: "#6b7280", ring: "bg-slate-500/15",   text: "text-slate-400"   },
];
const INCOME_CATEGORIES = [
  { id: "salary",     label: "Salary",     Icon: Wallet,         color: "#10b981", ring: "bg-emerald-500/15", text: "text-emerald-400" },
  { id: "freelance",  label: "Freelance",  Icon: Star,           color: "#3b82f6", ring: "bg-blue-500/15",    text: "text-blue-400"    },
  { id: "investment", label: "Investment", Icon: TrendingUp,     color: "#8b5cf6", ring: "bg-violet-500/15",  text: "text-violet-400"  },
  { id: "gift",       label: "Gift",       Icon: Heart,          color: "#ec4899", ring: "bg-pink-500/15",    text: "text-pink-400"    },
  { id: "other_inc",  label: "Other",      Icon: MoreHorizontal, color: "#6b7280", ring: "bg-slate-500/15",   text: "text-slate-400"   },
];
const getCat = (id) =>
  CATEGORIES.find((c) => c.id === id) ??
  INCOME_CATEGORIES.find((c) => c.id === id) ??
  CATEGORIES[8];

// ─── Expense Storage Adapter (Claude Artifact) ────────────────────────────────
// Phase 4: replace load/save with fetch('/api/expenses') GET & POST
// Key is scoped per user so accounts never share data.
const store = {
  async load(email) {
    try {
      const raw = await window.storage.get(`expenses:${email}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  async save(email, expenses) {
    try { await window.storage.set(`expenses:${email}`, JSON.stringify(expenses)); } catch {}
  },
};

// ─── Auth Storage Adapter (Claude Artifact) ───────────────────────────────────
// Phase 4: replace with token management against FastAPI /auth/* endpoints
const authStore = {
  async load() {
    try {
      const raw = await window.storage.get("auth:session");
      return (raw && raw !== "") ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  async save(session) {
    try { await window.storage.set("auth:session", JSON.stringify(session)); } catch {}
  },
  async clear() {
    try { await window.storage.set("auth:session", ""); } catch {}
  },
};

// ─── Users Registry Adapter ───────────────────────────────────────────────────
// Stores { [email]: { name, email, password } } — one record per registered user.
const usersStore = {
  async load() {
    try {
      const raw = await window.storage.get("users:registry");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  },
  async save(users) {
    try { await window.storage.set("users:registry", JSON.stringify(users)); } catch {}
  },
};

// ─── Balance Storage Adapter (Claude Artifact) ────────────────────────────────
const balanceStore = {
  async load(email) {
    try {
      const raw = await window.storage.get(`balance:${email}`);
      return raw ? parseFloat(raw) : 0;
    } catch { return 0; }
  },
  async save(email, balance) {
    try { await window.storage.set(`balance:${email}`, String(balance)); } catch {}
  },
};

// ─── Settings Storage Adapter ─────────────────────────────────────────────────
const settingsStore = {
  async load(email) {
    try {
      const raw = await window.storage.get(`settings:${email}`);
      return raw ? JSON.parse(raw) : { monthlyBudget: "", currency: "EUR", lastProcessedMonth: "" };
    } catch { return { monthlyBudget: "", currency: "EUR", lastProcessedMonth: "" }; }
  },
  async save(email, s) {
    try { await window.storage.set(`settings:${email}`, JSON.stringify(s)); } catch {}
  },
};

// ─── Mock Auth API ────────────────────────────────────────────────────────────
// Phase 4: replace mockLogin/mockRegister bodies with fetch calls to /auth/login and /auth/register.

async function mockLogin({ email, password }) {
  await new Promise((r) => setTimeout(r, 700));
  if (!email || !password) throw new Error("Please fill in all fields.");
  const users = await usersStore.load();
  const stored = users[email];
  if (!stored || stored.password !== password || !stored.isVerified) throw new Error("Invalid email or password.");
  return { token: "mock-jwt-" + Date.now(), user: { email: stored.email, name: stored.name } };
}

async function mockRegister({ name, email, password }) {
  await new Promise((r) => setTimeout(r, 700));
  if (!name || !email || !password) throw new Error("Please fill in all fields.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");
  const users = await usersStore.load();
  if (users[email]?.isVerified) throw new Error("An account with this email already exists.");
  // User is NOT saved here — saved only after email verification succeeds.
  return { needsVerification: true, email };
}

async function sendVerificationCodeAPI({ email }) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await window.storage.set(`verify_code:${email}`, code);
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:  EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id:     EMAILJS_PUBLIC_KEY,
      template_params: { to_email: email, verification_code: code },
    }),
  });
  if (!res.ok) throw new Error("Failed to send verification email. Please try again.");
  return { success: true };
}

async function verifyCodeAPI({ email, code, pendingUser }) {
  const expected = await window.storage.get(`verify_code:${email}`);
  if (!expected) throw new Error("Verification session expired. Please sign up again.");
  if (code !== expected) throw new Error("Incorrect code. Please try again.");
  await window.storage.set(`verify_code:${email}`, "");
  // Only now do we permanently save the verified user to storage.
  const users = await usersStore.load();
  users[email] = { name: pendingUser.name, email, password: pendingUser.password, isVerified: true };
  await usersStore.save(users);
  return { token: "mock-jwt-" + Date.now(), user: { email, name: pendingUser.name } };
}

async function sendPasswordResetCodeAPI({ email }) {
  const users = await usersStore.load();
  if (!users[email]?.isVerified) throw new Error("No account found with that email.");
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await window.storage.set(`reset_code:${email}`, code);
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:  EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id:     EMAILJS_PUBLIC_KEY,
      template_params: { to_email: email, verification_code: code },
    }),
  });
  if (!res.ok) throw new Error("Failed to send reset email. Please try again.");
  return { success: true };
}

async function verifyPasswordResetCode({ email, code, newPassword }) {
  const expected = await window.storage.get(`reset_code:${email}`);
  if (!expected || code !== expected) throw new Error("Incorrect code. Please try again.");
  await window.storage.set(`reset_code:${email}`, "");
  const users = await usersStore.load();
  if (!users[email]?.isVerified) throw new Error("Incorrect code. Please try again.");
  users[email].password = newPassword;
  await usersStore.save(users);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(n);
const fmtDate = (s) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthISO = () => new Date().toISOString().slice(0, 7);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── Financial Tips Data ──────────────────────────────────────────────────────
const TIPS = [
  { Icon: Target,     accent: "#10b981", tag: "Budgeting",  title: "The 50/30/20 Rule",           desc: "Split your income: 50% for needs (rent, food), 30% for wants, and 20% straight into savings or debt repayment." },
  { Icon: Shield,     accent: "#3b82f6", tag: "Security",   title: "Build an Emergency Fund",      desc: "Aim for 3–6 months of living expenses in a separate, liquid account. It's your financial shock absorber." },
  { Icon: Zap,        accent: "#f59e0b", tag: "Discipline", title: "The 24-Hour Rule",             desc: "Before any unplanned purchase over €30, wait 24 hours. Most impulse urges disappear overnight." },
  { Icon: Repeat,     accent: "#8b5cf6", tag: "Automation", title: "Pay Yourself First",           desc: "Automate a fixed savings transfer the moment your salary arrives — before anything else gets spent." },
  { Icon: TrendingUp, accent: "#ec4899", tag: "Investing",  title: "Invest Early & Consistently",  desc: "€100/month at 7% annual return grows to €121,000 over 30 years. Time in the market beats timing it." },
  { Icon: CreditCard, accent: "#ef4444", tag: "Debt",       title: "Eliminate High-Interest Debt", desc: "Paying off credit card debt at 20% interest is a guaranteed 20% return. Attack the highest-rate balance first." },
  { Icon: Coins,      accent: "#06b6d4", tag: "Awareness",  title: "Track Every Euro",             desc: "People who consistently track spending save 15–20% more. Awareness is the most underrated financial skill." },
  { Icon: Star,       accent: "#f97316", tag: "Savings",    title: "Audit Your Subscriptions",     desc: "Once a month, review every recurring charge. The average person wastes €200+/year on forgotten subscriptions." },
];

// ─── Bottom Nav Config ────────────────────────────────────────────────────────
const NAV_TABS = [
  { id: "tracker",   label: "Tracker",   Icon: Wallet    },
  { id: "analytics", label: "Analytics", Icon: PieIcon   },
  { id: "tips",      label: "Tips",      Icon: Lightbulb },
  { id: "profile",   label: "Profile",   Icon: User      },
];

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function VerifyEmailScreen({ email, pendingUser, onVerified, onBack }) {
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) { setError("Enter the full 6-digit code."); return; }
    setLoading(true);
    setError("");
    try {
      const session = await verifyCodeAPI({ email, code, pendingUser });
      await authStore.save(session);
      onVerified(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">

        {/* Icon + heading */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-4">
            <Mail size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Check Your Inbox</h1>
          <p className="text-slate-500 text-sm mt-1 text-center leading-relaxed">
            We sent a 6-digit code to<br />
            <span className="text-slate-300 font-semibold">{email}</span>
          </p>
        </div>

        {/* Spam hint */}
        <p className="text-slate-600 text-xs text-center mb-5 leading-relaxed">
          Can't find it? Check your spam or junk folder.
        </p>

        {/* Code input + submit */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="······"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
              className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl px-4 py-4 text-white text-3xl font-black text-center tracking-[0.6em] placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="mt-1 w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Verifying…</span>
              </>
            ) : "Verify Email"}
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-slate-600 text-xs mt-5 hover:text-slate-400 transition-colors py-2"
        >
          ← Back to sign in
        </button>
      </div>
    </div>
  );
}

function ForgotPasswordScreen({ onBack, onSuccess }) {
  const [step,      setStep]      = useState(1);
  const [email,     setEmail]     = useState("");
  const [code,      setCode]      = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) { setError("Enter your email address."); return; }
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetCodeAPI({ email });
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (code.length !== 6)   { setError("Enter the full 6-digit code."); return; }
    if (newPw.length < 6)    { setError("Password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    try {
      await verifyPasswordResetCode({ email, code, newPassword: newPw });
      onSuccess("Password updated successfully. Please sign in.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-4">
            <Key size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Reset Password</h1>
          <p className="text-slate-500 text-sm mt-1 text-center leading-relaxed">
            {step === 1
              ? "Enter your email and we'll send a reset code."
              : <><span>Code sent to </span><span className="text-slate-300 font-semibold">{email}</span></>}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-3">
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="email" placeholder="Email Address" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="mt-1 w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /><span>Sending…</span></>
              ) : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Verification Code</label>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="······"
                value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl px-4 py-4 text-white text-3xl font-black text-center tracking-[0.6em] placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={showPw ? "text" : "password"} placeholder="New Password" value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setError(""); }}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl pl-11 pr-12 py-3.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={showPw ? "text" : "password"} placeholder="Confirm New Password" value={confirmPw}
                onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="mt-1 w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /><span>Updating…</span></>
              ) : "Update Password"}
            </button>
          </form>
        )}

        <button type="button" onClick={onBack}
          className="w-full text-center text-slate-600 text-xs mt-5 hover:text-slate-400 transition-colors py-2">
          ← Back to sign in
        </button>
      </div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode]               = useState("login"); // "login" | "register"
  const [form, setForm]               = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [pendingEmail, setPendingEmail] = useState(null);
  const [pendingUser,  setPendingUser]  = useState(null);
  const [showForgot,   setShowForgot]   = useState(false);
  const [successMsg,   setSuccessMsg]   = useState("");

  const isLogin = mode === "login";
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(""); setSuccessMsg(""); };
  const switchMode = (m) => { setMode(m); setError(""); setSuccessMsg(""); setForm({ name: "", email: "", password: "" }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = isLogin
        ? await mockLogin({ email: form.email, password: form.password })
        : await mockRegister({ name: form.name, email: form.email, password: form.password });
      if (result.needsVerification) {
        await sendVerificationCodeAPI({ email: result.email });
        setPendingUser({ name: form.name, email: form.email, password: form.password });
        setPendingEmail(result.email);
        return;
      }
      await authStore.save(result);
      onAuth(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail) {
    return (
      <VerifyEmailScreen
        email={pendingEmail}
        pendingUser={pendingUser}
        onVerified={onAuth}
        onBack={() => { setPendingEmail(null); setPendingUser(null); }}
      />
    );
  }

  if (showForgot) {
    return (
      <ForgotPasswordScreen
        onBack={() => setShowForgot(false)}
        onSuccess={(msg) => { setShowForgot(false); setSuccessMsg(msg); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">

        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4 shadow-2xl shadow-emerald-500/40">
            <Wallet size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Expense Tracker</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Track smart. Spend wisely.</p>
        </div>

        {/* Mode toggle pill */}
        <div className="flex bg-[#1e293b] rounded-2xl p-1 mb-5 gap-1">
          {[["login", "Sign In"], ["register", "Create Account"]].map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === m
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Success banner */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-3">
            <p className="text-emerald-400 text-sm font-medium text-center">{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {/* Full Name — register only */}
          {!isLogin && (
            <div className="relative">
              <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text" placeholder="Full Name" value={form.name}
                autoComplete="name" onChange={(e) => set("name", e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="email" placeholder="Email Address" value={form.email}
              autoComplete="email" onChange={(e) => set("email", e.target.value)}
              className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type={showPw ? "text" : "password"} placeholder="Password" value={form.password}
              autoComplete={isLogin ? "current-password" : "new-password"}
              onChange={(e) => set("password", e.target.value)}
              className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl pl-11 pr-12 py-3.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Forgot password */}
          {isLogin && (
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() => { setShowForgot(true); setError(""); }}
                className="text-xs text-slate-500 hover:text-emerald-400 transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            className="mt-1 w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>{isLogin ? "Signing in…" : "Creating account…"}</span>
              </>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </button>
        </form>

        {/* Switch mode link */}
        <p className="text-center text-slate-600 text-xs mt-5">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => switchMode(isLogin ? "register" : "login")}
            className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
            {isLogin ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function HeroCard({ availableBalance, monthTotal, todayTotal, onEditBalance }) {
  const isNegative = availableBalance < 0;
  return (
    <div
      className="relative rounded-3xl p-6 overflow-hidden"
      style={{ background: "linear-gradient(135deg,#059669 0%,#10b981 60%,#34d399 100%)" }}
    >
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />

      <button
        onClick={onEditBalance}
        className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        aria-label="Set balance"
      >
        <Edit2 size={13} className="text-white" />
      </button>

      <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest mb-1 pr-10">Available Balance</p>
      <p className={`text-4xl font-black tracking-tight mb-4 ${isNegative ? "text-red-200" : "text-white"}`}>
        {fmt(availableBalance)}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-3 py-2 backdrop-blur-sm">
          <Calendar size={13} className="text-emerald-100" />
          <span className="text-emerald-50 text-xs font-semibold">Month · {fmt(monthTotal)}</span>
        </div>
        <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-3 py-2 backdrop-blur-sm">
          <span className="text-emerald-50 text-xs font-semibold">Today · {fmt(todayTotal)}</span>
        </div>
      </div>
    </div>
  );
}

function SpendingPieChart({ expenses }) {
  const month = monthISO();
  const data = useMemo(() =>
    CATEGORIES.map((c) => ({
      name: c.label, short: c.label.split(" ")[0],
      value: expenses.filter((e) => e.category === c.id && e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0),
      color: c.color,
    })).filter((d) => d.value > 0),
  [expenses]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (!data.length) {
    return (
      <div className="bg-[#1e293b] rounded-2xl p-6 flex flex-col items-center justify-center h-48">
        <PieIcon size={32} className="text-slate-700 mb-2" />
        <p className="text-sm text-slate-600">No data this month</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1e293b] rounded-2xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Spending Distribution</p>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, color: "#fff", fontSize: 12, padding: "6px 12px" }}
              formatter={(v, name) => [fmt(v), name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xl font-black text-white leading-tight">{fmt(total)}</p>
            <p className="text-xs text-slate-400 mt-0.5">this month</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-slate-400 truncate">{d.short}</span>
            <span className="text-xs font-bold text-white ml-auto">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBarChart({ expenses }) {
  const month = monthISO();
  const data = useMemo(() =>
    CATEGORIES.map((c) => ({
      name: c.label.split(" ")[0],
      amount: expenses.filter((e) => e.category === c.id && e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0),
      color: c.color,
    })).filter((d) => d.amount > 0),
  [expenses]);

  if (!data.length) return null;

  return (
    <div className="bg-[#1e293b] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={14} className="text-emerald-400" />
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Amount by Category</p>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} barSize={22} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, color: "#fff", fontSize: 12, padding: "6px 12px" }}
            formatter={(v) => [fmt(v), ""]}
          />
          <Bar dataKey="amount" radius={[6, 6, 2, 2]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExpenseRow({ expense, onDelete }) {
  const cat = getCat(expense.category);
  const { Icon } = cat;
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#1e293b] hover:bg-[#253347] transition-colors group">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${cat.ring}`}>
        <Icon size={18} className={cat.text} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate leading-tight">{expense.description || cat.label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{cat.label} · {fmtDate(expense.date)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-white">-{fmt(expense.amount)}</span>
        <button onClick={() => onDelete(expense.id)}
          className="p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-all"
          aria-label="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function SetBalanceModal({ current, onSave, onClose }) {
  const [value, setValue] = useState(current > 0 ? String(current) : "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(value);
    if (isNaN(amt) || amt < 0) { setError("Enter a valid amount."); return; }
    onSave(parseFloat(amt.toFixed(2)));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-[#0f172a] rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>
        <div className="px-6 pt-4 pb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">Set Your Balance</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <p className="text-slate-500 text-sm mb-5">Enter your current available funds. Expenses are deducted automatically.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Amount (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(""); }}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl px-4 py-3.5 text-white text-2xl font-black placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
            <button
              type="submit"
              className="mt-1 w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all text-base shadow-lg shadow-emerald-500/25"
            >
              Save Balance
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddExpenseModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ amount: "", category: "food", description: "", date: todayISO() });
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount greater than 0."); return; }
    onAdd({
      id: uid(), amount: parseFloat(amt.toFixed(2)), currency: "EUR",
      category: form.category, description: form.description.trim(),
      date: form.date, createdAt: new Date().toISOString(),
    });
    onClose();
  };

  const selectedCat = getCat(form.category);
  const { Icon: CatIcon } = selectedCat;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#0f172a] rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>
        <div className="px-6 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">New Expense</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Amount (€)</label>
              <input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount}
                onChange={(e) => { set("amount", e.target.value); setError(""); }}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl px-4 py-3.5 text-white text-2xl font-black placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
              <div className="relative">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center ${selectedCat.ring}`}>
                  <CatIcon size={13} className={selectedCat.text} />
                </div>
                <select value={form.category} onChange={(e) => set("category", e.target.value)}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl pl-12 pr-10 py-3.5 text-white font-semibold appearance-none focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer">
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
              <input type="text" placeholder="e.g. Lunch at kafeneio" value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl px-4 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            {error && <p className="text-red-400 text-sm font-medium -mt-1">{error}</p>}
            <button type="submit"
              className="mt-1 w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all text-base shadow-lg shadow-emerald-500/25">
              Add Expense
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function TipCard({ tip }) {
  const { Icon, accent, title, desc, tag } = tip;
  return (
    <div className="bg-[#1e293b] rounded-2xl p-5 flex gap-4 border-l-4" style={{ borderLeftColor: accent }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${accent}22` }}>
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1.5 flex-wrap">
          <p className="text-sm font-bold text-white leading-tight">{title}</p>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: `${accent}22`, color: accent }}>{tag}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-[#080e1a] border-t border-slate-800/80">
      <div className="max-w-md mx-auto flex">
        {NAV_TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button key={id} onClick={() => onChange(id)}
              className={`flex-1 flex flex-col items-center gap-1 pt-2 pb-3 transition-colors ${isActive ? "text-emerald-400" : "text-slate-600 hover:text-slate-400"}`}>
              <div className={`w-5 h-0.5 rounded-full mb-1 transition-all ${isActive ? "bg-emerald-400" : "bg-transparent"}`} />
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-xs font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── 7-Day Spending Trend ─────────────────────────────────────────────────────
function SevenDayChart({ expenses }) {
  const data = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const iso    = d.toISOString().slice(0, 10);
      const amount = expenses.filter((e) => e.date === iso).reduce((s, e) => s + e.amount, 0);
      return {
        label: d.toLocaleDateString("en-GB", { weekday: "short" }),
        amount,
        isToday: i === 6,
      };
    }),
  [expenses]);

  return (
    <div className="bg-[#1e293b] rounded-2xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">7-Day Trend</p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} barSize={24} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, color: "#fff", fontSize: 12, padding: "6px 12px" }}
            formatter={(v) => [fmt(v), ""]}
          />
          <Bar dataKey="amount" radius={[5, 5, 2, 2]} minPointSize={3}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.isToday ? "#10b981" : d.amount > 0 ? "#1e4a3a" : "#243447"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Compact Category Pie (Tracker tab) ───────────────────────────────────────
function TrackerPieChart({ expenses }) {
  const month = monthISO();
  const data = useMemo(() =>
    CATEGORIES.map((c) => ({
      name: c.label.split(" ")[0],
      value: expenses.filter((e) => e.category === c.id && e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0),
      color: c.color,
    })).filter((d) => d.value > 0),
  [expenses]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (!data.length) return null;

  return (
    <div className="bg-[#1e293b] rounded-2xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">This Month by Category</p>
      <div className="relative">
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, color: "#fff", fontSize: 12, padding: "6px 12px" }}
              formatter={(v, name) => [fmt(v), name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-black text-white leading-tight">{fmt(total)}</p>
            <p className="text-xs text-slate-400 mt-0.5">this month</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-slate-400 truncate">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function ProfileView({ user, onLogout, settings, onSaveSettings, onUpdateUser }) {
  const [local,          setLocal]          = useState(settings);
  const [saved,          setSaved]          = useState(false);
  const [showContact,    setShowContact]    = useState(false);
  const [contact,        setContact]        = useState({ subject: "", message: "" });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactMsg,     setContactMsg]     = useState({ type: "", text: "" });
  const [editingName,    setEditingName]    = useState(false);
  const [nameInput,      setNameInput]      = useState(user.name);
  const fileInputRef = useRef(null);

  const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "JPY", "CAD", "AUD"];

  const handleSave = () => {
    onSaveSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setEditingName(false);
    await onUpdateUser({ name: trimmed });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result;
      if (base64) await onUpdateUser({ avatarUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  const setC = (k, v) => setContact((f) => ({ ...f, [k]: v }));

  const handleContact = async (e) => {
    e.preventDefault();
    if (!contact.subject.trim() || !contact.message.trim()) {
      setContactMsg({ type: "error", text: "Please fill in all fields." });
      return;
    }
    setContactLoading(true);
    setContactMsg({ type: "", text: "" });
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id:  EMAILJS_SERVICE_ID,
          template_id: EMAILJS_CONTACT_TEMPLATE_ID,
          user_id:     EMAILJS_PUBLIC_KEY,
          template_params: {
            from_name:  user.name,
            from_email: user.email,
            subject:    contact.subject,
            message:    contact.message,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to send. Check your contact template ID.");
      setContactMsg({ type: "success", text: "Message sent! We'll get back to you soon." });
      setContact({ subject: "", message: "" });
    } catch (err) {
      setContactMsg({ type: "error", text: err.message });
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <>
      <TabHeader eyebrow="Your Account" title="Profile" Icon={User} />

      {/* User Info */}
      <div className="bg-[#1e293b] rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-4">
          {/* Clickable avatar */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 group focus:outline-none"
            aria-label="Change profile picture"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <User size={26} className="text-emerald-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={18} className="text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex flex-col gap-2">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                  className="w-full bg-[#0f172a] border border-emerald-500 rounded-xl px-3 py-1.5 text-white text-sm font-bold focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={saveName} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Save</button>
                  <button type="button" onClick={() => setEditingName(false)} className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-white font-bold text-base leading-tight truncate">{user.name}</p>
                <button
                  type="button"
                  onClick={() => { setNameInput(user.name); setEditingName(true); }}
                  className="text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                  aria-label="Edit name"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}
            <p className="text-slate-400 text-sm mt-1 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-[#1e293b] rounded-2xl p-5 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Preferences</p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Monthly Budget (€)</label>
            <input
              type="number" min="0" step="0.01" placeholder="e.g. 1500.00"
              value={local.monthlyBudget}
              onChange={(e) => setLocal((s) => ({ ...s, monthlyBudget: e.target.value }))}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Currency</label>
            <div className="relative">
              <select
                value={local.currency}
                onChange={(e) => setLocal((s) => ({ ...s, currency: e.target.value }))}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          className={`mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all ${
            saved
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25"
          }`}
        >
          {saved ? "✓ Saved!" : "Save Preferences"}
        </button>
      </div>

      {/* Contact Support */}
      <div className="bg-[#1e293b] rounded-2xl overflow-hidden mb-4">
        <button
          type="button"
          onClick={() => setShowContact((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Mail size={14} className="text-blue-400" />
            </div>
            <span className="text-white font-semibold text-sm">Contact Support</span>
          </div>
          <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${showContact ? "rotate-180" : ""}`} />
        </button>
        {showContact && (
          <div className="px-5 pb-5 border-t border-slate-800">
            <p className="text-slate-500 text-xs mt-3 mb-3 leading-relaxed">
              Have a question or feedback? Send us a message.
            </p>
            <form onSubmit={handleContact} className="flex flex-col gap-3">
              <input
                type="text" placeholder="Subject" value={contact.subject}
                onChange={(e) => { setC("subject", e.target.value); setContactMsg({ type: "", text: "" }); }}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <textarea
                placeholder="Your message…" value={contact.message} rows={4}
                onChange={(e) => { setC("message", e.target.value); setContactMsg({ type: "", text: "" }); }}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
              {contactMsg.text && (
                <div className={`rounded-xl px-4 py-3 ${
                  contactMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}>
                  <p className={`text-sm font-medium ${contactMsg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {contactMsg.text}
                  </p>
                </div>
              )}
              <button type="submit" disabled={contactLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                {contactLoading
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /><span>Sending…</span></>
                  : "Send Message"
                }
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/20 rounded-2xl p-5 mb-6">
        <p className="text-xs font-semibold text-red-400/70 uppercase tracking-widest mb-3">Account</p>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 active:scale-[0.98] font-semibold text-sm transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

function TabHeader({ eyebrow, title, Icon, onLogout }) {
  return (
    <div className="flex items-center justify-between mb-7">
      <div>
        <p className="text-slate-500 text-sm font-medium">{eyebrow}</p>
        <h1 className="text-2xl font-black text-white leading-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
          <Icon size={20} className="text-emerald-400" />
        </div>
        {onLogout && (
          <button onClick={onLogout}
            className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Log out">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function TrackerView({ expenses, onDelete, monthTotal, todayTotal, onAddClick, user, availableBalance, onEditBalance }) {
  return (
    <>
      <TabHeader eyebrow={`Welcome back, ${user?.name ?? "there"}`} title="Overview" Icon={Wallet} />
      <HeroCard availableBalance={availableBalance} monthTotal={monthTotal} todayTotal={todayTotal} onEditBalance={onEditBalance} />

      <div className="mt-4 flex flex-col gap-3">
        <SevenDayChart expenses={expenses} />
        <TrackerPieChart expenses={expenses} />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Transactions</p>
          <p className="text-xs text-slate-600">{expenses.length} total</p>
        </div>
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center mb-4">
              <Wallet size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-500 font-semibold">No expenses yet</p>
            <p className="text-slate-600 text-sm mt-1">Tap + to log your first one</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {expenses.map((exp) => <ExpenseRow key={exp.id} expense={exp} onDelete={onDelete} />)}
          </div>
        )}
      </div>
      <button onClick={onAddClick}
        className="fixed bottom-20 right-5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 transition-all z-20"
        aria-label="Add expense">
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </>
  );
}

function AnalyticsView({ expenses }) {
  const month = monthISO();
  const monthExpenses = expenses.filter((e) => e.date.startsWith(month));
  const monthTotal    = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const avgTx         = monthExpenses.length > 0 ? monthTotal / monthExpenses.length : 0;

  return (
    <>
      <TabHeader eyebrow="This Month" title="Analytics" Icon={PieIcon} />
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#1e293b] rounded-2xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1.5">Total Spent</p>
          <p className="text-xl font-black text-white">{fmt(monthTotal)}</p>
          <p className="text-xs text-slate-500 mt-1">{monthExpenses.length} transactions</p>
        </div>
        <div className="bg-[#1e293b] rounded-2xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1.5">Avg per Entry</p>
          <p className="text-xl font-black text-white">{fmt(avgTx)}</p>
          <p className="text-xs text-slate-500 mt-1">per transaction</p>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <SpendingPieChart expenses={expenses} />
        <CategoryBarChart expenses={expenses} />
      </div>
    </>
  );
}

function TipsView() {
  return (
    <>
      <TabHeader eyebrow="Build Wealth" title="Financial Tips" Icon={Lightbulb} />
      <div className="flex flex-col gap-3">
        {TIPS.map((tip, i) => <TipCard key={i} tip={tip} />)}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [expenses,     setExpenses]     = useState([]);
  const [authSession,  setAuthSession]  = useState(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [showForm,     setShowForm]     = useState(false);
  const [showBalance,  setShowBalance]  = useState(false);
  const [activeTab,    setActiveTab]    = useState("tracker");
  const [ready,        setReady]        = useState(false);
  const [settings,     setSettings]     = useState({ monthlyBudget: "", currency: "EUR" });

  useEffect(() => {
    authStore.load().then(async (session) => {
      setAuthSession(session);
      if (session?.user?.email) {
        const data = await store.load(session.user.email);
        setExpenses(data);
        const bal = await balanceStore.load(session.user.email);
        setTotalBalance(bal);
        const s = await settingsStore.load(session.user.email);
        setSettings(s);
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready && authSession?.user?.email) {
      store.save(authSession.user.email, expenses);
    }
  }, [expenses, ready, authSession]);

  useEffect(() => {
    if (ready && authSession?.user?.email) {
      balanceStore.save(authSession.user.email, totalBalance);
    }
  }, [totalBalance, ready, authSession]);

  useEffect(() => {
    if (ready && authSession?.user?.email) {
      settingsStore.save(authSession.user.email, settings);
    }
  }, [settings, ready, authSession]);

  const addExpense    = (exp) => setExpenses((prev) => [exp, ...prev]);
  const deleteExpense = (id)  => setExpenses((prev) => prev.filter((e) => e.id !== id));
  const handleAuth = async (session) => {
    const data = await store.load(session.user.email);
    setExpenses(data);
    const bal = await balanceStore.load(session.user.email);
    setTotalBalance(bal);
    const s = await settingsStore.load(session.user.email);
    setSettings(s);
    setAuthSession(session);
  };

  const handleLogout = async () => {
    await authStore.clear();
    setExpenses([]);
    setTotalBalance(0);
    setSettings({ monthlyBudget: "", currency: "EUR" });
    setAuthSession(null);
    setActiveTab("tracker");
  };

  const handleUpdateUser = async (updates) => {
    const users = await usersStore.load();
    if (users[authSession.user.email]) {
      Object.assign(users[authSession.user.email], updates);
      await usersStore.save(users);
    }
    const updated = { ...authSession, user: { ...authSession.user, ...updates } };
    await authStore.save(updated);
    setAuthSession(updated);
  };

  const today = todayISO();
  const month = monthISO();

  const todayTotal = useMemo(
    () => expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
  const monthTotal = useMemo(
    () => expenses.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
  const allTimeTotal     = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const availableBalance = totalBalance - allTimeTotal;

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!authSession) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans">
      <div className="max-w-md mx-auto px-4 pt-12 pb-32">
        {activeTab === "tracker" && (
          <TrackerView
            expenses={expenses}
            onDelete={deleteExpense}
            monthTotal={monthTotal}
            todayTotal={todayTotal}
            onAddClick={() => setShowForm(true)}
            user={authSession.user}
            availableBalance={availableBalance}
            onEditBalance={() => setShowBalance(true)}
          />
        )}
        {activeTab === "analytics" && <AnalyticsView expenses={expenses} />}
        {activeTab === "tips"      && <TipsView />}
        {activeTab === "profile"   && (
          <ProfileView
            user={authSession.user}
            onLogout={handleLogout}
            settings={settings}
            onSaveSettings={(s) => setSettings(s)}
            onUpdateUser={handleUpdateUser}
          />
        )}
      </div>

      <BottomNav active={activeTab} onChange={setActiveTab} />

      {showForm    && <AddExpenseModal onAdd={addExpense} onClose={() => setShowForm(false)} />}
      {showBalance && <SetBalanceModal current={totalBalance} onSave={setTotalBalance} onClose={() => setShowBalance(false)} />}
    </div>
  );
}
