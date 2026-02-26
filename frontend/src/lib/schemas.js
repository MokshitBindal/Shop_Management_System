import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────
export const loginSchema = z.object({
  passcode: z
    .string()
    .min(4, "Passcode must be at least 4 digits")
    .max(8, "Passcode must be at most 8 characters")
    .regex(/^\d+$/, "Passcode must be numeric"),
});

// ── Employee management ───────────────────────────────────────
export const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["manager", "employee"]),
  passcode: z
    .string()
    .regex(/^\d{4,8}$/, "Passcode must be 4–8 digits")
    .or(z.literal("")),
  macAddress: z
    .string()
    .regex(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, "Invalid MAC address format")
    .or(z.literal(""))
    .optional(),
  wireguardKey: z.string().optional(),
});

export const newEmployeeSchema = employeeSchema.extend({
  passcode: z.string().regex(/^\d{4,8}$/, "Passcode must be 4–8 digits"),
});

// ── New order ─────────────────────────────────────────────────
export const newOrderSchema = z
  .object({
    customerName: z.string().min(1, "Customer name is required"),
    customerPhone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
      .or(z.literal(""))
      .optional(),
    paymentMethod: z.enum(["cash", "upi", "credit", "mixed"]),
    isDelivery: z.boolean(),
    assigneeId: z.string().optional(),
    discount: z.coerce.number().min(0).max(100000).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => !data.isDelivery || (data.assigneeId && data.assigneeId !== ""),
    { message: "Assign a delivery person", path: ["assigneeId"] },
  );

// ── Shop settings ─────────────────────────────────────────────
export const shopSettingsSchema = z.object({
  shopName: z.string().min(2, "Shop name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  address: z.string().min(5, "Address is required"),
  phone: z.string().regex(/^\+?[\d\s\-()]{7,15}$/, "Invalid phone number"),
  gstin: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GSTIN format",
    )
    .or(z.literal(""))
    .optional(),
});

// ── Record payment ────────────────────────────────────────────
export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(["cash", "upi"]),
  note: z.string().max(200).optional(),
});

// ── Ledger correction ─────────────────────────────────────────
export const correctionSchema = z.object({
  field: z.string().min(1, "Field is required"),
  originalValue: z.string(),
  correctedValue: z.string().min(1, "Corrected value is required"),
  reason: z.string().min(5, "Please provide a reason (min 5 characters)"),
});
