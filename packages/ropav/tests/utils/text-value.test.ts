import {describe, expect, it} from "vitest";

import {getCollectionTextValue} from "@/utils/text-value";

const build = (html: string) => {
  const element = document.createElement("div");

  element.innerHTML = html;

  return element;
};

describe("getCollectionTextValue", () => {
  describe("plain text", () => {
    it("reads an item's own text", () => {
      expect(getCollectionTextValue(build("News"))).toBe("News");
    });

    it("collapses whitespace introduced by markup", () => {
      expect(getCollectionTextValue(build("\n  News  \n"))).toBe("News");
    });

    it("returns an empty string for no element", () => {
      expect(getCollectionTextValue(null)).toBe("");
    });
  });

  describe("exclusions", () => {
    // Vapor leaves a comment anchor for every `v-if` and every slot, and a comment's
    // `textContent` is its body — so an unfiltered walk reads "if" and "slot" as part of the
    // name and typeahead matches on words that are nowhere on screen.
    it("ignores a vapor comment anchor", () => {
      expect(getCollectionTextValue(build("News<!--if--><!--slot-->"))).toBe("News");
    });

    it("ignores an icon", () => {
      // A tag is written as an icon followed by a word; only the word names it.
      expect(getCollectionTextValue(build('<svg aria-hidden="true"></svg>News'))).toBe("News");
    });

    it("ignores anything hidden from assistive technology", () => {
      expect(getCollectionTextValue(build('<span aria-hidden="true">x</span>News'))).toBe("News");
    });

    it("ignores a remove button's label", () => {
      const element = build('News<button data-slot="tag-remove-button">Remove tag</button>');

      expect(getCollectionTextValue(element)).toBe("News");
    });

    it("ignores a selection indicator", () => {
      const element = build('Bob<span data-slot="list-box-item-indicator">check</span>');

      expect(getCollectionTextValue(element)).toBe("Bob");
    });
  });

  describe("authored label", () => {
    it("prefers the label over the rest of the row", () => {
      // Typing "b" has to find Bob, not the email address that also starts with one.
      const element = build(
        '<span data-slot="label">Bob</span><span data-slot="description">bob@heroui.com</span>',
      );

      expect(getCollectionTextValue(element)).toBe("Bob");
    });

    it("finds a label nested inside layout markup", () => {
      const element = build(
        '<div class="flex"><span data-slot="label">New file</span>' +
          '<span data-slot="description">Create a new file</span></div>',
      );

      expect(getCollectionTextValue(element)).toBe("New file");
    });

    it("drops the description even without a label", () => {
      const element = build('Bob<span data-slot="description">bob@heroui.com</span>');

      expect(getCollectionTextValue(element)).toBe("Bob");
    });
  });
});
