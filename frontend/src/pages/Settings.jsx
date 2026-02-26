import { useState } from "react";
import { Store, Printer, Wifi, Save, RefreshCw, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { Card, CardHeader, CardContent } from "../components/ui/Card";
import { shopSettingsSchema } from "../lib/schemas";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

export default function Settings() {
  const { user } = useAuthStore();

  const {
    register: shopRegister,
    handleSubmit: handleShopSubmit,
    formState: { errors: shopErrors },
  } = useForm({
    resolver: zodResolver(shopSettingsSchema),
    defaultValues: {
      shopName: "Vikram General Store",
      ownerName: "Vikram Sharma",
      address: "12, Main Market, Sector 4, Noida – 201301",
      phone: "+91 98765 43210",
      gstin: "07AAACV1234F1Z5",
    },
  });

  const [printerForm, setPrinterForm] = useState({
    connectionType: "bluetooth",
    printerName: "",
    ipAddress: "",
    port: "9100",
    paperWidth: "80mm",
  });

  const [vpnForm, setVpnForm] = useState({
    serverEndpoint: "",
    serverPublicKey: "",
    allowedIPs: "10.0.0.0/8",
    dns: "1.1.1.1",
  });

  const [backupLoading, setBackupLoading] = useState(false);

  if (user.role !== "boss") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <Store className="w-10 h-10" />
        <p className="text-sm font-medium">Access restricted to Boss only</p>
      </div>
    );
  }

  const saveShop = (data) => toast.success("Shop info saved");
  const savePrinter = () => toast.success("Printer settings saved");
  const saveVPN = () => toast.success("VPN settings saved");

  const handleBackup = async () => {
    setBackupLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const blob = new Blob(
      [JSON.stringify({ backup: true, timestamp: Date.now() }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shop-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    setBackupLoading(false);
    toast.success("Backup downloaded");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage shop info, printer, and system config
        </p>
      </div>

      {/* Shop Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold text-slate-800">Shop Information</h2>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleShopSubmit(saveShop)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Shop Name"
                {...shopRegister("shopName")}
                error={shopErrors.shopName?.message}
              />
              <Input
                label="Owner Name"
                {...shopRegister("ownerName")}
                error={shopErrors.ownerName?.message}
              />
              <Input
                label="Phone"
                {...shopRegister("phone")}
                error={shopErrors.phone?.message}
              />
              <Input
                label="GSTIN"
                {...shopRegister("gstin")}
                error={shopErrors.gstin?.message}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Address (for receipts)"
                  {...shopRegister("address")}
                  error={shopErrors.address?.message}
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" type="submit">
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Shop Info
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Printer */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold text-slate-800">
              Receipt Printer (ESC/POS)
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Connection Type"
              value={printerForm.connectionType}
              onChange={(e) =>
                setPrinterForm((f) => ({
                  ...f,
                  connectionType: e.target.value,
                }))
              }
              options={[
                { value: "bluetooth", label: "Bluetooth" },
                { value: "lan", label: "LAN / Network" },
                { value: "usb", label: "USB" },
              ]}
            />
            <Select
              label="Paper Width"
              value={printerForm.paperWidth}
              onChange={(e) =>
                setPrinterForm((f) => ({ ...f, paperWidth: e.target.value }))
              }
              options={[
                { value: "58mm", label: "58mm" },
                { value: "80mm", label: "80mm" },
              ]}
            />
            {printerForm.connectionType === "bluetooth" && (
              <Input
                label="Printer Name / ID"
                value={printerForm.printerName}
                onChange={(e) =>
                  setPrinterForm((f) => ({ ...f, printerName: e.target.value }))
                }
                placeholder="e.g. POS-80"
              />
            )}
            {printerForm.connectionType === "lan" && (
              <>
                <Input
                  label="IP Address"
                  value={printerForm.ipAddress}
                  onChange={(e) =>
                    setPrinterForm((f) => ({ ...f, ipAddress: e.target.value }))
                  }
                  placeholder="192.168.1.100"
                />
                <Input
                  label="Port"
                  value={printerForm.port}
                  onChange={(e) =>
                    setPrinterForm((f) => ({ ...f, port: e.target.value }))
                  }
                  placeholder="9100"
                />
              </>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast("Print test page sent")}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Test Print
            </Button>
            <Button size="sm" onClick={savePrinter}>
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save Printer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WireGuard VPN */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold text-slate-800">
              WireGuard VPN Config
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Server Endpoint"
              value={vpnForm.serverEndpoint}
              onChange={(e) =>
                setVpnForm((f) => ({ ...f, serverEndpoint: e.target.value }))
              }
              placeholder="vpn.yourshop.com:51820"
            />
            <Input
              label="Server Public Key"
              value={vpnForm.serverPublicKey}
              onChange={(e) =>
                setVpnForm((f) => ({ ...f, serverPublicKey: e.target.value }))
              }
              placeholder="Base64 public key"
            />
            <Input
              label="Allowed IPs"
              value={vpnForm.allowedIPs}
              onChange={(e) =>
                setVpnForm((f) => ({ ...f, allowedIPs: e.target.value }))
              }
              placeholder="10.0.0.0/8"
            />
            <Input
              label="DNS"
              value={vpnForm.dns}
              onChange={(e) =>
                setVpnForm((f) => ({ ...f, dns: e.target.value }))
              }
              placeholder="1.1.1.1"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={saveVPN}>
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save VPN Config
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold text-slate-800">Data Backup</h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">
            Download a full JSON backup of all shop data.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBackup}
            loading={backupLoading}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {backupLoading ? "Exporting…" : "Download Backup"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
