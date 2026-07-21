import { posix } from 'node:path';
import type { Plugin } from 'vite';

interface ViteBundleEntry {
    type: 'asset' | 'chunk';
    fileName: string;
    code?: string;
    viteMetadata?: {
        importedCss?: Set<string>;
    };
}

export function injectComponentCssImports(bundle: Record<string, ViteBundleEntry>) {
    for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk' || chunk.code === undefined) continue;
        const importedCss = chunk.viteMetadata?.importedCss;
        if (!importedCss?.size) continue;

        const imports = [...importedCss]
            .map((css) => {
                const relativePath = posix.relative(posix.dirname(chunk.fileName), css);
                return `import '${relativePath.startsWith('.') ? relativePath : './' + relativePath}';`;
            })
            .join('\n');
        chunk.code = `${imports}\n${chunk.code}`;
    }
}

export function injectComponentCss(): Plugin {
    return {
        name: 'inject-component-css',
        apply(config, { command }) {
            return command === 'build' && !!config.build?.lib;
        },
        enforce: 'post',
        generateBundle(_, bundle) {
            injectComponentCssImports(bundle);
        },
    };
}
