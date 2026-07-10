import { describe, it, expect } from "vitest";
import { isUndo, isRedo, isRemove, isCmd } from "./keybindings";

const ev = (init: Partial<KeyboardEvent>): KeyboardEvent => init as KeyboardEvent;

describe("Keybinding-Matcher", () => {
  it("Undo = Cmd/Ctrl+Z ohne Shift", () => {
    expect(isUndo(ev({ ctrlKey: true, key: "z", shiftKey: false }))).toBe(true);
    expect(isUndo(ev({ metaKey: true, key: "z" }))).toBe(true);
    expect(isUndo(ev({ ctrlKey: true, key: "z", shiftKey: true }))).toBe(false);
    expect(isUndo(ev({ key: "z" }))).toBe(false);
  });

  it("Redo = Cmd+Shift+Z oder Cmd+Y", () => {
    expect(isRedo(ev({ ctrlKey: true, shiftKey: true, key: "z" }))).toBe(true);
    expect(isRedo(ev({ ctrlKey: true, key: "y" }))).toBe(true);
    expect(isRedo(ev({ ctrlKey: true, key: "z" }))).toBe(false);
  });

  it("Remove = Delete/Backspace", () => {
    expect(isRemove(ev({ key: "Delete" }))).toBe(true);
    expect(isRemove(ev({ key: "Backspace" }))).toBe(true);
    expect(isRemove(ev({ key: "a" }))).toBe(false);
  });

  it("isCmd erkennt Ctrl und Meta", () => {
    expect(isCmd(ev({ ctrlKey: true }))).toBe(true);
    expect(isCmd(ev({ metaKey: true }))).toBe(true);
    expect(isCmd(ev({}))).toBe(false);
  });
});
