import { posix } from 'node:path';
import type { Plugin } from 'vite';

export function injectComponentCss(): Plugin {
    return {
        name: 'inject-component-css',
        apply(config, { command }) {
            return command === 'build' && !!config.build?.lib;
        },
        enforce: 'post',
        generateBundle(_, bundle) {
            for (const chunk of Object.values(bundle)) {
                if (chunk.type !== 'chunk') continue;
                const importedCss = (chunk as any).viteMetadata?.importedCss as
                    | Set<string>
                    | undefined;
                if (!importedCss?.size) continue;

                const imports = [...importedCss]
                    .map((css) => {
                        const rel = posix.relative(posix.dirname(chunk.fileName), css);
                        return `import '${rel.startsWith('.') ? rel : './' + rel}';`;
                    })
                    .join('\n');
                chunk.code = imports + '\n' + chunk.code;
            }
        },
    };
}
