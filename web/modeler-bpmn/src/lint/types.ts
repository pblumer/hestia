// eCH-0158-Linter — Typen (ADR-0008, INV-B4). Ein opt-in-Konventionsprofil:
// alle Befunde sind Warnungen/Hinweise, blockieren nie das Speichern und
// schwächen nie die XSD-Gültigkeit.
/* eslint-disable @typescript-eslint/no-explicit-any */

export type Severity = "error" | "warning" | "hint";
export type RuleKind = "mechanic" | "heuristic";
export type Mode = "descriptive" | "analytic";
/** "mechanic": nur mechanische Regeln (CI-Register). "all": auch Heuristiken. */
export type Register = "all" | "mechanic";

export interface Violation {
  ruleId: string;
  severity: Severity;
  elementId?: string;
  message: string;
  specRef: string;
}

export interface RuleContext {
  definitions: any;
  mode: Mode;
  params: Record<string, unknown>;
}

export interface Rule {
  id: string;
  element: string;
  kind: RuleKind;
  /** Vorgesehener Schweregrad (per Config überschreibbar). */
  severity: Severity;
  /** eCH-0158-Kapitel. */
  specRef: string;
  description: string;
  /** deskriptiv motiviert -> bei aktiver Analytic-Palette entschärft. */
  relaxInAnalytic?: boolean;
  /** Standard-Parameter (z. B. Grenzwerte). */
  params?: Record<string, unknown>;
  /** Nur wenn implementiert wird die Regel ausgeführt. */
  implemented: boolean;
  check?(ctx: RuleContext): Violation[];
}

export interface LinterConfig {
  mode?: Mode;
  register?: Register;
  /** Pro Regel an/aus + Schweregrad-Override. */
  rules?: Record<string, { enabled?: boolean; severity?: Severity }>;
  /** Pro Regel Parameter-Override (z. B. Aktivitäten-Max). */
  params?: Record<string, Record<string, unknown>>;
}
