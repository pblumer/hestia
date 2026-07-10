// Keybindings sind Teil des einheitlichen Verhaltens und leben zentral im Kit
// (INV-M2): Undo/Redo und Entfernen der Selektion. Die Matcher sind reine
// Funktionen (unit-getestet); das Verhalten wird per E2E abgesichert.

/** Cmd (macOS) bzw. Ctrl (übrige) gedrückt? */
export function isCmd(e: KeyboardEvent): boolean {
  return Boolean(e.ctrlKey || e.metaKey);
}

/** Eine der Tasten gedrückt? */
export function isKey(keys: string[], e: KeyboardEvent): boolean {
  return keys.includes(e.key);
}

export function isUndo(e: KeyboardEvent): boolean {
  return isCmd(e) && !e.shiftKey && isKey(["z", "Z"], e);
}

export function isRedo(e: KeyboardEvent): boolean {
  return isCmd(e) && ((e.shiftKey && isKey(["z", "Z"], e)) || isKey(["y", "Y"], e));
}

export function isRemove(e: KeyboardEvent): boolean {
  return isKey(["Delete", "Backspace"], e);
}

interface CommandStackLike {
  undo(): void;
  redo(): void;
}
interface SelectionLike {
  get(): unknown[];
}
interface ModelingLike {
  removeElements(elements: unknown[]): void;
}
interface KeyboardLike {
  addListener(listener: (ctx: { keyEvent: KeyboardEvent }) => boolean | void): void;
}

// Keybindings verdrahtet die Tastatur mit CommandStack, Selektion und Modeling.
export class Keybindings {
  static $inject = ["keyboard", "commandStack", "selection", "modeling"];

  constructor(
    keyboard: KeyboardLike,
    commandStack: CommandStackLike,
    selection: SelectionLike,
    modeling: ModelingLike,
  ) {
    keyboard.addListener(({ keyEvent }) => {
      if (isUndo(keyEvent)) {
        commandStack.undo();
        return true;
      }
      if (isRedo(keyEvent)) {
        commandStack.redo();
        return true;
      }
      if (isRemove(keyEvent)) {
        const selected = selection.get();
        if (selected.length > 0) {
          modeling.removeElements([...selected]);
          return true;
        }
      }
      return undefined;
    });
  }
}

export const keybindingsModule = {
  __init__: ["keybindings"],
  keybindings: ["type", Keybindings],
};

export default keybindingsModule;
