# Agent Notes

- Always use Conventional Commits for commit messages.
- Keep production components and bundles zero-VDOM with Vue Vapor; never use `h`, `VNode`, `defineComponent`, or `createVNode`.
- Keep reusable helpers exclusively in `src/utils/`; reuse or extend utilities there instead of scattering helpers or adding component-local `utils`, `helpers`, or `core` modules.
