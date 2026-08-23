import { installDataTransfer } from "./data-transfer";

import "@testing-library/jest-dom/vitest";

// Vapor components rely on native DOM behaviour rather than a pointer-event
// abstraction, so no `installPointerEvent()` equivalent is needed here.

// jsdom implements none of `DataTransfer`, `DataTransferItem` or `DragEvent`, so drag and drop
// has nothing to carry a payload on. See `./data-transfer.ts` for what the stub does and does
// not promise.
installDataTransfer();

// Common jsdom gaps used by overlays and measured layouts.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    value: (query: string) => ({
      addEventListener() {},
      addListener() {},
      dispatchEvent() {
        return false;
      },
      matches: false,
      media: query,
      onchange: null,
      removeEventListener() {},
      removeListener() {},
    }),
    writable: true,
  });
}

if (typeof document.elementFromPoint !== "function") {
  document.elementFromPoint = () => null;
}

// `Element.prototype.getAnimations` is deliberately NOT polyfilled.
//
// Components that animate a collapse — Accordion's panel, for one — branch on whether
// the Web Animations API exists, and settle synchronously when it does not. Faking it
// here would make jsdom pretend to animate and then await animations that never run.
// The animated path belongs in `*.browser.test.ts`, against a real browser.
