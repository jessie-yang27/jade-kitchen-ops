// Foundation Kitchen station inventory. PLACEHOLDER counts — spec §9 open
// question #2: confirm the real burner/prep-table/rice-cooker/oven counts
// before the v2 live-connector swap. Must stay a subset of the
// ScheduleResource union in domain/types.ts.

import type { ScheduleResource } from "../domain/types";

export const availableResources: Exclude<ScheduleResource, "none">[] = [
  "burner-1",
  "burner-2",
  "prep-table",
  "rice-cooker",
];
