import assert from "node:assert/strict";
import { overdueReminderIds } from "../src/property_job.ts";

const result = overdueReminderIds({
  maintenance: [],
  documents: [],
  reminders: [
    { id: "past", requestId: "m-1", dueOn: "2026-10-20" },
    { id: "today", requestId: "m-2", dueOn: "2026-10-25" },
    { id: "future", requestId: "m-3", dueOn: "2026-10-30" }
  ],
  today: "2026-10-25"
});

assert.deepEqual(result, ["past"]);
console.log("job decision test passed");
