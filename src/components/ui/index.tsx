"use client";
import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  loading?: boolean;
}
export function Button({ variant = "primary", size = "md", children, loading, className, disabled, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-display font-semibold rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.97]";
  const variants = {
    primary: "bg-accent-red hover:bg-red-500 text-white shadow-lg shadow-accent-red/20 hover:shadow-accent-red/30 hover:-translate-y-px",
    secondary: "bg-bg-elevated hover:bg-bg-border text-text-primary border border-bg-border hover:border-[#2a2a3a] hover:-translate-y-px",
    ghost: "bg-transparent hover:bg-bg-elevated text-text-secondary hover:text-text-primary",
    danger: "bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-900/50 hover:border-red-700/50",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs h-8", md: "px-4 py-2 text-sm h-9", lg: "px-6 py-3 text-sm h-11" };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />}
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, hover }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={cn("bg-bg-card border border-bg-border rounded-2xl p-5", hover && "card-hover cursor-pointer", className)}>
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; prefix?: string; suffix?: string; hint?: string;
}
export function Input({ label, error, prefix, suffix, hint, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex justify-between items-center">
          <label htmlFor={inputId} className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider">{label}</label>
          {hint && <span className="text-[10px] text-text-muted">{hint}</span>}
        </div>
      )}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-text-muted text-sm font-mono pointer-events-none">{prefix}</span>}
        <input
          id={inputId}
          className={cn(
            "w-full bg-bg-elevated border rounded-lg text-text-primary text-sm placeholder:text-text-muted transition-all duration-150",
            "focus:outline-none focus:ring-2",
            error
              ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10"
              : "border-bg-border hover:border-[#2a2a3a] focus:border-accent-red/50 focus:ring-accent-red/10",
            prefix ? "pl-7" : "pl-3.5",
            suffix ? "pr-7" : "pr-3.5",
            "py-2.5",
            className
          )}
          {...props}
        />
        {suffix && <span className="absolute right-3 text-text-muted text-sm pointer-events-none">{suffix}</span>}
      </div>
      {error && <span className="text-[11px] text-red-400 flex items-center gap-1">⚠ {error}</span>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; children: ReactNode;
}
export function Select({ label, error, children, className, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={selectId} className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "w-full bg-bg-elevated border rounded-lg text-text-primary text-sm py-2.5 pl-3.5 pr-9 appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 transition-all duration-150",
            error
              ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10"
              : "border-bg-border hover:border-[#2a2a3a] focus:border-accent-red/50 focus:ring-accent-red/10",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col gap-0.5">
          <ChevronUp size={10} className="text-text-muted" />
          <ChevronDown size={10} className="text-text-muted" />
        </div>
      </div>
      {error && <span className="text-[11px] text-red-400">⚠ {error}</span>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string;
}
export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={textareaId} className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider">{label}</label>}
      <textarea
        id={textareaId}
        className={cn(
          "w-full bg-bg-elevated border border-bg-border hover:border-[#2a2a3a] rounded-lg text-text-primary text-sm py-2.5 px-3.5 resize-none",
          "focus:outline-none focus:border-accent-red/50 focus:ring-2 focus:ring-accent-red/10 transition-all duration-150",
          "placeholder:text-text-muted",
          error && "border-red-500/50",
          className
        )}
        {...props}
      />
      {error && <span className="text-[11px] text-red-400">⚠ {error}</span>}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border tracking-wide", className)}>
      {children}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, color = "red", trend }: {
  label: string; value: string | number; sub?: string; icon?: ReactNode;
  color?: "red" | "green" | "amber" | "blue"; trend?: { value: number; label: string };
}) {
  const colors = {
    red:   { border: "border-accent-red/15",   glow: "from-accent-red/8",   icon: "bg-accent-red/10 text-accent-red",   dot: "bg-accent-red" },
    green: { border: "border-emerald-500/15",  glow: "from-emerald-500/8",  icon: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400" },
    amber: { border: "border-amber-500/15",    glow: "from-amber-500/8",    icon: "bg-amber-500/10 text-amber-400",     dot: "bg-amber-400" },
    blue:  { border: "border-blue-500/15",     glow: "from-blue-500/8",     icon: "bg-blue-500/10 text-blue-400",       dot: "bg-blue-400" },
  };
  const c = colors[color];
  return (
    <div className={cn("relative bg-bg-card border rounded-2xl p-5 overflow-hidden card-hover", c.border)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none", c.glow)} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <span className="text-[10px] font-display font-black text-text-muted uppercase tracking-widest">{label}</span>
          {icon && (
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", c.icon)}>
              {icon}
            </div>
          )}
        </div>
        <div className="text-2xl font-display font-black text-text-primary tracking-tight leading-none mb-1.5">{value}</div>
        {sub && <div className="text-[11px] text-text-muted">{sub}</div>}
        {trend && (
          <div className={cn("text-[11px] mt-2 font-bold flex items-center gap-1", trend.value >= 0 ? "text-emerald-400" : "text-red-400")}>
            {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode; title: string; description: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-bg-border flex items-center justify-center mb-5 text-text-muted">
        {icon}
      </div>
      <h3 className="font-display font-bold text-text-primary text-base mb-2">{title}</h3>
      <p className="text-text-secondary text-sm max-w-xs leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative bg-bg-card border border-bg-border w-full shadow-2xl",
        "rounded-t-2xl sm:rounded-2xl",
        "max-h-[92vh] overflow-y-auto",
        maxWidth
      )}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-bg-border bg-bg-card/95 backdrop-blur-sm">
          <h2 className="font-display font-bold text-text-primary text-base">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg", className)} />;
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="font-display font-bold text-text-primary text-sm">{title}</h2>
        {subtitle && <p className="text-[11px] text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
