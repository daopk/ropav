/**
 * Parts whose text is decoration or secondary, and so must not feed typeahead.
 *
 * Without this list, typing `b` in a list of people would match the email address in a
 * description before it matched anyone's name, and a removable tag would match its close
 * button's label.
 */
const EXCLUDED_FROM_TEXT_VALUE = [
  '[aria-hidden="true"]',
  '[data-slot="description"]',
  '[data-slot="list-box-item-indicator"]',
  '[data-slot="menu-item-indicator"]',
  '[data-slot="submenu-indicator"]',
  '[data-slot="tag-remove-button"]',
  "svg",
].join(",");

/**
 * The text a collection item should be matched on when the caller gave no `textValue`.
 *
 * React derives this by walking the element tree it was handed and keeping the string
 * children. That is not available here — inspecting children means rendering them — so the
 * text is read back off the DOM instead, preferring an authored label when there is one.
 *
 * Read at match time rather than cached at mount, so an item whose text changes needs no
 * re-registration and no `MutationObserver`.
 */
export const getCollectionTextValue = (element: HTMLElement | null | undefined): string => {
  if (!element) return "";

  // An authored label is the item's name; anything else in the row is supporting detail.
  const label = element.querySelector('[data-slot="label"]');
  const source = label ?? element;

  return [...source.childNodes]
    .filter((node) => {
      // Vapor leaves a comment anchor for every `v-if` and every slot, and a comment's
      // `textContent` is its body — so an unfiltered walk reads "if" and "slot" as part of the
      // item's name, and typeahead matches on words that are nowhere on screen.
      if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.TEXT_NODE) return false;

      return !(node instanceof Element && node.matches(EXCLUDED_FROM_TEXT_VALUE));
    })
    .map((node) => node.textContent ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
};
