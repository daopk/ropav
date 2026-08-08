import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick} from "vue";

import SwitchGroupFixture from "./fixtures.vue";

const renderGroup = (props: Record<string, unknown> = {}) =>
  renderVapor(SwitchGroupFixture, {props});

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

describe("SwitchGroup", () => {
  describe("structure", () => {
    it("renders the group and its items wrapper with their data-slots", () => {
      const {container, unmount} = renderGroup();
      const group = slot(container, "switch-group");
      const items = slot(container, "switch-group-items");

      expect(group.classList.contains("switch-group")).toBe(true);
      expect(items.classList.contains("switch-group__items")).toBe(true);
      // The wrapper is what lays the switches out, so it has to be the one holding them.
      expect(group.contains(items)).toBe(true);
      expect(items.querySelectorAll("[data-slot='switch']").length).toBe(3);

      unmount();
    });

    it("merges a caller class into the group rather than the items wrapper", () => {
      const {container, unmount} = renderGroup({class: "custom-class"});

      expect(slot(container, "switch-group").classList.contains("custom-class")).toBe(true);
      expect(slot(container, "switch-group-items").classList.contains("custom-class")).toBe(false);

      unmount();
    });
  });

  describe("orientation", () => {
    it("lays the switches out vertically by default", () => {
      const {container, unmount} = renderGroup();

      expect(slot(container, "switch-group").classList.contains("switch-group--vertical")).toBe(
        true,
      );

      unmount();
    });

    it("supports a horizontal group", () => {
      const {container, unmount} = renderGroup({orientation: "horizontal"});
      const group = slot(container, "switch-group");

      expect(group.classList.contains("switch-group--horizontal")).toBe(true);
      expect(group.classList.contains("switch-group--vertical")).toBe(false);

      unmount();
    });
  });

  describe("forms", () => {
    it("submits every switch that is on under its own name", async () => {
      const form = document.createElement("form");

      form.id = "switch-group-form";
      document.body.append(form);

      const {container, unmount} = renderGroup({form: form.id});

      const data = new FormData(form);

      expect(data.get("marketing")).toBe("on");
      expect(data.get("notifications")).toBeNull();
      expect(data.get("social")).toBeNull();

      const [notifications] = Array.from(
        container.querySelectorAll<HTMLElement>("[data-slot='switch-content']"),
      );

      notifications!.click();
      await nextTick();

      expect(new FormData(form).get("notifications")).toBe("on");
      // Switches in a group hold their own state; turning one on leaves the rest alone.
      expect(new FormData(form).get("marketing")).toBe("on");

      unmount();
      form.remove();
    });
  });
});
