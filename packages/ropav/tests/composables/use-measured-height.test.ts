import {afterEach, describe, expect, it, vi} from "vitest";
import {effectScope, nextTick, shallowRef, watch} from "vue";

import {useMeasuredHeight} from "@/composables/use-measured-height";

/** Read outside a component: nothing here depends on an instance. */
const read = <T>(body: () => T): {stop: () => void; value: T} => {
  const scope = effectScope();
  const value = scope.run(body)!;

  return {stop: () => scope.stop(), value};
};

const observers: StubObserver[] = [];

class StubObserver {
  disconnected = false;
  observed: Element[] = [];

  constructor(private readonly callback: () => void) {
    observers.push(this);
  }

  disconnect() {
    this.disconnected = true;
  }

  emit() {
    this.callback();
  }

  observe(element: Element) {
    this.observed.push(element);
  }

  unobserve() {}
}

/** jsdom implements no `ResizeObserver`, so the observing path is unreachable without this. */
const stubResizeObserver = () => {
  observers.length = 0;
  vi.stubGlobal("ResizeObserver", StubObserver);
};

/** jsdom reports `scrollHeight` as `0` for everything. */
const elementOfHeight = (height: number): HTMLElement => {
  const element = document.createElement("div");

  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    get: () => height,
  });

  return element;
};

const setHeight = (element: HTMLElement, height: number) => {
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    get: () => height,
  });
};

describe("useMeasuredHeight", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    observers.length = 0;
  });

  it("reports nothing while there is no element to measure", async () => {
    stubResizeObserver();

    const {stop, value} = read(() => useMeasuredHeight(shallowRef(null)));

    await nextTick();

    expect(value.height.value).toBeUndefined();
    expect(observers).toHaveLength(0);

    stop();
  });

  it("reports the element's scrollHeight", async () => {
    stubResizeObserver();

    const element = elementOfHeight(64);
    const {stop, value} = read(() => useMeasuredHeight(shallowRef(element)));

    await nextTick();

    expect(value.height.value).toBe(64);
    expect(observers[0]?.observed).toEqual([element]);

    stop();
  });

  it("reports a height change the observer notifies", async () => {
    stubResizeObserver();

    const element = elementOfHeight(64);
    const {stop, value} = read(() => useMeasuredHeight(shallowRef(element)));

    await nextTick();

    setHeight(element, 96);
    observers[0]!.emit();

    expect(value.height.value).toBe(96);

    stop();
  });

  it("does not report a notification that measures the same height", async () => {
    stubResizeObserver();

    const element = elementOfHeight(64);
    const {stop, value} = read(() => useMeasuredHeight(shallowRef(element)));

    await nextTick();

    const onHeight = vi.fn();

    watch(value.height, onHeight);

    observers[0]!.emit();
    observers[0]!.emit();
    await nextTick();

    // Every reader of this drives an inline style on a sibling, so a repeat would be a layout
    // pass for nothing.
    expect(onHeight).not.toHaveBeenCalled();

    stop();
  });

  it("re-observes when the element it was handed changes", async () => {
    stubResizeObserver();

    const first = elementOfHeight(64);
    const second = elementOfHeight(120);
    const element = shallowRef<HTMLElement | null>(first);
    const {stop, value} = read(() => useMeasuredHeight(element));

    await nextTick();
    expect(value.height.value).toBe(64);

    element.value = second;
    await nextTick();

    expect(value.height.value).toBe(120);
    expect(observers[0]?.disconnected).toBe(true);
    expect(observers[1]?.observed).toEqual([second]);

    stop();
  });

  it("disconnects when the scope is disposed", async () => {
    stubResizeObserver();

    const {stop} = read(() => useMeasuredHeight(shallowRef(elementOfHeight(64))));

    await nextTick();
    stop();

    expect(observers[0]?.disconnected).toBe(true);
  });

  it("measures without waiting for the observer to notify", async () => {
    // jsdom has a `ResizeObserver` constructor that never notifies anything, so an
    // observer-only reading would be permanently absent here.
    const {stop, value} = read(() => useMeasuredHeight(shallowRef(elementOfHeight(64))));

    await nextTick();

    expect(value.height.value).toBe(64);

    stop();
  });
});
