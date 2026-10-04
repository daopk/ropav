---
title: Composables
description: The behaviour the components are built from, for building your own.
---

# Composables

Every component is a thin template over a handful of composables: press handling, focus
management, collections, overlays, locale-aware formatting. The ones listed here are exported from
`ropav` so you can build a control the library does not ship and have it behave like the rest.

```ts
import { useLocale, usePress } from "ropav";
```

Most are ported from React Aria and React Stately, and keep their names, so their documentation is
a useful second reference. Options that can change take a getter or a ref — `() => props.isOpen` —
and state comes back as computed refs.

A component's own state engine — `useSelectState`, `useCalendarState` and the like — is not on this
list. Those only make sense paired with the component's parts, and the types their props name are
exported from the component instead.

## Interactions

### usePress

```ts
usePress(options?: UsePressOptions): UsePressReturn
```

A press that behaves the same for a mouse, a finger, a keyboard and a screen reader: started on the
way down, cancelled when the pointer leaves, and never fired twice for one click.

```ts
const press = usePress({
  onPress: (event) => console.log(event.pointerType),
});
// <button :data-pressed="press.isPressed.value"
//   @click="press.handlers.onClick" @pointerdown="press.handlers.onPointerdown" …>
```

### useLongPress

```ts
useLongPress(options?: UseLongPressOptions): UseLongPressReturn
```

A press held past a threshold, built on `usePress`. The description it takes is announced to
assistive technology so the gesture is discoverable.

```ts
const longPress = useLongPress({
  accessibilityDescription: "Long press to open menu",
  onLongPress: () => state.open("first"),
});
```

### useMove

```ts
useMove(options: UseMoveOptions): UseMoveReturn
```

Pointer drags and arrow keys, reported as a stream of deltas rather than coordinates. What a slider
thumb, a splitter handle or a column resizer is made of.

```ts
const { handlers } = useMove({
  onMove: ({ deltaX }) => {
    offset.value += deltaX;
  },
});
// <div @keydown="handlers.onKeydown" @pointerdown="handlers.onPointerdown" />
```

### useInteractionStates

```ts
useInteractionStates(options?: UseInteractionStatesOptions): UseInteractionStatesReturn
```

Hover, press, focus and focus-visible, ready to publish as `data-*` attributes. Hover ignores
touch, and focus-visible only turns on for keyboard focus.

```ts
const states = useInteractionStates({ isDisabled: () => props.isDisabled });
// <button :data-hovered="states.isHovered.value" @pointerenter="states.onPointerenter" …>
```

### useFocusWithin

```ts
useFocusWithin(options?: UseFocusWithinOptions): UseFocusWithinReturn
```

Whether focus is anywhere inside an element, for a wrapper that draws the ring around the control
it contains.

```ts
const focus = useFocusWithin({ isDisabled: () => props.isDisabled });
// <div :data-focus-within="focus.isFocusWithin.value" @focusin="focus.onFocusin" …>
```

### useInteractionModality

```ts
useInteractionModality(): ComputedRef<"keyboard" | "pointer">
```

How the user last drove the page, for text that has to change with it — "Press Enter to start
dragging" against "Double tap to start dragging".

### useTypeahead

```ts
useTypeahead(options: UseTypeaheadOptions): UseTypeaheadReturn
```

Move focus by typing the start of an item's text. A leading Space selects rather than searches, as
it does in a native list.

```ts
const typeahead = useTypeahead({
  focusedKey: () => selection.focusedKey.value,
  getKeyForSearch: (search, fromKey) => findMatch(search, fromKey),
  onSearchMatch: (key) => selection.setFocusedKey(key),
});
```

## Trigger responders

`<Dropdown><Button /></Dropdown>` works because the trigger is an ordinary pressable that takes its
press from above. These are that channel, so a control of your own can be a trigger too — or drive
ropav's `Button` from an overlay of your own.

::: warning Attach the listeners with `@event`, never `v-bind`
`attrs` is safe to bind, but `handlers` is not. Vapor re-applies every `on*` key on each render,
which reorders the listeners and can drop one mid-dispatch. Compose them with
`composePressResponder` or `composeFocusResponder` and attach each with `@event`.
:::

### usePressResponder, providePressResponder

```ts
usePressResponder(): PressResponder | null
providePressResponder(responder: PressResponder | null): void
```

The press, ARIA attributes and disabled state an overlay hands its trigger. `null` when nothing
above supplies one.

### composePressResponder

```ts
composePressResponder(responder: PressResponder | null, own?: Partial<UsePressHandlers>): UsePressHandlers
```

The responder's listeners chained ahead of the element's own, as stable functions.

```ts
const responder = usePressResponder();
const press = composePressResponder(responder, { onClick, onPointerdown });
// <button v-bind="responder?.attrs.value" @click="press.onClick" @pointerdown="press.onPointerdown" …>
```

### useFocusResponder, provideFocusResponder

```ts
useFocusResponder(): FocusResponder | null
provideFocusResponder(responder: FocusResponder | null): void
```

The hover and focus a tooltip hands its trigger. Separate from the press responder, so a button
can be a menu trigger and a tooltip trigger at once.

### composeFocusResponder

```ts
composeFocusResponder(responder: FocusResponder | null, own?: Partial<FocusResponderHandlers>): FocusResponderHandlers
```

```ts
const focus = composeFocusResponder(useFocusResponder(), { onFocus, onBlur });
// <button @focus="focus.onFocus" @blur="focus.onBlur" …>
```

## Overlays

### useOverlayTriggerState

```ts
useOverlayTriggerState(options?: UseOverlayTriggerStateOptions): OverlayTriggerState
```

Open state for anything that opens, controlled or not.

```ts
const state = useOverlayTriggerState({
  isOpen: () => props.isOpen,
  onOpenChange: (isOpen) => emit("openChange", isOpen),
});
```

### useOverlayPosition

```ts
useOverlayPosition(options: UseOverlayPositionOptions): UseOverlayPositionReturn
```

Places an overlay against its trigger, flips it when it would leave the viewport, and keeps it
there through scrolling and resizing.

```ts
const { overlayStyle, placement } = useOverlayPosition({
  isOpen: () => state.isOpen.value,
  offset: 8,
  overlayRef: popoverElement,
  placement: "bottom start",
  targetRef: triggerElement,
});
```

### useDismissable

```ts
useDismissable(options: UseDismissableOptions): UseDismissableReturn
```

Closes an overlay on Escape or on an interaction outside it, and understands that a submenu opened
from inside it is not outside. With a `region`, a press outside that element is neither a dismissal
nor swallowed, and the overlay only stacks with overlays whose region overlaps its own.

```ts
const { onKeydown } = useDismissable({
  isDismissable: true,
  isOpen: () => state.isOpen.value,
  onClose: state.close,
  overlayRef: popoverElement,
});
```

### useFocusScope

```ts
useFocusScope(options: UseFocusScopeOptions): void
```

Keeps focus inside an overlay while it is open and gives it back to where it came from when it
closes. With a `region`, focus moving outside that element is let go rather than pulled back.

```ts
useFocusScope({
  autoFocus: true,
  contain: true,
  isActive: () => state.isOpen.value,
  restoreFocus: true,
  scopeRef: popoverElement,
});
```

### usePortal, providePortal

```ts
usePortal(): Portal
providePortal(options: PortalOptions): Portal
```

Where overlays render and the part of the page they belong to: the nearest provider's
`container` and `root`, or `"body"` and `null` (the whole document) without one. Pass
`portal.container.value` to a `Teleport`, and `portal.root.value` as the `region` of
`useDismissable` and `useFocusScope` and the `boundaryElement` of `useOverlayPosition`.
`PortalProvider` is `providePortal` as a component.

```ts
const portal = usePortal();
// <Teleport :to="portal.container.value">
// portal.isContained.value → true when the container is not the body
```

### usePreventScroll

```ts
usePreventScroll(options?: UsePreventScrollOptions): void
```

Blocks page scrolling while a modal is open, without the layout shift a disappearing scrollbar
causes.

```ts
usePreventScroll({ isDisabled: () => !state.isOpen.value });
```

### useEnterExit

```ts
useEnterExit(options: UseEnterExitOptions): UseEnterExitReturn
```

Keeps an element mounted until its exit animation has finished, and reports which phase it is in.

```ts
const { isEntering, isExiting, isPresent } = useEnterExit({
  elementRef: popoverElement,
  isOpen: () => state.isOpen.value,
});
```

### useToast

```ts
useToast(options: UseToastOptions): UseToastReturn
```

The accessibility wiring for one toast — its role, its labelling and its timer. `ToastProvider` covers rendering; reach for this when the toast itself has
to be a component of your own.

## Collections

### useCollection

```ts
useCollection(options?: UseCollectionOptions): UseCollectionReturn
```

The ordered set of items a list, menu or tag group navigates over. Items register themselves as
they mount, so the order follows the DOM.

### useSelectionManager

```ts
useSelectionManager(options: UseSelectionManagerOptions): UseSelectionManagerReturn
```

Selected and focused keys over a collection, with single, multiple and replace-on-click behaviour
and disabled keys.

```ts
const collection = useCollection();
const selection = useSelectionManager({
  collection,
  onSelectionChange: (keys) => emit("update:selectedKeys", keys),
  selectionMode: "multiple",
});
```

### useListKeyboard

```ts
useListKeyboard(options: UseListKeyboardOptions): UseListKeyboardReturn
```

Arrow keys, Home and End, Page Up and Down and select-all over a collection. Focus moves for real
with a roving tabindex, or virtually through `aria-activedescendant` when it has to stay in an
input.

```ts
const keyboard = useListKeyboard({
  collection,
  element: listElement,
  selection,
});
```

### useListData

```ts
useListData<T>(options?: UseListDataOptions<T>): ListData<T>
```

A list held in state, with the operations a collection usually needs — insert, remove, move,
filter and selection.

```ts
const list = useListData({
  getKey: (user) => user.id,
  initialItems: users,
});

list.remove(id);
```

### useFilter

```ts
useFilter(options?: Intl.CollatorOptions): ComputedRef<Filter>
```

`startsWith`, `contains` and `endsWith` that compare text the way the locale reads it. With
`sensitivity: "base"`, `"cafe"` finds `"Café"`.

```ts
const filter = useFilter({ sensitivity: "base" });
// <AutocompleteFilter :filter="filter.contains">
```

## Drag and drop

### useDragAndDrop

```ts
useDragAndDrop(options: DragAndDropOptions): UseDragAndDropReturn
```

Drag and drop for a `ListBox` or a `Table`. Which halves are switched on follows from the handlers
you pass.

```ts
const { dragAndDropHooks } = useDragAndDrop({
  getItems: (keys) => [...keys].map((key) => ({ "text/plain": String(key) })),
  onReorder: (event) => reorder(event.keys, event.target),
});
// <ListBox :drag-and-drop-hooks="dragAndDropHooks" …>
```

### useDrop

```ts
useDrop(options: UseDropOptions): UseDropReturn
```

Makes any element a drop target, for the pointer and for the keyboard and screen-reader drag that
ropav's collections start. `DropZone` is built on it.

```ts
const drop = useDrop({
  onDrop: async (event) => upload(event.items),
  ref: zoneElement,
});
// <div v-bind="drop.attrs.value" :data-drop-target="drop.isDropTarget.value" …>
```

## Fields and forms

### useFieldIds, useFieldIdsContext, provideFieldIdsContext

```ts
useFieldIds(options?: UseFieldIdsOptions): UseFieldIdsReturn
useFieldIdsContext(): FieldIdsContext | null
provideFieldIdsContext(context: FieldIdsContext | null): void
```

Mints the ids a field's label, description and error message take, and links only the ones that
are actually rendered. Providing the context is what lets ropav's `Label`, `Description` and
`FieldError` wire themselves to a control of your own.

```ts
const { context, describedBy, labelId } = useFieldIds();

provideFieldIdsContext(context);
// <div role="group" :aria-labelledby="labelId" :aria-describedby="describedBy">
```

### useFormValidationState

```ts
useFormValidationState<T>(options: UseFormValidationStateOptions<T>): FormValidationState
```

What a field's validation currently says, merging the `isInvalid` prop, a `validate` function, the
surrounding `Form`'s server errors and the browser's own verdict.

```ts
const validation = useFormValidationState<boolean>({
  isInvalid: () => props.isInvalid,
  name: () => props.name,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => state.value,
});
```

### useFormReset

```ts
useFormReset<T>(element, initialValue, onReset, form?): void
```

Puts a control's state back to its default when its form is reset.

```ts
const input = useTemplateRef<HTMLInputElement>("input");
useFormReset(input, () => props.defaultSelected ?? false, setSelected);
```

### useDescription

```ts
useDescription(description: MaybeRefOrGetter<string | undefined>): UseDescriptionReturn
```

A description for assistive technology only, attached through `aria-describedby`.

```ts
const { describedBy } = useDescription(() => "Long press to open menu");
// <button :aria-describedby="describedBy.value">
```

## Internationalisation

### useLocale, provideLocale

```ts
useLocale(): ComputedRef<Locale>
provideLocale(locale: MaybeRefOrGetter<string | null | undefined>): ComputedRef<Locale>
```

The locale that applies here, with its writing direction: the nearest ancestor's choice, or the
browser's. `I18nProvider` is `provideLocale` as a component.

```ts
const locale = useLocale();
// locale.value → { locale: "en-US", direction: "ltr" }
```

### useDateFormatter

```ts
useDateFormatter(options?: MaybeRefOrGetter<DateFormatterOptions>): ComputedRef<DateFormatter>
```

A date formatter for the current locale, cached across the components that ask for the same
options.

```ts
const formatter = useDateFormatter({ dateStyle: "long" });
// formatter.value.format(date)
```

### useNumberFormatter

```ts
useNumberFormatter(options?: MaybeRefOrGetter<NumberFormatOptions>): ComputedRef<Intl.NumberFormat>
```

```ts
const percent = useNumberFormatter({ style: "percent" });
```

### useCollator

```ts
useCollator(options?: Intl.CollatorOptions): ComputedRef<Intl.Collator>
```

A collator for sorting and comparing text in the current locale.

### useLocalizedStringFormatter

```ts
useLocalizedStringFormatter(strings: LocalizedStrings): ComputedRef<LocalizedStringFormatter>
```

Your own translated strings, read in the current locale. A string that needs variables is written
as a function of the ones passed to `format`.

```ts
const strings = useLocalizedStringFormatter({
  "en-US": { remove: (args) => `Remove ${args?.name}` },
  "fr-FR": { remove: (args) => `Supprimer ${args?.name}` },
});
// strings.value.format("remove", { name })
```

## State and environment

### useControllableState

```ts
useControllableState<T>(options: UseControllableStateOptions<T>): UseControllableStateReturn<T>
```

A value that a parent may control or leave alone — the `v-model` half of every component.

```ts
const { setState, state } = useControllableState<boolean>({
  defaultValue: false,
  onValueChange: (open) => emit("update:open", open),
  value: () => props.open,
});
```

### useId

```ts
useId(idOverride?: MaybeRefOrGetter<string | undefined>): ComputedRef<string>
```

A stable id that a caller-supplied one overrides.

```ts
const triggerId = useId(() => props.id);
```

### useMediaQuery

```ts
useMediaQuery(query: MaybeRefOrGetter<string>, options?: UseMediaQueryOptions): ComputedRef<boolean>
```

```ts
const isMobile = useMediaQuery("(max-width: 768px)");
```

### useViewportSize

```ts
useViewportSize(): ShallowRef<ViewportSize>
```

The visual viewport, which on a phone is what is left above the software keyboard rather than the
window.

```ts
const viewport = useViewportSize();
// style: `--visual-viewport-height: ${viewport.value.height}px`
```
