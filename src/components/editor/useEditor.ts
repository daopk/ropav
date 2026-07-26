import { Editor as TiptapEditor, type EditorOptions as TiptapEditorOptions } from '@tiptap/core';
import { nextTick, onBeforeUnmount, onMounted, shallowRef, watch, type ShallowRef } from 'vue';

import { resolveEditorProps } from './editorAttributesModel';
import {
    type EditorHistorySnapshot,
    type EditorSelectionSnapshot,
    isEditorContentEqual,
    isEditorContentReplacement,
    isEditorModelValueEqual,
    readEditorContent,
    readEditorHistory,
    readEditorSelection,
    replaceEditorContent,
    restoreEditorHistory,
} from './editorContentModel';
import type { EditorModelValue, EditorOutput } from './types';

const MAX_TRACKED_PROPOSALS = 20;

interface ControlledProposal {
    content: EditorModelValue;
    historyAfter?: EditorHistorySnapshot;
    historyBefore?: EditorHistorySnapshot;
    selectionAfter: EditorSelectionSnapshot;
    selectionBefore: EditorSelectionSnapshot;
}

interface UseEditorOptions {
    host: ShallowRef<HTMLElement | null>;
    modelValue: () => EditorModelValue | undefined;
    initialContent: () => EditorModelValue;
    output: () => EditorOutput;
    extensions: () => TiptapEditorOptions['extensions'];
    editable: () => boolean;
    autofocus: () => TiptapEditorOptions['autofocus'];
    editorProps: () => TiptapEditorOptions['editorProps'];
    controlAttributes: () => Readonly<Record<string, string>>;
    injectCSS: () => boolean;
    onReady: (editor: TiptapEditor) => void;
    onUpdate: (content: EditorModelValue) => void;
    onDestroy: (editor: TiptapEditor) => void;
}

export function useEditor(options: UseEditorOptions) {
    const editor = shallowRef<TiptapEditor | null>(null);
    const transactionHistories = new WeakMap<object, EditorHistorySnapshot>();
    const transactionSelections = new WeakMap<object, EditorSelectionSnapshot>();
    let activeProposals: ControlledProposal[] = [];
    let appliedReactiveEditorProps = new Set<string>();
    let rejectedProposals: ControlledProposal[] = [];
    let readyEmitted = false;
    let reconciliationId = 0;

    onMounted(() => {
        const host = options.host.value;
        if (!host) return;

        const resolvedEditorProps = resolveCurrentEditorProps();
        const instance = new TiptapEditor({
            element: host,
            content: options.initialContent(),
            extensions: options.extensions(),
            editable: options.editable(),
            autofocus: options.autofocus(),
            editorProps: resolvedEditorProps.initial,
            injectCSS: options.injectCSS(),
            onCreate: ({ editor: createdEditor }) => {
                queueMicrotask(() => {
                    void nextTick(() => {
                        if (
                            readyEmitted ||
                            editor.value !== createdEditor ||
                            createdEditor.isDestroyed ||
                            !createdEditor.isInitialized
                        ) {
                            return;
                        }

                        readyEmitted = true;
                        options.onReady(createdEditor);
                    });
                });
            },
            onUpdate: ({ editor: updatedEditor, transaction }) => {
                const content = readEditorContent(updatedEditor, options.output());
                const selectionBefore =
                    activeProposals[0]?.selectionBefore ??
                    transactionSelections.get(transaction) ??
                    readEditorSelection(updatedEditor);
                const controlled = options.modelValue() !== undefined;
                if (controlled) {
                    activeProposals = appendProposal(activeProposals, {
                        content,
                        historyAfter: readEditorHistory(updatedEditor),
                        historyBefore: transactionHistories.get(transaction),
                        selectionAfter: readEditorSelection(updatedEditor),
                        selectionBefore,
                    });
                }
                options.onUpdate(content);

                if (!controlled) return;

                scheduleControlledReconciliation(
                    updatedEditor,
                    selectionBefore,
                    activeProposals[0]?.historyBefore,
                );
            },
        });

        instance.on('beforeTransaction', ({ editor: updatedEditor, transaction }) => {
            const history = readEditorHistory(updatedEditor);
            if (history) transactionHistories.set(transaction, history);
            transactionSelections.set(transaction, readEditorSelection(updatedEditor));
        });
        instance.on(
            'transaction',
            ({ editor: updatedEditor, transaction, appendedTransactions }) => {
                if (isEditorContentReplacement(transaction)) return;

                const contentChanged =
                    transaction.docChanged ||
                    appendedTransactions.some(
                        (appendedTransaction) => appendedTransaction.docChanged,
                    );
                if (!contentChanged || options.modelValue() === undefined) return;

                const selectionBefore =
                    activeProposals[0]?.selectionBefore ??
                    transactionSelections.get(transaction) ??
                    readEditorSelection(updatedEditor);
                const historyBefore =
                    activeProposals[0]?.historyBefore ?? transactionHistories.get(transaction);
                scheduleControlledReconciliation(updatedEditor, selectionBefore, historyBefore);
            },
        );
        appliedReactiveEditorProps = applyEditorProps(
            instance,
            resolvedEditorProps,
            appliedReactiveEditorProps,
        );
        editor.value = instance;
    });

    watch(
        options.modelValue,
        (content) => {
            if (content === undefined) {
                reconciliationId += 1;
                activeProposals = [];
                rejectedProposals = [];
                return;
            }
            if (!editor.value) return;

            reconciliationId += 1;
            const proposal = consumeProposal(content);
            replaceEditorContent(editor.value, content, {
                history: proposal?.historyAfter,
                selection: proposal?.selectionAfter,
            });
        },
        { deep: true },
    );

    watch(options.editable, (editable) => {
        editor.value?.setEditable(editable, false);
    });

    watch(
        [options.editorProps, options.controlAttributes],
        () => {
            const instance = editor.value;
            if (!instance) return;

            appliedReactiveEditorProps = applyEditorProps(
                instance,
                resolveCurrentEditorProps(),
                appliedReactiveEditorProps,
            );
        },
        { deep: true },
    );

    onBeforeUnmount(() => {
        const instance = editor.value;
        if (!instance) return;

        reconciliationId += 1;
        activeProposals = [];
        rejectedProposals = [];
        instance.destroy();
        editor.value = null;
        options.onDestroy(instance);
    });

    function focus() {
        return editor.value?.commands.focus() ?? false;
    }

    function resolveCurrentEditorProps() {
        return resolveEditorProps(options.editorProps(), options.controlAttributes());
    }

    function scheduleControlledReconciliation(
        instance: TiptapEditor,
        selectionBefore: EditorSelectionSnapshot,
        historyBefore: EditorHistorySnapshot | undefined,
    ) {
        const scheduledReconciliationId = ++reconciliationId;

        queueMicrotask(() => {
            void nextTick(() => {
                if (
                    scheduledReconciliationId !== reconciliationId ||
                    editor.value !== instance ||
                    instance.isDestroyed
                ) {
                    return;
                }

                const authoritativeContent = options.modelValue();
                if (authoritativeContent === undefined) {
                    activeProposals = [];
                    rejectedProposals = [];
                    return;
                }

                if (isEditorContentEqual(instance, authoritativeContent)) {
                    rejectedProposals = archiveProposals(rejectedProposals, activeProposals);
                    activeProposals = [];
                    restoreEditorHistory(instance, historyBefore);
                    return;
                }

                rejectedProposals = archiveProposals(rejectedProposals, activeProposals);
                activeProposals = [];
                replaceEditorContent(instance, authoritativeContent, {
                    history: historyBefore,
                    selection: selectionBefore,
                });
            });
        });
    }

    function consumeProposal(content: EditorModelValue) {
        const proposals = appendProposals(rejectedProposals, activeProposals);
        activeProposals = [];

        for (let index = proposals.length - 1; index >= 0; index -= 1) {
            const proposal = proposals[index];
            if (
                !proposal ||
                !editor.value ||
                !isEditorModelValueEqual(editor.value, proposal.content, content)
            ) {
                continue;
            }

            rejectedProposals = archiveProposals([], proposals.slice(index + 1));
            return proposal;
        }

        rejectedProposals = [];
        return undefined;
    }

    return { editor, focus };
}

function applyEditorProps(
    instance: TiptapEditor,
    resolvedEditorProps: ReturnType<typeof resolveEditorProps>,
    previousReactivePropNames: ReadonlySet<string>,
) {
    const reactiveEditorProps = resolvedEditorProps.reactive as Record<string, unknown>;
    const removedEditorProps = Object.fromEntries(
        [...previousReactivePropNames]
            .filter((name) => !(name in reactiveEditorProps))
            .map((name) => [name, undefined]),
    );
    const editorProps = {
        ...removedEditorProps,
        ...resolvedEditorProps.reactive,
        dispatchTransaction: instance.view.props.dispatchTransaction,
        transformPastedHTML: instance.extensionManager.transformPastedHTML(
            resolvedEditorProps.transformPastedHTML,
        ),
    } as TiptapEditorOptions['editorProps'];
    instance.setOptions({ editorProps });
    return new Set(Object.keys(reactiveEditorProps));
}

function appendProposal(
    proposals: ControlledProposal[],
    proposal: ControlledProposal,
): ControlledProposal[] {
    return appendProposals(proposals, [proposal]);
}

function appendProposals(
    current: ControlledProposal[],
    additions: ControlledProposal[],
): ControlledProposal[] {
    return [...current, ...additions].slice(-MAX_TRACKED_PROPOSALS);
}

function archiveProposals(
    current: ControlledProposal[],
    additions: ControlledProposal[],
): ControlledProposal[] {
    return appendProposals(
        current,
        additions.map(({ content, selectionAfter, selectionBefore }) => ({
            content,
            selectionAfter,
            selectionBefore,
        })),
    );
}
