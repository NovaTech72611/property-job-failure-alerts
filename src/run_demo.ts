import { parsePropertyJobBody, runInspectionReminderJob } from "./property_job.ts";

const input = parsePropertyJobBody({
  maintenance: [{ id: "m-101", unit: "4B", summary: "leaking kitchen tap" }],
  documents: [{ id: "d-22", tenantId: "tenant-7", kind: "lease", expiresOn: "2027-02-01" }],
  reminders: [{ id: "inspection-4b", requestId: "m-101", dueOn: "2026-10-20" }],
  today: "2026-10-25"
});

const result = await runInspectionReminderJob(input);
console.log(JSON.stringify(result, null, 2));
