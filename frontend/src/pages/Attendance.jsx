import { useState } from "react";
import { CalendarDays, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "../components/ui/Button";
import { formatDate, cn } from "../lib/utils";
import { MOCK_ATTENDANCE, MOCK_USERS } from "../lib/mockData";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  present: {
    label: "Present",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  absent: {
    label: "Absent",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
  leave: {
    label: "Leave",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: CalendarDays,
  },
  "half-day": {
    label: "Half Day",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
};

export default function Attendance() {
  const { user } = useAuthStore();
  const [attendance, setAttendance] = useState(MOCK_ATTENDANCE);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const employees = MOCK_USERS.filter((u) => u.role !== "boss");

  const getRecord = (userId) =>
    attendance.find((a) => {
      const aDate = new Date(a.date).toISOString().split("T")[0];
      return a.userId === userId && aDate === date;
    });

  const setStatus = (userId, status) => {
    setAttendance((prev) => {
      const existing = prev.find((a) => {
        const aDate = new Date(a.date).toISOString().split("T")[0];
        return a.userId === userId && aDate === date;
      });
      if (existing) {
        return prev.map((a) => (a === existing ? { ...a, status } : a));
      }
      return [
        ...prev,
        {
          id: Date.now(),
          userId,
          date: new Date().toISOString(),
          checkIn: status === "present" ? "09:00" : null,
          checkOut: null,
          markedBy: user.id,
          status,
        },
      ];
    });
    const emp = MOCK_USERS.find((u) => u.id === userId);
    toast.success(`${emp?.name} marked as ${status}`, { duration: 1500 });
  };

  const presentCount = employees.filter(
    (e) => getRecord(e.id)?.status === "present",
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {presentCount}/{employees.length} present today
          </p>
        </div>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">
            {formatDate(new Date(date))}
          </span>
          <span className="text-slate-500">
            {presentCount} / {employees.length} present
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{
              width: `${employees.length ? (presentCount / employees.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Employee list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {employees.map((emp) => {
            const record = getRecord(emp.id);
            const status = record?.status ?? null;
            const cfg = status ? STATUS_CONFIG[status] : null;

            return (
              <div key={emp.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-brand-700">
                    {emp.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800">{emp.name}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    {emp.role}
                  </p>
                </div>

                {/* Check-in time */}
                {record?.checkIn && (
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-400">Check-in</p>
                    <p className="text-sm font-medium text-slate-700">
                      {record.checkIn}
                    </p>
                  </div>
                )}

                {/* Status buttons */}
                {user.role !== "employee" ? (
                  <div className="flex gap-1.5">
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => {
                      const Icon = val.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setStatus(emp.id, key)}
                          title={val.label}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-100",
                            status === key
                              ? cn(
                                  val.color,
                                  "ring-2 ring-offset-1",
                                  key === "present"
                                    ? "ring-emerald-400"
                                    : key === "absent"
                                      ? "ring-red-400"
                                      : "ring-amber-400",
                                )
                              : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600",
                          )}
                        >
                          <Icon className="w-3 h-3" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Employee just sees their own status */
                  emp.id === user.id &&
                  cfg && (
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        cfg.color,
                      )}
                    >
                      {cfg.label}
                    </span>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
