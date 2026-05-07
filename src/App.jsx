import { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, Wallet, ShoppingBag, Car, Home, Heart,
  Music, ShoppingCart, Zap, BookOpen, MoreHorizontal,
  X, ChevronDown, TrendingUp, Calendar,
  PieChart as PieIcon, Lightbulb, Target, Shield, Repeat,
  CreditCard, Coins, Star,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";

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

const getCat = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[8];

// ─── Storage Adapter ──────────────────────────────────────────────────────────
// Swap for fetch('/api/expenses') calls in Phase 4 (FastAPI).
const store = {
  async load() {
    try {
      const raw = localStorage.getItem("expenses:all");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  async save(expenses) {
    try { localStorage.setItem("expenses:all", JSON.stringify(expenses)); } catch {}
  },
};

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
  {
    Icon: Target, accent: "#10b981", tag: "Budgeting",
    title: "The 50/30/20 Rule",
    desc: "Split your income: 50% for needs (rent, food), 30% for wants (entertainment, dining out), and 20% straight into savings or debt repayment.",
  },
  {
    Icon: Shield, accent: "#3b82f6", tag: "Security",
    title: "Build an Emergency Fund",
    desc: "Aim for 3–6 months of living expenses in a separate, liquid account. It's your financial shock absorber for job loss or unexpected bills.",
  },
  {
    Icon: Zap, accent: "#f59e0b", tag: "Discipline",
    title: "The 24-Hour Rule",
    desc: "Before any unplanned purchase over €30, wait 24 hours. Most impulse urges disappear overnight — your future self will thank you.",
  },
  {
    Icon: Repeat, accent: "#8b5cf6", tag: "Automation",
    title: "Pay Yourself First",
    desc: "Automate a fixed transfer to savings the moment your salary arrives — before anything else gets spent. What you don't see, you don't miss.",
  },
  {
    Icon: TrendingUp, accent: "#ec4899", tag: "Investing",
    title: "Invest Early & Consistently",
    desc: "€100/month at 7% annual return grows to €121,000 over 30 years. Time in the market beats timing the market every single time.",
  },
  {
    Icon: CreditCard, accent: "#ef4444", tag: "Debt",
    title: "Eliminate High-Interest Debt",
    desc: "Paying off credit card debt at 20% interest is a guaranteed 20% return. Attack the highest-rate balance first (avalanche method).",
  },
  {
    Icon: Coins, accent: "#06b6d4", tag: "Awareness",
    title: "Track Every Euro",
    desc: "Awareness is the first step. People who consistently track spending save 15–20% more than those who estimate — this app is your edge.",
  },
  {
    Icon: Star, accent: "#f97316", tag: "Savings",
    title: "Audit Your Subscriptions",
    desc: "Once a month, review every recurring charge. The average person pays for 2–3 forgotten subscriptions they no longer use — cancel them.",
  },
];

// ─── Bottom Nav Config ────────────────────────────────────────────────────────
const NAV_TABS = [
  { id: "tracker",   label: "Tracker",   Icon: Wallet    },
  { id: "analytics", label: "Analytics", Icon: PieIcon   },
  { id: "tips",      label: "Tips",      Icon: Lightbulb },
];

// ─── HeroCard ─────────────────────────────────────────────────────────────────
function HeroCard({ monthTotal, todayTotal }) {
  return (
    <div
      className="relative rounded-3xl p-6 overflow-hidden"
      style={{ background: "linear-gradient(135deg,#059669 0%,#10b981 60%,#34d399 100%)" }}
    >
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />
      <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest mb-1">Monthly Spending</p>
      <p className="text-4xl font-black text-white tracking-tight mb-4">{fmt(monthTotal)}</p>
      <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-4 py-2 backdrop-blur-sm w-fit">
        <Calendar size={14} className="text-emerald-100" />
        <span className="text-emerald-50 text-sm font-medium">Today · {fmt(todayTotal)}</span>
      </div>
    </div>
  );
}

// ─── Spending Donut Chart ─────────────────────────────────────────────────────
function SpendingPieChart({ expenses }) {
  const month = monthISO();
  const data = useMemo(() =>
    CATEGORIES.map((c) => ({
      name: c.label,
      short: c.label.split(" ")[0],
      value: expenses
        .filter((e) => e.category === c.id && e.date.startsWith(month))
        .reduce((s, e) => s + e.amount, 0),
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

      {/* Donut with center label */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0f172a", border: "1px solid #334155",
                borderRadius: 12, color: "#fff", fontSize: 12, padding: "6px 12px",
              }}
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

      {/* Custom legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-slate-400 truncate">{d.short}</span>
            <span className="text-xs font-bold text-white ml-auto">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Category Bar Chart ───────────────────────────────────────────────────────
function CategoryBarChart({ expenses }) {
  const month = monthISO();
  const data = useMemo(() =>
    CATEGORIES.map((c) => ({
      name: c.label.split(" ")[0],
      amount: expenses
        .filter((e) => e.category === c.id && e.date.startsWith(month))
        .reduce((s, e) => s + e.amount, 0),
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
          <XAxis
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "#0f172a", border: "1px solid #334155",
              borderRadius: 12, color: "#fff", fontSize: 12, padding: "6px 12px",
            }}
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

// ─── Expense Row ──────────────────────────────────────────────────────────────
function ExpenseRow({ expense, onDelete }) {
  const cat = getCat(expense.category);
  const { Icon } = cat;
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#1e293b] hover:bg-[#253347] transition-colors group">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${cat.ring}`}>
        <Icon size={18} className={cat.text} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate leading-tight">
          {expense.description || cat.label}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{cat.label} · {fmtDate(expense.date)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-white">-{fmt(expense.amount)}</span>
        <button
          onClick={() => onDelete(expense.id)}
          className="p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-all"
          aria-label="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
function AddExpenseModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    amount: "", category: "food", description: "", date: todayISO(),
  });
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount greater than 0."); return; }
    onAdd({
      id: uid(),
      amount: parseFloat(amt.toFixed(2)),
      currency: "EUR",
      category: form.category,
      description: form.description.trim(),
      date: form.date,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  const selectedCat = getCat(form.category);
  const { Icon: CatIcon } = selectedCat;

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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">New Expense</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Amount (€)</label>
              <input
                type="number" min="0.01" step="0.01" placeholder="0.00"
                value={form.amount}
                onChange={(e) => { set("amount", e.target.value); setError(""); }}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl px-4 py-3.5 text-white text-2xl font-black placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
              <div className="relative">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center ${selectedCat.ring}`}>
                  <CatIcon size={13} className={selectedCat.text} />
                </div>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl pl-12 pr-10 py-3.5 text-white font-semibold appearance-none focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
              <input
                type="text" placeholder="e.g. Lunch at kafeneio"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl px-4 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            {error && <p className="text-red-400 text-sm font-medium -mt-1">{error}</p>}
            <button
              type="submit"
              className="mt-1 w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all text-base shadow-lg shadow-emerald-500/25"
            >
              Add Expense
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Tip Card ─────────────────────────────────────────────────────────────────
function TipCard({ tip }) {
  const { Icon, accent, title, desc, tag } = tip;
  return (
    <div
      className="bg-[#1e293b] rounded-2xl p-5 flex gap-4 border-l-4"
      style={{ borderLeftColor: accent }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${accent}22` }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1.5 flex-wrap">
          <p className="text-sm font-bold text-white leading-tight">{title}</p>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
            style={{ background: `${accent}22`, color: accent }}
          >
            {tag}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-[#080e1a] border-t border-slate-800/80 safe-area-pb">
      <div className="max-w-md mx-auto flex">
        {NAV_TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex-1 flex flex-col items-center gap-1 pt-2 pb-3 transition-colors ${
                isActive ? "text-emerald-400" : "text-slate-600 hover:text-slate-400"
              }`}
            >
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

// ─── Tab: Tracker ─────────────────────────────────────────────────────────────
function TrackerView({ expenses, onDelete, monthTotal, todayTotal, onAddClick }) {
  return (
    <>
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-slate-500 text-sm font-medium">Expense Tracker</p>
          <h1 className="text-2xl font-black text-white leading-tight">Overview</h1>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
          <Wallet size={20} className="text-emerald-400" />
        </div>
      </div>

      <HeroCard monthTotal={monthTotal} todayTotal={todayTotal} />

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
            {expenses.map((exp) => (
              <ExpenseRow key={exp.id} expense={exp} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>

      {/* FAB — only shown on Tracker tab */}
      <button
        onClick={onAddClick}
        className="fixed bottom-20 right-5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 transition-all z-20"
        aria-label="Add expense"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </>
  );
}

// ─── Tab: Analytics ───────────────────────────────────────────────────────────
function AnalyticsView({ expenses }) {
  const month = monthISO();
  const monthExpenses = expenses.filter((e) => e.date.startsWith(month));
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const avgTx = monthExpenses.length > 0 ? monthTotal / monthExpenses.length : 0;

  return (
    <>
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-slate-500 text-sm font-medium">This Month</p>
          <h1 className="text-2xl font-black text-white leading-tight">Analytics</h1>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
          <PieIcon size={20} className="text-emerald-400" />
        </div>
      </div>

      {/* Quick stats */}
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

// ─── Tab: Tips ────────────────────────────────────────────────────────────────
function TipsView() {
  return (
    <>
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-slate-500 text-sm font-medium">Build Wealth</p>
          <h1 className="text-2xl font-black text-white leading-tight">Financial Tips</h1>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
          <Lightbulb size={20} className="text-emerald-400" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {TIPS.map((tip, i) => <TipCard key={i} tip={tip} />)}
      </div>
    </>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("tracker");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    store.load().then((data) => { setExpenses(data); setReady(true); });
  }, []);

  useEffect(() => {
    if (ready) store.save(expenses);
  }, [expenses, ready]);

  const addExpense    = (exp) => setExpenses((prev) => [exp, ...prev]);
  const deleteExpense = (id)  => setExpenses((prev) => prev.filter((e) => e.id !== id));

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

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
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
          />
        )}
        {activeTab === "analytics" && <AnalyticsView expenses={expenses} />}
        {activeTab === "tips" && <TipsView />}
      </div>

      <BottomNav active={activeTab} onChange={setActiveTab} />

      {showForm && <AddExpenseModal onAdd={addExpense} onClose={() => setShowForm(false)} />}
    </div>
  );
}
