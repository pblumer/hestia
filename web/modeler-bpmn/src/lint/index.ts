// eCH-0158-Linter (opt-in-Konventionsprofil, ADR-0008 / INV-B4).
export { lint, lintMechanic } from "./engine";
export { ECH_0158_RULES } from "./rules";
export type {
  Rule,
  Violation,
  Severity,
  RuleKind,
  Mode,
  Register,
  LinterConfig,
} from "./types";
