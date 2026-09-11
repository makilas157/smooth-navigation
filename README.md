# Smooth Navigation

https://github.com/makilas157/tevexxo-studio-build.git                                                            Fix a bug where pages sometimes appear blank/invisible when navigating between routes, plus improve overall navigation performance and code quality. Note: this app runs in the browser's single main thread — there is no literal "extra thread" to add here since there's no heavy computation (no Web Workers needed); the goal below is to reduce unnecessary work on the main thread instead.

1. In `src/components/Reveal.tsx`, the IntersectionObserver that fades content in has no fallback — if it never fires (route-change timing, SSR/hydration, element already in view before the observer attaches), the content stays stuck at opacity: 0 forever. This is the main cause of pages looking blank after navigation. Fix:

   - Reset `shown` to false at the start of the effect so no stale state leaks between route mounts.

   - Add a 500ms fallback `setTimeout` that forces `shown = true` if the observer hasn't fired yet.

   - Clear both the observer and the timeout in the effect's cleanup function.

2. In `src/router.tsx`, change `defaultPreloadStaleTime: 0` to `defaultPreloadStaleTime: 30_000` and add `defaultPreload: "intent"` to the `createRouter` config, so routes preload their data on link hover/focus instead of needlessly refetching on every navigation.

3. In `src/components/CursorSpider.tsx`, the requestAnimationFrame loop currently runs on every frame forever, even when the cursor is idle and the spider has fully caught up to it — this wastes main-thread work continuously on every page. Fix:

   - In the `tick` function, after updating position/velocity, check if the spider has "settled" (velocity magnitude and distance-to-target both below a small threshold, e.g. < 0.05 and < 0.5).

   - If settled, stop scheduling further frames (don't call `requestAnimationFrame` again).

   - Only resume the loop when a new `pointermove` event arrives (wake it back up from the move handler).

   - Keep the existing cleanup (cancelAnimationFrame + clearTimeout) intact.

4. Create a new component `src/components/RouteSkeleton.tsx` — a simple animated placeholder using `animate-pulse` and `bg-muted` classes, roughly matching a page-header + two-column detail layout (a title bar, an image-sized block, and a few text-line blocks). Set it as the `pendingComponent` in the route config for:

   - `src/routes/products/$slug.tsx`

   - `src/routes/services/$slug.tsx`

   - `src/routes/blogs/$slug.tsx`

   so navigating to any detail page never shows a blank flash while the loader resolves.

5. General code-quality pass while you're in there:

   - Audit other components for useEffect hooks that set up timers/listeners/observers without proper cleanup on unmount.

   - Make sure any state that depends on route params resets correctly when navigating between two instances of the same dynamic route (e.g. /products/a → /products/b).

   - Run `npm run lint` and fix any warnings it surfaces.

After making these changes, run `npm run build` to confirm it compiles cleanly with no TypeScript or build errors, then manually test navigating across every page (Home, About, Products, Product detail, Services, Service detail, Blogs, Blog detail, Contact, Why Us, Projects) to confirm content renders immediately every time, with no blank or invisible sections.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e01ed9a1-59e0-4657-b532-06f21bc85587).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
