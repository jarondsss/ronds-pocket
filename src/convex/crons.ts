import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "process recurring transactions",
  { hours: 1 },
  internal.recurring.processDue,
);

crons.daily(
  "process bill reminders",
  { hourUTC: 17, minuteUTC: 0 }, // 5 PM UTC = midnight WIB
  internal.billReminders.processReminders,
);

export default crons;
