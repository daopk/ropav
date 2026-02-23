import { readdirSync } from 'node:fs'
import { resolve, posix } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

const componentDirs = readdirSync('src/components', { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('_'))
  .map(d => d.name)

const componentEntries = componentDirs.reduce<Record<string, string>>((entries, name) => {
  entries[`components/${name}/index`] = resolve(__dirname, `src/components/${name}/index.ts`)
  return entries
}, {})

function injectComponentCss(): Plugin {
  return {
    name: 'inject-component-css',
    apply(config, { command }) {
      return command === 'build' && !!config.build?.lib
    },
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue
        const importedCss = (chunk as any).viteMetadata?.importedCss as Set<string> | undefined
        if (!importedCss?.size) continue

        const imports = [...importedCss]
          .map(css => {
            const rel = posix.relative(posix.dirname(chunk.fileName), css)
            return `import '${rel.startsWith('.') ? rel : './' + rel}';`
          })
          .join('\n')
        chunk.code = imports + '\n' + chunk.code
      }
    },
  }
}

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables" as *;\n@use "@/styles/mixins" as *;\n`,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.app.json',
      cleanVueFileName: true,
      include: ['src/index.ts', 'src/components/**/*.vue', 'src/components/**/*.ts'],
    }),
    injectComponentCss(),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        base: resolve(__dirname, 'src/styles/base.scss'),
        ...componentEntries,
      },
      formats: ['es'],
    },
    minify: false,
    sourcemap: true,
    cssCodeSplit: true,
    rolldownOptions: {
      external: ['vue'],
      output: {
        chunkFileNames: '[name].js',
      },
    },
  },
})
