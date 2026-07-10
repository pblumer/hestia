import { describe, it, expect } from "vitest";
import { readDmnXml, writeDmnXml, dmnDescriptors } from "./index";

describe("modeler-dmn API", () => {
  it("exportiert die öffentliche DMN-API", () => {
    expect(typeof readDmnXml).toBe("function");
    expect(typeof writeDmnXml).toBe("function");
    expect(dmnDescriptors.dmn.prefix).toBe("dmn");
  });
});
