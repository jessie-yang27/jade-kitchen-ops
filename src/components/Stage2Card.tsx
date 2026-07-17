import { useMemo, useState } from "react";
import type { BoxCounts } from "../core/grocery";
import { buildGroceryList, diffAgainstInventory, groupBySection } from "../core/grocery";
import type { Dish, ScheduleResource, WeeklyDrop } from "../domain/types";
import type { InventoryItem } from "../data/inventory";
import type { RosterMember } from "../data/roster";
import { buildWeeklyContext } from "../ai/context";
import { generateOpsPlan, type OpsPlanRunResult } from "../ai/opsPlan";

type Props = {
  drop: WeeklyDrop;
  boxCounts: BoxCounts;
  dishById: Map<string, Dish>;
  inventory: InventoryItem[];
  roster: RosterMember[];
  availableResources: Exclude<ScheduleResource, "none">[];
};

export function Stage2Card({ drop, boxCounts, dishById, inventory, roster, availableResources }: Props) {
  const groceryList = useMemo(() => buildGroceryList(drop, boxCounts, dishById), [drop, boxCounts, dishById]);
  const groceryGroups = useMemo(
    () => groupBySection(diffAgainstInventory(groceryList.lines, inventory)),
    [groceryList, inventory],
  );

  const [result, setResult] = useState<OpsPlanRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const context = buildWeeklyContext(drop, boxCounts, dishById, inventory, roster, availableResources);
      const outcome = await generateOpsPlan(drop, context, dishById);
      setResult(outcome);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ops plan generation failed");
    } finally {
      setLoading(false);
    }
  }

  const evalResults =
    result === null ? [] : result.status === "ok" ? result.evalResults : (result.attempts.at(-1)?.evalResults ?? []);

  return (
    <section className="card card-emphasized">
      <div className="card-header">
        <h2>
          Stage 2 — Thursday ops plan <span className="day-tag">Thu</span>
        </h2>
      </div>
      <p className="hint">
        The AI centerpiece. Grocery quantities below are computed in code before the model ever sees them.
      </p>

      <h3>Grocery list</h3>
      {groceryGroups.map((group) => (
        <div key={group.section} className="grocery-section">
          <h4>{group.section}</h4>
          <table className="grocery-table">
            <tbody>
              {group.lines.map((line) => (
                <tr key={`${line.name}-${line.unit}`}>
                  <td>{line.name}</td>
                  <td>
                    {line.toBuy} {line.unit} to buy
                  </td>
                  <td className="hint">
                    ({line.onHand} on hand of {line.qty})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {groceryList.pantryChecks.length > 0 && (
        <div className="grocery-section">
          <h4>check inventory (pantry)</h4>
          <p className="hint">{groceryList.pantryChecks.map((p) => p.name).join(", ")}</p>
        </div>
      )}

      <button type="button" className="primary" onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating ops plan…" : "Generate ops plan (AI)"}
      </button>
      {error && <p className="error">{error}</p>}

      {result && (
        <div className="ops-plan-result">
          <div className="eval-pills">
            {evalResults.map((r) => (
              <span key={r.id} className={`eval-pill ${r.passed ? "pass" : "fail"}`}>
                {r.passed ? "✓" : "✗"} {r.name}
              </span>
            ))}
          </div>

          {result.status === "needs-review" && (
            <p className="warning">
              Needs human review — the plan didn't pass every check after {result.attempts.length} attempt(s).
            </p>
          )}

          {result.plan && (
            <>
              <h3>Saturday prep</h3>
              <ul>
                {result.plan.saturdayPrep.map((item, i) => (
                  <li key={i}>
                    {item.task} — {item.dish} ({item.assignee}, ~{item.estMinutes} min)
                  </li>
                ))}
              </ul>

              <h3>Sunday sequence</h3>
              <table className="sequence-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Task</th>
                    <th>Box</th>
                    <th>Assignee</th>
                    <th>Resource</th>
                  </tr>
                </thead>
                <tbody>
                  {result.plan.sundaySequence.map((task) => (
                    <tr key={task.id}>
                      <td>{task.start}</td>
                      <td>{task.task}</td>
                      <td>{task.box}</td>
                      <td>{task.assignee}</td>
                      <td>{task.resource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3>Volunteer one-pagers</h3>
              {result.plan.onePagers.map((page, i) => (
                <details key={i}>
                  <summary>{page.station}</summary>
                  <p>{page.content}</p>
                </details>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}
