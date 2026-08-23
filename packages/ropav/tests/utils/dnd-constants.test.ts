import { describe, expect, it } from "vitest";

import {
  CUSTOM_DRAG_TYPE,
  DIRECTORY_DRAG_TYPE,
  DROP_EFFECT_TO_DROP_OPERATION,
  DROP_OPERATION,
  DROP_OPERATION_ALLOWED,
  DROP_OPERATION_TO_DROP_EFFECT,
  EFFECT_ALLOWED,
  GENERIC_TYPE,
  NATIVE_DRAG_TYPES,
} from "@/utils/dnd-constants";

describe("dnd constants", () => {
  describe("DROP_OPERATION", () => {
    it("gives each operation its own bit so they can be combined", () => {
      expect(DROP_OPERATION.move).toBe(1);
      expect(DROP_OPERATION.copy).toBe(2);
      expect(DROP_OPERATION.link).toBe(4);
      expect(DROP_OPERATION.all).toBe(7);
    });

    // `none` and `cancel` are two names for the same absence: the DOM calls it one thing and
    // React Aria's operation vocabulary the other.
    it("spells the empty mask as both none and cancel", () => {
      expect(DROP_OPERATION.none).toBe(0);
      expect(DROP_OPERATION.cancel).toBe(0);
    });
  });

  describe("DROP_OPERATION_ALLOWED", () => {
    it("composes the paired effectAllowed values from their parts", () => {
      expect(DROP_OPERATION_ALLOWED.copyMove).toBe(DROP_OPERATION.copy | DROP_OPERATION.move);
      expect(DROP_OPERATION_ALLOWED.copyLink).toBe(DROP_OPERATION.copy | DROP_OPERATION.link);
      expect(DROP_OPERATION_ALLOWED.linkMove).toBe(DROP_OPERATION.link | DROP_OPERATION.move);
    });

    // A transfer nobody has configured permits everything, rather than nothing.
    it("treats uninitialized as permitting every operation", () => {
      expect(DROP_OPERATION_ALLOWED.uninitialized).toBe(DROP_OPERATION.all);
    });
  });

  describe("EFFECT_ALLOWED", () => {
    it("maps every mask back to the string the DOM expects", () => {
      expect(EFFECT_ALLOWED[0]).toBe("none");
      expect(EFFECT_ALLOWED[1]).toBe("move");
      expect(EFFECT_ALLOWED[2]).toBe("copy");
      expect(EFFECT_ALLOWED[3]).toBe("copyMove");
      expect(EFFECT_ALLOWED[4]).toBe("link");
      expect(EFFECT_ALLOWED[5]).toBe("linkMove");
      expect(EFFECT_ALLOWED[6]).toBe("copyLink");
    });

    // `uninitialized` shares the value of `all`, and inverting a map keeps whichever key came
    // last. Without the explicit reassertion the DOM would be handed a string it rejects.
    it("resolves the full mask to all rather than uninitialized", () => {
      expect(EFFECT_ALLOWED[7]).toBe("all");
    });

    // The same collision as above, between `none` and `cancel`. React Aria patches only the
    // `all` case and resolves the empty mask to `"cancel"`, a value `effectAllowed` rejects; it
    // gets away with it because `useDrag` rewrites `"cancel"` to `"none"` before assigning.
    // Fixing the constant makes that workaround unnecessary.
    it("resolves the empty mask to none rather than cancel", () => {
      expect(EFFECT_ALLOWED[0]).toBe("none");
    });
  });

  describe("drop effect translation", () => {
    it("round-trips every operation through the DOM vocabulary", () => {
      for (const operation of ["copy", "link", "move"] as const) {
        const effect = DROP_OPERATION_TO_DROP_EFFECT[operation];

        expect(DROP_EFFECT_TO_DROP_OPERATION[effect]).toBe(operation);
      }
    });

    // The one place the two vocabularies disagree on spelling.
    it("translates the DOM's none to cancel and back", () => {
      expect(DROP_EFFECT_TO_DROP_OPERATION.none).toBe("cancel");
      expect(DROP_OPERATION_TO_DROP_EFFECT.cancel).toBe("none");
    });
  });

  describe("type constants", () => {
    it("lists only the types that survive a drag between applications", () => {
      expect([...NATIVE_DRAG_TYPES]).toEqual(["text/plain", "text/uri-list", "text/html"]);
    });

    it("exposes a custom type and a generic fallback type", () => {
      expect(CUSTOM_DRAG_TYPE).toBe("application/vnd.react-aria.items+json");
      expect(GENERIC_TYPE).toBe("application/octet-stream");
    });

    // A symbol, because a directory has no mime type to name it by.
    it("marks directories with a symbol rather than a mime type", () => {
      expect(typeof DIRECTORY_DRAG_TYPE).toBe("symbol");
    });
  });
});
