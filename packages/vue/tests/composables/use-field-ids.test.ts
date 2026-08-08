import type {UseFieldIdsReturn} from "@/composables/use-field-ids";

import {afterEach, describe, expect, it} from "vitest";
import {effectScope, shallowRef} from "vue";

import {useFieldIds} from "@/composables/use-field-ids";

const scopes: (() => void)[] = [];

/** The container's side of the contract: one call per provider component. */
const createFieldIds = (options: Parameters<typeof useFieldIds>[0] = {}): UseFieldIdsReturn => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  return scope.run(() => useFieldIds(options)) as UseFieldIdsReturn;
};

/**
 * A consuming part gets its own scope, because that is what releases the claim — a
 * `Label` inside a `v-if` must stop being referenced when it goes away.
 */
const createPart = <T>(claim: () => T): {result: T; unmount: () => void} => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  return {result: scope.run(claim) as T, unmount: () => scope.stop()};
};

afterEach(() => {
  scopes.splice(0).forEach((stop) => stop());
});

describe("useFieldIds", () => {
  describe("unclaimed ids", () => {
    it("exposes no id until a part claims it", () => {
      const field = createFieldIds();

      expect(field.labelId.value).toBeUndefined();
      expect(field.descriptionId.value).toBeUndefined();
      expect(field.errorMessageId.value).toBeUndefined();
      expect(field.headingId.value).toBeUndefined();
      expect(field.describedBy.value).toBeUndefined();
    });
  });

  describe("claiming", () => {
    it("exposes the id a part claimed", () => {
      const field = createFieldIds();
      const {result: labelId} = createPart(() => field.context.claimLabelId());

      expect(labelId).toMatch(/-label$/);
      expect(field.labelId.value).toBe(labelId);
      // Claiming a label must not make the container describe itself by it.
      expect(field.describedBy.value).toBeUndefined();
    });

    it("gives every slot a distinct id", () => {
      const field = createFieldIds();
      const {result: ids} = createPart(() => ({
        description: field.context.claimDescriptionId(),
        errorMessage: field.context.claimErrorMessageId(),
        heading: field.context.claimHeadingId(),
        label: field.context.claimLabelId(),
      }));

      expect(new Set(Object.values(ids)).size).toBe(4);
    });

    it("returns a stable id across repeated claims of the same slot", () => {
      const field = createFieldIds();
      const first = createPart(() => field.context.claimLabelId());
      const second = createPart(() => field.context.claimLabelId());

      expect(second.result).toBe(first.result);
    });
  });

  describe("describedBy", () => {
    it("joins the description and the error message in that order", () => {
      const field = createFieldIds();
      // Claimed error-message-first to prove the order comes from the container, not from
      // the order the parts happened to mount in.
      const {result: errorMessageId} = createPart(() => field.context.claimErrorMessageId());
      const {result: descriptionId} = createPart(() => field.context.claimDescriptionId());

      expect(field.describedBy.value).toBe(`${descriptionId} ${errorMessageId}`);
    });

    it("falls back to the single id present", () => {
      const field = createFieldIds();
      const {result: descriptionId} = createPart(() => field.context.claimDescriptionId());

      expect(field.describedBy.value).toBe(descriptionId);
    });
  });

  describe("releasing", () => {
    it("stops exposing an id once its part goes away", () => {
      const field = createFieldIds();
      const part = createPart(() => field.context.claimDescriptionId());

      expect(field.describedBy.value).toBeDefined();

      part.unmount();

      expect(field.descriptionId.value).toBeUndefined();
      expect(field.describedBy.value).toBeUndefined();
    });

    it("keeps the id while another part still claims it", () => {
      const field = createFieldIds();
      const first = createPart(() => field.context.claimLabelId());

      createPart(() => field.context.claimLabelId());

      first.unmount();

      expect(field.labelId.value).toBe(first.result);
    });
  });

  describe("labelFor", () => {
    it("points at nothing when the container names no control", () => {
      // A composite has no single control to point at, and every container that existed
      // before this option was added is in exactly that position.
      const field = createFieldIds();

      expect(field.context.labelFor.value).toBeUndefined();
    });

    it("hands out the control id the container supplied", () => {
      const field = createFieldIds({labelFor: "email-input"});

      expect(field.context.labelFor.value).toBe("email-input");
    });

    it("follows a control id that changes", () => {
      const controlId = shallowRef<string | undefined>("first");
      const field = createFieldIds({labelFor: controlId});

      expect(field.context.labelFor.value).toBe("first");

      controlId.value = "second";

      expect(field.context.labelFor.value).toBe("second");
    });

    it("reads a getter rather than a snapshot", () => {
      // The id a field mints is usually derived, so the option has to accept a getter.
      let current = "before";
      const field = createFieldIds({labelFor: () => current});

      current = "after";

      expect(field.context.labelFor.value).toBe("after");
    });

    it("is independent of whether a label claimed an id", () => {
      // The two directions are separate: `for` points at the control, the claimed id is what
      // the control points `aria-labelledby` back at.
      const field = createFieldIds({labelFor: "email-input"});

      expect(field.labelId.value).toBeUndefined();
      expect(field.context.labelFor.value).toBe("email-input");
    });
  });
});
