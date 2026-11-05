import { captureJobFailure } from "./infrai_errors.ts";
import { z } from "zod";

export type MaintenanceRequest = { id: string; unit: string; summary: string };
export type TenantDocument = { id: string; tenantId: string; kind: string; expiresOn: string };
export type InspectionReminder = { id: string; requestId: string; dueOn: string };

export type PropertyJobInput = {
  maintenance: MaintenanceRequest[];
  documents: TenantDocument[];
  reminders: InspectionReminder[];
  today: string;
};

export type JobResult = { status: "healthy" | "failed"; overdue: string[]; alertSent: boolean };

const propertyJobBody = z.object({
  maintenance: z.array(z.object({ id: z.string(), unit: z.string(), summary: z.string() })),
  documents: z.array(z.object({ id: z.string(), tenantId: z.string(), kind: z.string(), expiresOn: z.string() })),
  reminders: z.array(z.object({ id: z.string(), requestId: z.string(), dueOn: z.string() })),
  today: z.string()
});

export function parsePropertyJobBody(body: unknown): PropertyJobInput {
  // Zod validates required fields even when strictNullChecks is disabled.
  return propertyJobBody.parse(body) as PropertyJobInput;
}

export function overdueReminderIds(input: PropertyJobInput): string[] {
  return input.reminders.filter((item) => item.dueOn < input.today).map((item) => item.id);
}

export async function runInspectionReminderJob(input: PropertyJobInput): Promise<JobResult> {
  const overdue = overdueReminderIds(input);
  if (overdue.length === 0) return { status: "healthy", overdue, alertSent: false };

  const message = `Inspection reminders overdue: ${overdue.join(", ")}`;
  try {
    await captureJobFailure({
      title: "property inspection reminder job failed",
      message,
      exception: message,
      fingerprint: ["property-management", "inspection-reminders"],
      context: { overdue, maintenanceCount: input.maintenance.length, documentCount: input.documents.length }
    });
    return { status: "failed", overdue, alertSent: true };
  } catch {
    return { status: "failed", overdue, alertSent: false };
  }
}
