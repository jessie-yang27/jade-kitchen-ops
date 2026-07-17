import type { WeeklyDrop } from "../domain/types";
import { MockBadge } from "./MockBadge";

export type LaunchLogEntry = { label: string; done: boolean };

type Props = {
  drop: WeeklyDrop;
  log: LaunchLogEntry[];
};

export function Stage1Card({ drop, log }: Props) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>
          Stage 1 — Monday launch <span className="day-tag">Mon</span>
        </h2>
        <MockBadge />
      </div>

      {log.length === 0 ? (
        <p className="hint">Launch the week above to run the Shopify rollover.</p>
      ) : (
        <ul className="checklist">
          {log.map((entry, i) => (
            <li key={i} className={entry.done ? "done" : "pending"}>
              {entry.done ? "✓" : "…"} {entry.label}
            </li>
          ))}
        </ul>
      )}

      <div className="placeholder-note">
        <p className="hint">
          Launch email + SMS teaser (AI-generated, voice-matched to past launches) land in the next
          build step. {drop.status === "launched" && "This drop is ready for that copy once it exists."}
        </p>
      </div>
    </section>
  );
}
