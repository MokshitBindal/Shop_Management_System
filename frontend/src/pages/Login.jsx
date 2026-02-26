import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingCart, Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { MOCK_USERS } from "../lib/mockData";
import { cn, ROLE_CONFIG } from "../lib/utils";
import { loginSchema } from "../lib/schemas";
import toast from "react-hot-toast";

const ROLE_ICONS = {
  boss: { icon: "👑", desc: "Full access — orders, metrics, EOD, backups" },
  manager: { icon: "🧑‍💼", desc: "Verify orders, attendance, inventory view" },
  employee: { icon: "🧑‍🏭", desc: "Receive orders, checklist, attendance" },
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { passcode: "" },
  });

  const passcode = watch("passcode");
  const [showPin, setShowPin] = [false, () => {}]; // local toggle — use a ref trick below

  const onSubmit = async ({ passcode }) => {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const user = login(passcode);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === "boss" ? "/dashboard" : "/orders");
    } catch {
      setError("passcode", { message: "Invalid passcode. Try again." });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Vyapar-Sync</h1>
            <p className="mt-1 text-sm text-slate-500">
              Local-First Shop Management
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full">
              <Shield className="w-3 h-3 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">
                Secure · No Cloud · Private
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Passcode
                </label>
                <div className="relative">
                  <input
                    {...register("passcode")}
                    type="password"
                    placeholder="Enter your passcode"
                    className={cn(
                      "w-full px-4 py-3 text-sm border rounded-xl bg-white",
                      "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
                      "transition-colors duration-150 pr-10 text-center tracking-[0.4em] text-lg font-mono",
                      errors.passcode ? "border-red-400" : "border-slate-200",
                    )}
                    autoFocus
                    maxLength={8}
                  />
                </div>
                {errors.passcode && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.passcode.message}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !passcode}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-semibold text-white",
                  "bg-brand-600 hover:bg-brand-700 active:bg-brand-800",
                  "transition-colors duration-150",
                  "flex items-center justify-center gap-2",
                  (isSubmitting || !passcode) &&
                    "opacity-60 cursor-not-allowed",
                )}
              >
                {isSubmitting && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {isSubmitting ? "Verifying..." : "Sign In"}
              </button>
            </form>

            {/* Demo quick-login */}
            <div className="mt-6">
              <p className="text-xs font-medium text-slate-400 text-center mb-3 uppercase tracking-wider">
                Demo Accounts
              </p>
              <div className="grid grid-cols-3 gap-2">
                {MOCK_USERS.slice(0, 3).map((u) => (
                  <button
                    key={u.id}
                    onClick={() =>
                      setValue("passcode", u.passcode, {
                        shouldValidate: false,
                      })
                    }
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all duration-150 group"
                  >
                    <span className="text-xl">{ROLE_ICONS[u.role]?.icon}</span>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-700 group-hover:text-brand-700 truncate w-full">
                        {u.name.split(" ")[0]}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] font-medium capitalize mt-0.5",
                          ROLE_CONFIG[u.role]?.color
                            .replace("bg-", "text-")
                            .split(" ")[1] ?? "text-slate-500",
                        )}
                      >
                        {ROLE_CONFIG[u.role]?.label}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Click a card to fill passcode, then sign in
              </p>
            </div>
          </div>
        </div>

        <p className="text-center mt-4 text-xs text-white/40">
          All data stored locally · Zero cloud access
        </p>
      </div>
    </div>
  );
}
