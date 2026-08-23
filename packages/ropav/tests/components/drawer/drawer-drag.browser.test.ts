import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { startSlowMotion, stopSlowMotion } from "../../harness/slow-motion";

import DrawerFixture from "./fixtures.vue";

const mounted: { unmount: () => void }[] = [];

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(DrawerFixture, { props });

  mounted.push(result);

  return result;
};

type RenderResult = ReturnType<typeof render>;

const settled = async (element: HTMLElement) => {
  await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
  await nextTick();
};

const slot = (name: string) => document.body.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const open = async (props: Record<string, unknown> = {}) => {
  const changes: boolean[] = [];
  const result = render({ ...props, onOpenChange: (isOpen: boolean) => changes.push(isOpen) });

  await userEvent.click(result.getByRole("button", { name: "Open drawer" }) as HTMLElement);
  await nextTick();
  await nextTick();
  await nextTick();

  const backdrop = slot("drawer-backdrop")!;

  await settled(backdrop);
  await settled(slot("drawer-content")!);
  await settled(slot("drawer-dialog")!);

  return { backdrop, changes, result };
};

const close = async (result: RenderResult, backdrop: HTMLElement) => {
  if (!backdrop.isConnected) return;

  await userEvent.keyboard("{Escape}");
  await settled(backdrop);
  await nextTick();
  await nextTick();
  void result;
};

/**
 * Drag the panel by grabbing a point on it and releasing at another.
 *
 * Playwright's drag has very few intermediate moves, so the velocity it produces is effectively
 * unbounded — which is why every assertion below is about *distance and direction*, never about a
 * flick. The velocity branch is checked by hand.
 */
const dragPanel = async (
  from: { x: number; y: number },
  to: { x: number; y: number },
  target: HTMLElement = slot("drawer-dialog")!,
) => {
  await userEvent.dragAndDrop(slot("drawer-dialog")!, target, {
    sourcePosition: from,
    targetPosition: to,
  });
  await nextTick();
  await nextTick();
};

/** The panel's own inline write, which is the only thing the drag ever touches. */
const inlineTransform = () => slot("drawer-dialog")?.style.transform ?? "";

/**
 * Watch for the panel claiming the pointer, which is the one signal that a drag actually armed.
 *
 * An inline transform is not: the snap-back clears it again, so a panel that moved and came home
 * looks exactly like one that never moved at all by the time the gesture is over. The capture claim
 * happens on the same line as the arming and nothing undoes it.
 */
const watchCapture = (panel: HTMLElement) => {
  const claimed: number[] = [];
  const original = panel.setPointerCapture.bind(panel);

  panel.setPointerCapture = (pointerId: number) => {
    claimed.push(pointerId);
    original(pointerId);
  };

  return claimed;
};

afterEach(() => {
  stopSlowMotion();

  while (mounted.length > 0) {
    try {
      mounted.pop()!.unmount();
    } catch {
      // Already unmounted by the case itself, which is the normal path.
    }
  }

  document.documentElement.style.overflow = "";

  for (const child of [...document.body.children]) {
    child.removeAttribute("inert");
    child.removeAttribute("aria-hidden");
  }
});

describe("Drawer drag (browser)", () => {
  it("ignores a movement shorter than the threshold", async () => {
    const { backdrop, changes, result } = await open();
    const panel = slot("drawer-dialog")!;
    const box = panel.getBoundingClientRect();
    const claimed = watchCapture(panel);

    // Four pixels, under the eight the gesture arms at. The move really is delivered — this is not
    // a drag the tooling swallowed — so the guard is what stops it.
    await dragPanel(
      { x: Math.round(box.width / 2), y: 8 },
      { x: Math.round(box.width / 2), y: 12 },
    );

    expect(claimed).toEqual([]);
    expect(inlineTransform()).toBe("");
    expect(changes).toEqual([true]);
    expect(slot("drawer-dialog")).toBeTruthy();

    await close(result, backdrop);
    result.unmount();
  });

  it("dismisses when dragged past a third of its height", async () => {
    const { changes, result } = await open();
    const panel = slot("drawer-dialog")!;
    const height = panel.offsetHeight;
    const box = panel.getBoundingClientRect();
    const start = 8;

    // The two assertions below read the panel mid-exit — the offset the finger left behind is only
    // on it while the slide is still running, so the slide is stretched rather than raced.
    startSlowMotion();

    await dragPanel(
      { x: Math.round(box.width / 2), y: start },
      { x: Math.round(box.width / 2), y: start + Math.round(height * 0.6) },
    );

    expect(changes).toEqual([true, false]);

    /*
     * The inline transform is still there while the panel is leaving.
     *
     * That is the whole compounding trick: the drag's own offset stays written so the slide out
     * carries on from where the finger let go instead of snapping back to rest first.
     */
    expect(slot("drawer-content")!.getAttribute("data-exiting")).toBe("true");
    expect(inlineTransform()).toMatch(/translateY\(/);

    result.unmount();
  });

  /*
   * The clamp is asserted on the panel's own transform, and on nothing else.
   *
   * Whether letting go *also* dismisses is deliberately not asserted, because it is not decidable
   * here: the release compares an **unsigned** velocity taken from the raw pointer delta, so a
   * movement in either direction can pass the flick test whatever the clamp did to the offset —
   * React decides it from the same two numbers, so this is faithful rather than a defect. Playwright
   * dispatches so few moves that the velocity it produces depends on machine load, which makes that
   * branch genuinely non-deterministic; asserting on it is how these two cases first went flaky.
   *
   * What is deterministic: each drag below travels **further than the dismiss distance**, so with
   * the clamp gone the offset alone would dismiss and the retained transform would record the wrong
   * direction. Clamped, the only two possible endings are a cleared transform or a zeroed one.
   */
  it("never moves the panel away from its own edge", async () => {
    const { result } = await open();
    const panel = slot("drawer-dialog")!;
    const box = panel.getBoundingClientRect();
    const claimed = watchCapture(panel);
    const travel = Math.round(panel.offsetHeight * 0.4) + 10;
    const start = Math.round(box.height - 4);

    // A bottom drawer dragged *up* has nowhere to go.
    await dragPanel(
      { x: Math.round(box.width / 2), y: start },
      { x: Math.round(box.width / 2), y: start - travel },
    );

    expect(claimed).toHaveLength(1);
    // Zero or nothing, never the distance the pointer actually travelled.
    expect(inlineTransform()).toMatch(/^(|translateY\(0px\))$/);

    result.unmount();
  });

  it("never moves a side panel further on screen", async () => {
    const { result } = await open({ placement: "right" });
    const panel = slot("drawer-dialog")!;
    const box = panel.getBoundingClientRect();
    const claimed = watchCapture(panel);
    const travel = Math.round(panel.offsetWidth * 0.4) + 10;
    const start = Math.round(box.width - 4);

    // A right-hand drawer dragged left is being pushed further on screen.
    await dragPanel({ x: start, y: 8 }, { x: start - travel, y: 8 });

    expect(claimed).toHaveLength(1);
    expect(inlineTransform()).toMatch(/^(|translateX\(0px\))$/);

    result.unmount();
  });

  it("leaves the body's own scroll alone", async () => {
    const { backdrop, changes, result } = await open();
    const body = slot("drawer-body")!;
    const box = body.getBoundingClientRect();
    const panelBox = slot("drawer-dialog")!.getBoundingClientRect();
    const claimed = watchCapture(slot("drawer-dialog")!);
    const startY = Math.round(box.top - panelBox.top + box.height / 2);
    // The release has to stay on the panel: Playwright dispatches a single intermediate move, and a
    // destination past the panel's edge would never be delivered to it — which would let this pass
    // whether the bail-out worked or not.
    const endY = Math.round(panelBox.height - 4);

    // Started on the body, which is where a swipe to scroll a long list begins. Bailing out here is
    // what the body's own slot attribute buys — a drawer whose list could not be scrolled would be
    // worse than one that could not be dragged.
    expect(endY - startY).toBeGreaterThan(Math.round(panelBox.height * 0.3));

    await dragPanel(
      { x: Math.round(box.width / 2), y: startY },
      { x: Math.round(box.width / 2), y: endY },
    );

    expect(claimed).toEqual([]);
    expect(inlineTransform()).toBe("");
    expect(changes).toEqual([true]);
    expect(slot("drawer-dialog")).toBeTruthy();

    await close(result, backdrop);
    result.unmount();
  });

  it("leaves a button inside the panel alone", async () => {
    const { backdrop, changes, result } = await open();
    const button = document.body.querySelector<HTMLElement>("[data-testid='body-button']")!;
    const panelBox = slot("drawer-dialog")!.getBoundingClientRect();
    const box = button.getBoundingClientRect();
    const claimed = watchCapture(slot("drawer-dialog")!);
    const startY = Math.round(box.top - panelBox.top + box.height / 2);
    const endY = Math.round(panelBox.height - 4);
    const x = Math.round(box.left - panelBox.left + box.width / 2);

    // Far enough to dismiss if it armed at all, and still landing on the panel so the move is
    // actually delivered there.
    expect(endY - startY).toBeGreaterThan(Math.round(panelBox.height * 0.3));

    await dragPanel({ x, y: startY }, { x, y: endY });

    // A control keeps its own gesture, so a slip of the finger on a button never moves the drawer.
    expect(claimed).toEqual([]);
    expect(inlineTransform()).toBe("");
    expect(changes).toEqual([true]);

    await close(result, backdrop);
    result.unmount();
  });

  /*
   * Pointer capture is asserted as a call, not as a retarget.
   *
   * Capture is claimed on the first move that passes the threshold, so exercising what it *does*
   * needs a gesture with at least two moves: one landing on the panel to arm it, another landing
   * off the panel to be retargeted. Playwright's drag dispatches exactly one intermediate move, and
   * it lands at the destination — so a drag that ends off the panel never arms in the first place,
   * and the case capture exists for cannot be produced here at all. React claims it in the same
   * place and would behave identically. What is checkable is that the claim is made, on the right
   * element, with the gesture's own pointer id.
   */
  it("claims the pointer once the drag is armed", async () => {
    const { changes, result } = await open();
    const panel = slot("drawer-dialog")!;
    const height = panel.offsetHeight;
    const box = panel.getBoundingClientRect();
    const captured: number[] = [];
    const original = panel.setPointerCapture.bind(panel);

    panel.setPointerCapture = (pointerId: number) => {
      captured.push(pointerId);
      original(pointerId);
    };

    await dragPanel(
      { x: Math.round(box.width / 2), y: 8 },
      { x: Math.round(box.width / 2), y: 8 + Math.round(height * 0.6) },
    );

    expect(captured).toHaveLength(1);
    expect(captured[0]).toBeGreaterThan(0);
    expect(changes).toEqual([true, false]);

    result.unmount();
  });

  it("never moves a drawer that cannot be dismissed", async () => {
    const { changes, result } = await open({ isDismissable: false });
    const panel = slot("drawer-dialog")!;
    const height = panel.offsetHeight;
    const box = panel.getBoundingClientRect();
    const claimed = watchCapture(panel);

    await dragPanel(
      { x: Math.round(box.width / 2), y: 8 },
      { x: Math.round(box.width / 2), y: Math.round(height * 0.6) },
    );

    // Nothing to drag away, so the page keeps its own gestures and the panel never moves.
    expect(claimed).toEqual([]);
    expect(inlineTransform()).toBe("");
    expect(panel.style.touchAction).toBe("");
    expect(changes).toEqual([true]);
    expect(slot("drawer-dialog")).toBeTruthy();

    result.unmount();
  });
});
