// Single source of truth for the task-naming convention the Stage 2 prompt
// must follow and evalChecks.ts relies on to classify tasks. The AI's JSON
// schema has no explicit "kind" field (spec §5) — task type is inferred from
// the verb the task name starts with. Keeping the verb lists in one file
// means the prompt instructions and the eval regexes can never drift apart.

export const PREP_VERB_WORDS = [
  "prep",
  "wash",
  "chop",
  "cut",
  "dice",
  "slice",
  "julienne",
  "mince",
  "soak",
  "marinate",
  "measure",
  "set up",
  "setup",
  "portion ingredients",
  "trim",
  "peel",
];

export const COOK_VERB_WORDS = [
  "cook",
  "boil",
  "stir-fry",
  "stir fry",
  "braise",
  "simmer",
  "fry",
  "steam",
  "saute",
  "sauté",
  "glaze",
  "package",
  "assemble",
];

export const PREP_VERBS = new RegExp(`^(${PREP_VERB_WORDS.join("|")})`, "i");
export const COOK_VERBS = new RegExp(`^(${COOK_VERB_WORDS.join("|")})`, "i");

/** check 5 (refrigeration) keys off these two task-name patterns. */
export const PACKAGE_KEYWORD_PATTERN = /packag/i;
export const REFRIGERATE_KEYWORD_PATTERN = /refrigerat|chill|cool/i;

export const PACKAGE_TASK_EXAMPLE = "Package box A";
export const REFRIGERATE_TASK_EXAMPLE = "Refrigerate box A";
