// moddle-xml liefert keine eigenen Typdeklarationen — minimale Ambient-Typen.
declare module "moddle-xml" {
  export class Reader {
    constructor(model: unknown);
    fromXML(
      xml: string,
      options?: string | Record<string, unknown>,
    ): Promise<{
      rootElement: unknown;
      references?: unknown[];
      warnings?: unknown[];
      elementsById?: Record<string, unknown>;
    }>;
  }
  export class Writer {
    constructor(options?: { preamble?: boolean });
    toXML(element: unknown): string;
  }
}
