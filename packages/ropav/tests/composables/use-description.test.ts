import { describe, expect, it } from "vitest";
import { nextTick, shallowRef } from "vue";

import { useDescription } from "@/composables/use-description";

import { withScope } from "../harness/scope";

const nodeFor = (id: string | undefined) => (id ? document.getElementById(id) : null);

describe("useDescription", () => {
  describe("the node", () => {
    it("carries the text, hidden, on the body", () => {
      const [{ describedBy }, dispose] = withScope(() => useDescription("Long press to open menu"));
      const node = nodeFor(describedBy.value);

      expect(node).not.toBe(null);
      expect(node?.textContent).toBe("Long press to open menu");

      // Hidden and on the body, so it is not read as part of the control's own name and takes
      // no space.
      expect(node?.style.display).toBe("none");
      expect(node?.parentElement).toBe(document.body);

      dispose();
    });

    it("describes nothing when there is no description", () => {
      const [{ describedBy }, dispose] = withScope(() => useDescription(undefined));

      expect(describedBy.value).toBe(undefined);

      dispose();
    });

    it("describes nothing for an empty string", () => {
      const [{ describedBy }, dispose] = withScope(() => useDescription(""));

      expect(describedBy.value).toBe(undefined);

      dispose();
    });
  });

  describe("sharing", () => {
    /* One node per distinct text, however many controls carry that description. */
    it("gives two consumers of the same text one node", () => {
      const [first, disposeFirst] = withScope(() => useDescription("Shared wording"));
      const [second, disposeSecond] = withScope(() => useDescription("Shared wording"));

      expect(first.describedBy.value).toBe(second.describedBy.value);
      expect(document.querySelectorAll(`#${first.describedBy.value}`)).toHaveLength(1);

      disposeFirst();
      disposeSecond();
    });

    it("gives different texts different nodes", () => {
      const [first, disposeFirst] = withScope(() => useDescription("One wording"));
      const [second, disposeSecond] = withScope(() => useDescription("Another wording"));

      expect(first.describedBy.value).not.toBe(second.describedBy.value);

      disposeFirst();
      disposeSecond();
    });
  });

  describe("lifetime", () => {
    it("keeps the node while another consumer still holds it", () => {
      const [first, disposeFirst] = withScope(() => useDescription("Still needed"));
      const [, disposeSecond] = withScope(() => useDescription("Still needed"));
      const id = first.describedBy.value;

      disposeFirst();

      expect(nodeFor(id)).not.toBe(null);

      disposeSecond();

      expect(nodeFor(id)).toBe(null);
    });

    it("removes the node when the last consumer goes away", () => {
      const [{ describedBy }, dispose] = withScope(() => useDescription("Only consumer"));
      const id = describedBy.value;

      expect(nodeFor(id)).not.toBe(null);

      dispose();

      expect(nodeFor(id)).toBe(null);
    });
  });

  describe("changing text", () => {
    it("takes a new node and releases the old one", async () => {
      const description = shallowRef<string | undefined>("Before");
      const [{ describedBy }, dispose] = withScope(() => useDescription(description));
      const before = describedBy.value;

      description.value = "After";
      await nextTick();

      expect(describedBy.value).not.toBe(before);
      expect(nodeFor(describedBy.value)?.textContent).toBe("After");
      expect(nodeFor(before)).toBe(null);

      dispose();
    });

    it("drops the description when the text goes away", async () => {
      const description = shallowRef<string | undefined>("Temporary");
      const [{ describedBy }, dispose] = withScope(() => useDescription(description));
      const id = describedBy.value;

      description.value = undefined;
      await nextTick();

      expect(describedBy.value).toBe(undefined);
      expect(nodeFor(id)).toBe(null);

      dispose();
    });
  });
});
