<script setup lang="ts">
import {
  Button,
  Description,
  FieldGroup,
  Fieldset,
  FieldsetLegend,
  Form,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxItemIndicator,
  Select,
  SelectIndicator,
  SelectPopover,
  SelectTrigger,
  SelectValue,
  Switch,
  SwitchContent,
  SwitchControl,
  SwitchGroup,
  SwitchThumb,
  Tabs,
  TabsIndicator,
  TabsList,
  TabsListContainer,
  TabsPanel,
  TabsTab,
  TextArea,
  TextField,
  ToastProvider,
  ToastQueue,
} from "ropav";

const queue = new ToastQueue({ maxVisibleToasts: 3 });

const sections = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "advanced", label: "Advanced" },
];

const alerts = [
  { isOn: true, label: "Email me on every reply", name: "replies" },
  { label: "Weekly digest", name: "digest" },
  { label: "Product announcements", name: "announcements" },
];

const regions = [
  { id: "eu", name: "Europe" },
  { id: "us", name: "United States" },
  { id: "ap", name: "Asia Pacific" },
];

const byName = (region: { name: string }) => region.name;

const onSubmit = (event: Event) => {
  event.preventDefault();

  const data = new FormData(event.target as HTMLFormElement);

  queue.add({
    description: `Submitted: ${[...data.keys()].join(", ")}.`,
    title: "Settings saved",
    variant: "success",
  });
};
</script>

<template>
  <Form class="settings" @submit="onSubmit">
    <Tabs>
      <TabsListContainer>
        <TabsList aria-label="Settings">
          <TabsTab v-for="section in sections" :id="section.id" :key="section.id">
            {{ section.label }}
            <TabsIndicator />
          </TabsTab>
        </TabsList>
      </TabsListContainer>

      <TabsPanel id="profile" class="panel" should-force-mount>
        <Fieldset>
          <FieldsetLegend>Profile</FieldsetLegend>

          <FieldGroup>
            <TextField default-value="Ada Lovelace" is-required name="name">
              <Label>Name</Label>
              <Input />
            </TextField>

            <TextField name="bio">
              <Label>Bio</Label>
              <TextArea full-width rows="3" />
              <Description>Shown beside your name on anything you publish.</Description>
            </TextField>
          </FieldGroup>
        </Fieldset>
      </TabsPanel>

      <TabsPanel id="notifications" class="panel" should-force-mount>
        <Fieldset>
          <FieldsetLegend>Notifications</FieldsetLegend>

          <SwitchGroup>
            <Switch
              v-for="alert in alerts"
              :key="alert.name"
              :default-selected="alert.isOn"
              :name="alert.name"
              value="on"
            >
              <SwitchContent>
                <SwitchControl>
                  <SwitchThumb />
                </SwitchControl>
                {{ alert.label }}
              </SwitchContent>
            </Switch>
          </SwitchGroup>
        </Fieldset>
      </TabsPanel>

      <TabsPanel id="advanced" class="panel" should-force-mount>
        <Fieldset>
          <FieldsetLegend>Advanced</FieldsetLegend>

          <FieldGroup>
            <Select
              default-value="eu"
              full-width
              :item-text-value="byName"
              :items="regions"
              name="region"
            >
              <Label>Region</Label>
              <SelectTrigger>
                <SelectValue />
                <SelectIndicator />
              </SelectTrigger>
              <SelectPopover>
                <ListBox>
                  <ListBoxItem
                    v-for="region in regions"
                    :id="region.id"
                    :key="region.id"
                    :text-value="region.name"
                  >
                    {{ region.name }}
                    <ListBoxItemIndicator />
                  </ListBoxItem>
                </ListBox>
              </SelectPopover>
              <Description>Where this workspace stores its data.</Description>
            </Select>
          </FieldGroup>
        </Fieldset>
      </TabsPanel>
    </Tabs>

    <div class="actions">
      <Button type="reset" variant="secondary">Cancel</Button>
      <Button type="submit">Save changes</Button>
    </div>

    <ToastProvider placement="bottom" :queue />
  </Form>
</template>

<style scoped>
.settings {
  max-width: var(--rp-container-md);
}

.panel {
  padding-block: calc(var(--rp-spacing) * 4);
}

/* Force-mounting keeps a panel in the layout as well as in the DOM. A hidden field still submits. */
.panel[data-inert] {
  display: none;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--rp-spacing) * 3);
  padding-top: calc(var(--rp-spacing) * 4);
  border-top: 1px solid var(--rp-border);
}
</style>
