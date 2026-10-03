import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "process recurring transactions",
  { hours: 1 },
  internal.recurring.processDue,
);

export default crons;
