# Writing Ropav code

Ropav components are compound: a family root provides context, and named parts arrange inside it.
The arrangement is the API, and it is not guessable from the names. This file is the short list of
rules that go wrong most often. For a worked arrangement and the props of every family, fetch
<https://ropav.netlify.app/llms-full.txt> — one file, the whole package.

## Importing

```ts
import { Button, Select, SelectPopover } from "ropav";
```

The published package also carries one subpath per family — `import { Button } from "ropav/button"` —
so a bundler drops what is never imported. The stylesheet is a separate import:

```ts
import "ropav/styles/bundled.css";
```

Every component takes `class`, `aria-label`, `aria-labelledby` and `aria-describedby`. Props are
camelCase in the types and kebab-case in a template: `itemTextValue` is written `item-text-value`.

## The rules

**1. A part only works inside its root.** Contexts are strict, so a part rendered outside its
family throws during setup rather than rendering something degraded. There is no standalone
`SelectTrigger`.

**2. Collections arrive as data, not as children.** `Select` takes a required `items` array — it
does not read its options by walking children, because a closed select has rendered none.
`item-text-value` is the string typeahead matches; `item-key` is the identity.

```vue
<Select :item-text-value="(city) => city.name" :items="cities" placeholder="Pick a city">
  <Label>Destination</Label>
  <SelectTrigger>
    <SelectValue />
    <SelectIndicator />
  </SelectTrigger>
  <SelectPopover>
    <ListBox>
      <ListBoxItem v-for="city in cities" :id="city.id" :key="city.id" :text-value="city.name">
        {{ city.name }}
        <ListBoxItemIndicator />
      </ListBoxItem>
    </ListBox>
  </SelectPopover>
</Select>
```

**3. Overlays take a positional trigger.** `Modal`, `Popover`, `Dropdown`, `Drawer` and
`AlertDialog` make their *first child* the trigger. There is no trigger slot.

```vue
<Modal>
  <Button>Open</Button>
  <ModalBackdrop>
    <ModalContainer>
      <ModalDialog>
        <ModalHeader>
          <ModalHeading>Delete workspace</ModalHeading>
        </ModalHeader>
        <ModalBody>This cannot be undone.</ModalBody>
      </ModalDialog>
    </ModalContainer>
  </ModalBackdrop>
</Modal>
```

**4. The part holding the state is not always the root.** `Table` takes `class` and `variant` and
nothing else; `TableContent` owns `aria-label`, `selection-mode`, `v-model:selected-keys` and
`v-model:sort-descriptor`. Putting them on `Table` compiles and does nothing.

```vue
<Table>
  <TableScrollContainer>
    <TableContent aria-label="Members" selection-mode="multiple">
      <TableHeader>
        <TableColumn id="name" is-row-header>Member</TableColumn>
      </TableHeader>
      <TableBody>
        <TableRow id="1">
          <TableCell>Ada Lovelace</TableCell>
        </TableRow>
      </TableBody>
    </TableContent>
  </TableScrollContainer>
</Table>
```

**5. An indicator belongs to its item.** `TabsIndicator` goes inside each `TabsTab`, not beside the
list. Same for `ListBoxItemIndicator` inside `ListBoxItem` and `MenuItemIndicator` inside
`MenuItem`.

```vue
<Tabs>
  <TabsListContainer>
    <TabsList aria-label="Views">
      <TabsTab id="all">
        All
        <TabsIndicator />
      </TabsTab>
    </TabsList>
  </TabsListContainer>
  <TabsPanel id="all">Everything.</TabsPanel>
</Tabs>
```

**6. Menu parts are shared.** There is no `DropdownItem` export — compose `MenuItem` inside
`DropdownMenu`. The stories alias the name for brevity, so markup copied from one will not compile.

```vue
<Dropdown>
  <Button>Actions</Button>
  <DropdownPopover>
    <DropdownMenu>
      <MenuItem id="rename" text-value="Rename">
        <Label>Rename</Label>
      </MenuItem>
    </DropdownMenu>
  </DropdownPopover>
</Dropdown>
```

**7. `Menu` is the open list; `Dropdown` is that menu in a popover.** A bare `Menu` needs its own
`Surface` to have a background and a border. A `Dropdown` brings one.

**8. Every collection item needs an `id`**, and a `text-value` whenever its content is not plain
text. `id` is what a selection or an action event reports; `text-value` is what typeahead matches.

## Restyling

Every component takes a `class`, and every colour, radius and curve is a custom property, so a
change is a CSS change rather than a fork. State is published on data attributes — `data-hovered`,
`data-pressed`, `data-selected`, `data-focus-visible` — which is how a single state is retuned
without a wrapper.

```css
.thing {
  background-color: var(--rp-accent);
  color: var(--rp-accent-foreground);
}
```

## Where to look next

- <https://ropav.netlify.app/llms-full.txt> — every family's arrangement and props, in one file.
- <https://ropav.netlify.app/llms.txt> — the index, when you want a specific page.
- <https://ropav.netlify.app/patterns/> — whole screen fragments to copy.
