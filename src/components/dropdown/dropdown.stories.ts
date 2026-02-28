import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Dropdown from './dropdown.vue';
import DropdownTrigger from './dropdown-trigger.vue';
import DropdownContent from './dropdown-content.vue';
import DropdownItem from './dropdown-item.vue';
import DropdownCheckboxItem from './dropdown-checkbox-item.vue';
import DropdownRadioGroup from './dropdown-radio-group.vue';
import DropdownRadioItem from './dropdown-radio-item.vue';
import DropdownSeparator from './dropdown-separator.vue';
import DropdownLabel from './dropdown-label.vue';
import DropdownSub from './dropdown-sub.vue';
import DropdownSubTrigger from './dropdown-sub-trigger.vue';
import DropdownSubContent from './dropdown-sub-content.vue';
import Button from '../button/button.vue';

const meta = {
    title: 'Components/Dropdown',
    component: Dropdown as any,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
    },
    args: {
        size: 'md',
    },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => ({
        components: { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator, Button },
        setup() { return { args }; },
        template: `
            <Dropdown v-bind="args">
                <DropdownTrigger>
                    <Button>Open Menu</Button>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownItem @select="() => {}">New File</DropdownItem>
                    <DropdownItem @select="() => {}">New Window</DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem @select="() => {}">Settings</DropdownItem>
                    <DropdownItem @select="() => {}">Help</DropdownItem>
                </DropdownContent>
            </Dropdown>
        `,
    }),
};

export const WithShortcuts: Story = {
    render: (args) => ({
        components: { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator, Button },
        setup() { return { args }; },
        template: `
            <Dropdown v-bind="args">
                <DropdownTrigger>
                    <Button>Edit</Button>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownItem shortcut="⌘Z" @select="() => {}">Undo</DropdownItem>
                    <DropdownItem shortcut="⌘⇧Z" @select="() => {}">Redo</DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem shortcut="⌘X" @select="() => {}">Cut</DropdownItem>
                    <DropdownItem shortcut="⌘C" @select="() => {}">Copy</DropdownItem>
                    <DropdownItem shortcut="⌘V" @select="() => {}">Paste</DropdownItem>
                </DropdownContent>
            </Dropdown>
        `,
    }),
};

export const WithDisabledAndDestructive: Story = {
    render: (args) => ({
        components: { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator, Button },
        setup() { return { args }; },
        template: `
            <Dropdown v-bind="args">
                <DropdownTrigger>
                    <Button>Actions</Button>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownItem @select="() => {}">Edit</DropdownItem>
                    <DropdownItem @select="() => {}">Duplicate</DropdownItem>
                    <DropdownItem disabled>Archive</DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem destructive @select="() => {}">Delete</DropdownItem>
                </DropdownContent>
            </Dropdown>
        `,
    }),
};

export const CheckboxItems: Story = {
    render: (args) => ({
        components: { Dropdown, DropdownTrigger, DropdownContent, DropdownCheckboxItem, DropdownLabel, DropdownSeparator, Button },
        setup() {
            const showToolbar = ref(true);
            const showSidebar = ref(false);
            const showStatus = ref(true);
            return { args, showToolbar, showSidebar, showStatus };
        },
        template: `
            <Dropdown v-bind="args">
                <DropdownTrigger>
                    <Button>View</Button>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownLabel>Panels</DropdownLabel>
                    <DropdownCheckboxItem v-model="showToolbar">Toolbar</DropdownCheckboxItem>
                    <DropdownCheckboxItem v-model="showSidebar">Sidebar</DropdownCheckboxItem>
                    <DropdownCheckboxItem v-model="showStatus">Status Bar</DropdownCheckboxItem>
                </DropdownContent>
            </Dropdown>
        `,
    }),
};

export const RadioItems: Story = {
    render: (args) => ({
        components: { Dropdown, DropdownTrigger, DropdownContent, DropdownRadioGroup, DropdownRadioItem, DropdownLabel, DropdownSeparator, Button },
        setup() {
            const theme = ref('system');
            return { args, theme };
        },
        template: `
            <Dropdown v-bind="args">
                <DropdownTrigger>
                    <Button>Theme: {{ theme }}</Button>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownLabel>Appearance</DropdownLabel>
                    <DropdownRadioGroup v-model="theme">
                        <DropdownRadioItem value="light">Light</DropdownRadioItem>
                        <DropdownRadioItem value="dark">Dark</DropdownRadioItem>
                        <DropdownRadioItem value="system">System</DropdownRadioItem>
                    </DropdownRadioGroup>
                </DropdownContent>
            </Dropdown>
        `,
    }),
};

export const Submenu: Story = {
    render: (args) => ({
        components: { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator, DropdownSub, DropdownSubTrigger, DropdownSubContent, Button },
        setup() { return { args }; },
        template: `
            <Dropdown v-bind="args">
                <DropdownTrigger>
                    <Button>File</Button>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownItem shortcut="⌘N" @select="() => {}">New File</DropdownItem>
                    <DropdownSub>
                        <DropdownSubTrigger>Open Recent</DropdownSubTrigger>
                        <DropdownSubContent>
                            <DropdownItem @select="() => {}">project.ts</DropdownItem>
                            <DropdownItem @select="() => {}">config.json</DropdownItem>
                            <DropdownItem @select="() => {}">README.md</DropdownItem>
                        </DropdownSubContent>
                    </DropdownSub>
                    <DropdownSub>
                        <DropdownSubTrigger>Share</DropdownSubTrigger>
                        <DropdownSubContent>
                            <DropdownItem @select="() => {}">Email Link</DropdownItem>
                            <DropdownItem @select="() => {}">Copy Link</DropdownItem>
                        </DropdownSubContent>
                    </DropdownSub>
                    <DropdownSeparator />
                    <DropdownItem shortcut="⌘S" @select="() => {}">Save</DropdownItem>
                    <DropdownItem shortcut="⌘⇧S" @select="() => {}">Save As...</DropdownItem>
                </DropdownContent>
            </Dropdown>
        `,
    }),
};

export const Complex: Story = {
    render: (args) => ({
        components: {
            Dropdown, DropdownTrigger, DropdownContent, DropdownItem,
            DropdownCheckboxItem, DropdownRadioGroup, DropdownRadioItem,
            DropdownSeparator, DropdownLabel, DropdownSub, DropdownSubTrigger,
            DropdownSubContent, Button,
        },
        setup() {
            const wordWrap = ref(true);
            const minimap = ref(false);
            const fontSize = ref('medium');
            return { args, wordWrap, minimap, fontSize };
        },
        template: `
            <Dropdown v-bind="args">
                <DropdownTrigger>
                    <Button variant="outline">Preferences</Button>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownLabel>Editor</DropdownLabel>
                    <DropdownCheckboxItem v-model="wordWrap">Word Wrap</DropdownCheckboxItem>
                    <DropdownCheckboxItem v-model="minimap">Minimap</DropdownCheckboxItem>
                    <DropdownSeparator />
                    <DropdownLabel>Font Size</DropdownLabel>
                    <DropdownRadioGroup v-model="fontSize">
                        <DropdownRadioItem value="small">Small</DropdownRadioItem>
                        <DropdownRadioItem value="medium">Medium</DropdownRadioItem>
                        <DropdownRadioItem value="large">Large</DropdownRadioItem>
                    </DropdownRadioGroup>
                    <DropdownSeparator />
                    <DropdownSub>
                        <DropdownSubTrigger>Theme</DropdownSubTrigger>
                        <DropdownSubContent>
                            <DropdownItem @select="() => {}">GitHub Light</DropdownItem>
                            <DropdownItem @select="() => {}">GitHub Dark</DropdownItem>
                            <DropdownItem @select="() => {}">Dracula</DropdownItem>
                            <DropdownItem @select="() => {}">One Dark Pro</DropdownItem>
                        </DropdownSubContent>
                    </DropdownSub>
                    <DropdownSeparator />
                    <DropdownItem shortcut="⌘," @select="() => {}">All Settings...</DropdownItem>
                </DropdownContent>
            </Dropdown>
        `,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator, Button },
        template: `
            <div style="display: flex; gap: 16px; align-items: flex-start;">
                <Dropdown size="sm">
                    <DropdownTrigger>
                        <Button size="sm">Small</Button>
                    </DropdownTrigger>
                    <DropdownContent>
                        <DropdownItem @select="() => {}">Action 1</DropdownItem>
                        <DropdownItem @select="() => {}">Action 2</DropdownItem>
                        <DropdownItem @select="() => {}">Action 3</DropdownItem>
                    </DropdownContent>
                </Dropdown>
                <Dropdown size="md">
                    <DropdownTrigger>
                        <Button size="md">Medium</Button>
                    </DropdownTrigger>
                    <DropdownContent>
                        <DropdownItem @select="() => {}">Action 1</DropdownItem>
                        <DropdownItem @select="() => {}">Action 2</DropdownItem>
                        <DropdownItem @select="() => {}">Action 3</DropdownItem>
                    </DropdownContent>
                </Dropdown>
                <Dropdown size="lg">
                    <DropdownTrigger>
                        <Button size="lg">Large</Button>
                    </DropdownTrigger>
                    <DropdownContent>
                        <DropdownItem @select="() => {}">Action 1</DropdownItem>
                        <DropdownItem @select="() => {}">Action 2</DropdownItem>
                        <DropdownItem @select="() => {}">Action 3</DropdownItem>
                    </DropdownContent>
                </Dropdown>
            </div>
        `,
    }),
};

export const NestedSubmenu: Story = {
    render: (args) => ({
        components: {
            Dropdown, DropdownTrigger, DropdownContent, DropdownItem,
            DropdownSeparator, DropdownSub, DropdownSubTrigger,
            DropdownSubContent, Button,
        },
        setup() { return { args }; },
        template: `
            <Dropdown v-bind="args">
                <DropdownTrigger>
                    <Button>Navigate</Button>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownItem @select="() => {}">Home</DropdownItem>
                    <DropdownItem @select="() => {}">Dashboard</DropdownItem>
                    <DropdownSeparator />
                    <DropdownSub>
                        <DropdownSubTrigger>Components</DropdownSubTrigger>
                        <DropdownSubContent>
                            <DropdownItem @select="() => {}">Button</DropdownItem>
                            <DropdownItem @select="() => {}">Input</DropdownItem>
                            <DropdownSub>
                                <DropdownSubTrigger>Feedback</DropdownSubTrigger>
                                <DropdownSubContent>
                                    <DropdownItem @select="() => {}">Alert</DropdownItem>
                                    <DropdownItem @select="() => {}">Modal</DropdownItem>
                                    <DropdownSub>
                                        <DropdownSubTrigger>Toast</DropdownSubTrigger>
                                        <DropdownSubContent>
                                            <DropdownItem @select="() => {}">Success</DropdownItem>
                                            <DropdownItem @select="() => {}">Error</DropdownItem>
                                            <DropdownItem @select="() => {}">Warning</DropdownItem>
                                            <DropdownItem @select="() => {}">Info</DropdownItem>
                                        </DropdownSubContent>
                                    </DropdownSub>
                                    <DropdownItem @select="() => {}">Tooltip</DropdownItem>
                                </DropdownSubContent>
                            </DropdownSub>
                            <DropdownItem @select="() => {}">Select</DropdownItem>
                        </DropdownSubContent>
                    </DropdownSub>
                    <DropdownSeparator />
                    <DropdownItem @select="() => {}">Settings</DropdownItem>
                </DropdownContent>
            </Dropdown>
        `,
    }),
};

export const AlignEnd: Story = {
    render: (args) => ({
        components: { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, Button },
        setup() { return { args }; },
        template: `
            <div style="display: flex; justify-content: flex-end;">
                <Dropdown v-bind="args">
                    <DropdownTrigger>
                        <Button>Right-aligned</Button>
                    </DropdownTrigger>
                    <DropdownContent align="end">
                        <DropdownItem @select="() => {}">Profile</DropdownItem>
                        <DropdownItem @select="() => {}">Settings</DropdownItem>
                        <DropdownItem @select="() => {}">Sign Out</DropdownItem>
                    </DropdownContent>
                </Dropdown>
            </div>
        `,
    }),
};
