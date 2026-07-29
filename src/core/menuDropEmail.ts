// Assembles the full Monday launch email from AI-generated creative copy
// (header line, per-box flavor blurbs, SMS teaser) plus deterministic parts
// (dates, box menu listing, sign-off). The AI never sees or invents dates —
// those are computed by campaignDates.ts and handed in already formatted.

import { addDays, FULFILLMENT_WINDOW, formatLongDate, orderDeadlineLabel } from "./campaignDates";

export type BoxMenuInfo = {
  label: string; // themeName or "Box A"
  blurb: string; // AI-generated flavor description
  riceName: string;
  dishNames: string[]; // meat1, meat2, veggie — in that order
};

export type MenuDropCopy = {
  headerLine: string;
  sms: string;
  boxA: BoxMenuInfo;
  boxB: BoxMenuInfo;
};

const SIGN_OFF =
  "As always, thanks for being part of the Jade Kitchen community — please let us know if you have any questions or feedback!\n\nWith love, Jessie + the Jade Kitchen team";

function boxSection(emoji: string, box: BoxMenuInfo): string {
  return `${emoji} ${box.label}

${box.blurb}

${box.riceName}
+ ${box.dishNames.join("\n+ ")}`;
}

export function assembleMenuDropEmail(copy: MenuDropCopy, weekOf: string): { subject: string; body: string } {
  const fulfillmentDate = formatLongDate(weekOf);
  const subject = `${copy.headerLine} — order by ${formatLongDate(addDays(weekOf, -2), false)}`;

  const body = `${copy.headerLine}
Order for Pickup or Delivery this ${fulfillmentDate}

Hi Jade Kitchen community,

💚 This Week's Details 💚
Order By: ${orderDeadlineLabel(weekOf)}
Pickup / Delivery On: ${fulfillmentDate} from ${FULFILLMENT_WINDOW}

🍽️ This Week's Menu:

${boxSection("🫶", copy.boxA)}

${boxSection("🥢", copy.boxB)}

${SIGN_OFF}`;

  return { subject, body };
}
