import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";

import { Spinner } from "@/components/spinner";

import SpinnerPair from "./fixtures.vue";

const renderSpinner = (props: Record<string, unknown> = {}) => renderVapor(Spinner, { props });

describe("Spinner", () => {
  describe("structure", () => {
    it("renders with status role and default accessible name", () => {
      const { getByRole, unmount } = renderSpinner();

      expect(getByRole("status", { name: "Loading" })).toBeInTheDocument();

      unmount();
    });

    it("exposes the BEM block, data-slot, and icon sub-part", () => {
      const { getByRole, unmount } = renderSpinner();
      const spinner = getByRole("status", { name: "Loading" });

      expect(spinner.getAttribute("data-slot")).toBe("spinner");
      expect(spinner.classList.contains("spinner")).toBe(true);
      // `.button` excludes this sub-part from its icon sizing, so the slot has to be here.
      expect(spinner.querySelector('[data-slot="spinner-icon"]')).not.toBeNull();

      unmount();
    });

    it("supports overriding aria-label", () => {
      const { getByRole, unmount } = renderSpinner({ "aria-label": "Saving changes" });

      expect(getByRole("status", { name: "Saving changes" })).toBeInTheDocument();

      unmount();
    });

    it("forwards unknown attributes to the spinner", () => {
      const { getByRole, unmount } = renderSpinner({ "data-foo": "bar" });

      expect(getByRole("status").getAttribute("data-foo")).toBe("bar");

      unmount();
    });
  });

  describe("styling", () => {
    it("applies the default color and size modifiers", () => {
      const { getByRole, unmount } = renderSpinner();
      const spinner = getByRole("status");

      expect(spinner.classList.contains("spinner--accent")).toBe(true);
      expect(spinner.classList.contains("spinner--md")).toBe(true);

      unmount();
    });

    it("exposes color and size BEM modifiers", () => {
      const { getByRole, unmount } = renderSpinner({ color: "danger", size: "lg" });
      const spinner = getByRole("status");

      expect(spinner.classList.contains("spinner--danger")).toBe(true);
      expect(spinner.classList.contains("spinner--lg")).toBe(true);

      unmount();
    });

    it("merges a caller class", () => {
      const { getByRole, unmount } = renderSpinner({ class: "opacity-50" });
      const spinner = getByRole("status");

      expect(spinner.classList.contains("spinner")).toBe(true);
      expect(spinner.classList.contains("opacity-50")).toBe(true);

      unmount();
    });
  });

  describe("gradients", () => {
    it("gives each instance on the page its own gradient ids", () => {
      const { container, unmount } = renderVapor(SpinnerPair);
      const ids = Array.from(container.querySelectorAll("linearGradient")).map((node) => node.id);

      expect(ids).toHaveLength(4);
      // Shared ids would make both spinners paint from whichever resolves first.
      expect(new Set(ids).size).toBe(4);

      unmount();
    });

    it("points each path at its own gradient", () => {
      const { container, unmount } = renderSpinner();
      const ids = Array.from(container.querySelectorAll("linearGradient")).map((node) => node.id);
      const fills = Array.from(container.querySelectorAll("path"))
        .map((node) => node.getAttribute("fill"))
        .filter(Boolean);

      expect(fills).toEqual(ids.map((id) => `url(#${id})`));

      unmount();
    });
  });
});
