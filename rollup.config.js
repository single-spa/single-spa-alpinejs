import babel from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: "src/single-spa-alpinejs.js",
    output: [
      {
        file: "lib/umd/single-spa-alpinejs.js",
        format: "umd",
        name: "singleSpaAlpineJs",
        sourcemap: true,
      },
      {
        file: "lib/system/single-spa-alpinejs.js",
        format: "system",
        sourcemap: true,
      },
      {
        file: "lib/esm/single-spa-alpinejs.js",
        format: "esm",
        sourcemap: true,
      },
      {
        file: "lib/cjs/single-spa-alpinejs.cjs",
        format: "cjs",
        sourcemap: true,
      },
    ],
    plugins: [babel({ babelHelpers: "bundled" }), terser()],
  },
  {
    input: "src/single-spa-alpinejs.js",
    output: {
      file: "lib/es2015/single-spa-alpinejs.js",
      format: "esm",
      sourcemap: true,
    },
    plugins: [
      babel({ babelHelpers: "bundled" }),
      terser({
        ecma: 6,
        module: true,
      }),
    ],
  },
];
