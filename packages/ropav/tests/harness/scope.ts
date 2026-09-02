import { effectScope } from "vue";

/**
 * Run a composable in a disposable scope, mirroring a component lifetime.
 *
 * A composable that registers a watcher, a listener or a `onScopeDispose` cleanup needs an owner,
 * and outside a component there is none — the watcher would outlive the test and its cleanup would
 * never run, so a suite testing teardown could not observe it at all.
 *
 * The returned disposer is the test's stand-in for unmounting: call it to assert what release
 * looks like, and call it at the end of every other case so a module-level registry does not carry
 * state into the next one.
 *
 * @example
 * ```ts
 * const [state, dispose] = withScope(() => useToggleGroupState({defaultSelectedKeys: ["a"]}));
 * expect(state.isSelected("a")).toBe(true);
 * dispose();
 * ```
 */
export const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};
