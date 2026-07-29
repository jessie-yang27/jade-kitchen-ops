import { useMemo, useState } from "react";
import type { BoxCounts } from "../core/grocery";
import { buildGroceryList, diffAgainstInventory, groupBySection } from "../core/grocery";
import { groupTasksByPrepCategory, PREP_CATEGORIES, PREP_CATEGORY_LABELS } from "../core/prepCategory";
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

export function CookingDayCard({ drop, boxCounts, dishById, inventory, roster, availableResources }: Props) {
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
  const grouped = result?.plan ? groupTasksByPrepCategory(result.plan.sundaySequence, dishById) : null;

  return (
    <section className="card card-emphasized">
      <div className="card-header">
        <h2>Cooking Day Prep</h2>
      </div>
      <p className="hint">
        The AI centerpiece. Grocery quantities are computed in code before the model ever sees them, and its
        schedule is graded by seven automated checks before it reaches this screen.
      </p>

      <h4>Order summary</h4>
      <div className="metric-cards">
        <div className="metric">
          <strong>{boxCounts.A}</strong>
          <span>Box A</span>
        </div>
        <div className="metric">
          <strong>{boxCounts.B}</strong>
          <span>Box B</span>
        </div>
      </div>

      <h4>Grocery list</h4>
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
        {loading ? "Generating cook-day plan…" : "Generate cook-day plan (AI)"}
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
              <h4>Night-before prep</h4>
              <ul className="recipe-list">
                {result.plan.saturdayPrep.map((item, i) => (
                  <li key={i}>
                    {item.task} — {item.dish} ({item.assignee}, ~{item.estMinutes} min)
                  </li>
                ))}
              </ul>

              <h4>Cooking day instructions</h4>
              {grouped &&
                PREP_CATEGORIES.map((category) =>
                  grouped[category].length === 0 ? null : (
                    <div key={category} className="prep-category">
                      <h4>{PREP_CATEGORY_LABELS[category]}</h4>
                      <ul className="recipe-list">
                        {grouped[category].map((task) => (
                          <li key={task.id}>
                            {task.start} — {task.task} ({task.assignee}
                            {task.resource !== "none" ? `, ${task.resource}` : ""})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}

              <h4>Volunteer one-pagers</h4>
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
