// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import packageJson from './package.json';

export default defineConfig({
  vite: {
    // Route-split controls are not all discovered on startup. Prepare the entire
    // installed Radix family together so opening a new control cannot rebundle React.
    optimizeDeps: {
      include: [
        'recharts', 'react', 'react-dom/client', 'react/jsx-runtime',
        ...Object.keys(packageJson.dependencies).filter(name => name.startsWith('@radix-ui/')),
      ],
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
