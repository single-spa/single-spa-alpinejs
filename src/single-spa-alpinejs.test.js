import singleSpaAlpinejs from "./single-spa-alpinejs";

describe(`single-spa-alpinejs`, () => {
  it(`Can create lifecycle functions`, () => {
    const lifecycles = singleSpaAlpinejs({
      template: `
        <div x-show="open" class="mui--text-display4">
            Hey, I'm open
        </div>
      `,
    });

    expect(typeof lifecycles.bootstrap).toBe("function");
    expect(typeof lifecycles.mount).toBe("function");
    expect(typeof lifecycles.unmount).toBe("function");
  });
});
