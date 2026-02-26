import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Search } from "lucide-react";

export const Input = forwardRef(function Input(
  { className, label, error, hint, icon: Icon, ...props },
  ref,
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className="w-4 h-4 text-slate-400" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg",
            "bg-white text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
            "transition-colors duration-150",
            "disabled:bg-slate-50 disabled:text-slate-400",
            Icon && "pl-9",
            error &&
              "border-red-400 focus:ring-red-400/30 focus:border-red-400",
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
});

export function SearchInput({ className, ...props }) {
  return <Input icon={Search} className={cn("", className)} {...props} />;
}

export const Select = forwardRef(function Select(
  { label, error, className, options = [], ...props },
  ref,
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg",
          "bg-white text-slate-900",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
          "transition-colors duration-150 cursor-pointer",
          "disabled:bg-slate-50 disabled:text-slate-400",
          error && "border-red-400",
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, className, rows = 3, ...props },
  ref,
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg",
          "bg-white text-slate-900 placeholder:text-slate-400 resize-none",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
          "transition-colors duration-150",
          error && "border-red-400 focus:ring-red-400/30 focus:border-red-400",
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});
