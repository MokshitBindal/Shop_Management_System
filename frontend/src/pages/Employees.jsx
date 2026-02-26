import { useState } from "react";
import {
  Plus,
  Edit2,
  ShieldOff,
  ShieldCheck,
  Wifi,
  WifiOff,
  Key,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Modal, ConfirmModal } from "../components/ui/Modal";
import { RoleBadge } from "../components/ui/Badge";
import { MOCK_USERS } from "../lib/mockData";
import { employeeSchema, newEmployeeSchema } from "../lib/schemas";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

export default function Employees() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState(MOCK_USERS);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editing ? employeeSchema : newEmployeeSchema),
  });

  const openNew = () => {
    setEditing(null);
    reset({
      name: "",
      role: "employee",
      passcode: "",
      macAddress: "",
      wireguardKey: "",
    });
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    reset({
      name: emp.name,
      role: emp.role,
      passcode: "",
      macAddress: emp.macAddress ?? "",
      wireguardKey: emp.wireguardKey ?? "",
    });
    setShowModal(true);
  };

  const onSubmit = (data) => {
    if (editing) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editing.id
            ? { ...e, ...data, passcode: data.passcode || e.passcode }
            : e,
        ),
      );
      toast.success("Employee updated");
    } else {
      setEmployees((prev) => [
        ...prev,
        { id: Date.now(), ...data, active: true },
      ]);
      toast.success("Employee added");
    }
    setShowModal(false);
  };

  if (user.role !== "boss") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <ShieldOff className="w-10 h-10" />
        <p className="text-sm font-medium">Access restricted to Boss only</p>
      </div>
    );
  }

  const toggleDeactivate = (emp) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === emp.id ? { ...e, active: !e.active } : e)),
    );
    toast.success(
      emp.active ? `${emp.name} deactivated` : `${emp.name} reactivated`,
    );
    setDeactivateTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {employees.filter((e) => e.active !== false).length} active
          </p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Employee
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {employees.map((emp) => {
            const inactive = emp.active === false;
            return (
              <div
                key={emp.id}
                className={`flex items-center gap-4 px-5 py-4 ${inactive ? "opacity-50" : ""}`}
              >
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

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-800">{emp.name}</p>
                    <RoleBadge role={emp.role} />
                    {inactive && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {/* VPN status */}
                    {emp.wireguardKey ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <Wifi className="w-3 h-3" /> VPN Enrolled
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <WifiOff className="w-3 h-3" /> No VPN
                      </span>
                    )}
                    {/* MAC */}
                    {emp.macAddress && (
                      <span className="text-xs text-slate-400 font-mono">
                        {emp.macAddress}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(emp)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant={inactive ? "secondary" : "danger"}
                    size="sm"
                    onClick={() =>
                      inactive
                        ? toggleDeactivate(emp)
                        : setDeactivateTarget(emp)
                    }
                  >
                    {inactive ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldOff className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Employee" : "Add Employee"}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
              {editing ? "Save Changes" : "Add Employee"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input
            label="Full Name"
            {...register("name")}
            error={errors.name?.message}
            placeholder="e.g. Ravi Kumar"
          />
          <Select
            label="Role"
            {...register("role")}
            error={errors.role?.message}
            options={[
              { value: "manager", label: "Manager" },
              { value: "employee", label: "Employee" },
            ]}
          />
          <Input
            label={
              editing
                ? "New Passcode (leave blank to keep current)"
                : "Passcode (4–8 digits)"
            }
            type="password"
            {...register("passcode")}
            error={errors.passcode?.message}
            placeholder={editing ? "••••" : "1234"}
          />
          <Input
            label="MAC Address"
            {...register("macAddress")}
            error={errors.macAddress?.message}
            placeholder="AA:BB:CC:DD:EE:FF"
          />
          <Input
            label={
              <span className="flex items-center gap-1">
                <Key className="w-3 h-3" /> WireGuard Public Key
              </span>
            }
            {...register("wireguardKey")}
            error={errors.wireguardKey?.message}
            placeholder="Base64 WireGuard public key"
          />
        </form>
      </Modal>

      {/* Deactivate confirm */}
      <ConfirmModal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => toggleDeactivate(deactivateTarget)}
        title="Deactivate Employee"
        message={`This will revoke ${deactivateTarget?.name}'s VPN key and prevent login. You can reactivate them later.`}
        confirmLabel="Deactivate"
        danger
      />
    </div>
  );
}
