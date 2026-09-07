// Tailwind for the suite's own fixtures, which is a property of this test app rather than of the
// library - see the file.
import "./tailwind.css";
// The stylesheet this package ships, so browser tests assert against what a consumer installs -
// `@ropav/styles` plus the rules carried here on top of it. Without it a collapsed panel would
// only look collapsed because of `hidden`, and axe would judge contrast on unstyled markup.
//
// Vite follows the `@import` graph on its own now; nothing compiles it, which is the point.
import "@/styles.css";
