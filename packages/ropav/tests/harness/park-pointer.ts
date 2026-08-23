import { userEvent } from "vitest/browser";

/**
 * Move the real pointer somewhere it cannot mean anything.
 *
 * Browser-only, and the separate module is the point: a jsdom suite that imported `vitest/browser`
 * would not start.
 *
 * The pointer belongs to the page, not to the test, and the page is shared by every browser test
 * file in the run. So a test begins with the pointer wherever the last one left it — which may be
 * several files ago — and any component that answers to hover reads that as a deliberate gesture.
 * For a listbox that follows the pointer with its highlight, an overlay opening under a parked
 * pointer takes its focus from whatever happens to be beneath it rather than from what the test
 * asked for. That produced a failure naming the wrong option, with nothing in the test that had
 * moved a pointer at all.
 *
 * Parked against the bottom-right corner rather than on `<html>`: hovering an element means
 * hovering the middle of it, and the middle of the document is where an overlay is most likely to
 * open. The corner is a place nothing anchors to.
 */
export const parkPointer = async (): Promise<void> => {
  const corner = document.createElement("div");

  corner.style.cssText = "position:fixed;right:0;bottom:0;width:8px;height:8px;";
  document.body.append(corner);

  try {
    await userEvent.hover(corner);
  } finally {
    corner.remove();
  }
};
