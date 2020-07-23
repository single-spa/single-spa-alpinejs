import singleSpaAlpinejs from "./single-spa-alpinejs";

describe(`single-spa-alpinejs`, () => {
  const domElementGetter = () => document.getElementById("test-div");
  const domElementGetterTwo = () => document.getElementById("test2-div");
  const domElementAlpineGetter = (id) =>
    document.getElementById(`alpine-${id}`);

  const getCombinedProps = (props, originalData) => {
    return Object.assign({}, props, originalData);
  };

  const appOneTemplate = `
    <div class="mui-panel" x-data="{ open: false }">
      <div class="mui--test-display1">Test x-show</div>
      <button class="mui-btn mui-btn--primary" @click="open = !open">Open/Close</button>
      <div x-show="open" class="mui--text-display4">
          Hey, I'm open
      </div>
    </div>`;

  const appTwoTemplate = `
    <div class="mui-panel">
      <div class="mui--test-display1"> Test x-show</div>
      <button class="mui-btn mui-btn--primary" @click="open = !open">Open/Close</button>
      <div x-show="open" class="mui--text-display4">
          Hey, I'm open
      </div>
    </div>
  `;

  const appThreeData = ({ title, name }) => ({
    title,
    intro:
      'Implement a simple <code class="text-md text-pink-600">fetch()</code> request to render a list of items using Alpine.js :)',
    users: [],
    open: false,
    name,
  });

  const appThreeFn = (id) => {
    return fetch("https://jsonplaceholder.typicode.com/users")
      .then((response) => response.json())
      .then(
        (data) => (document.querySelector(`#${id}`).__x.$data.users = data)
      );
  };

  const appThreeTemplate = `
    <div class="w-full h-full text-gray-800">
        <h1 class="mt-0 mb-3 font-light text-3xl" x-text="title"><!-- title text --></h1>
        <p class="text-xl text-gray-600 font-light mb-4" x-html="intro"><!-- intro text --></p>
        <div class="flex flex-wrap -mx-2 pb-8">
        <!-- begin: user card -->
        <template x-for="user in users" :key="user.id">
            <div class="w-full md:w-1/2 lg:w-1/3 xl:w-1/4 h-auto font-light">
            <div class="flex bg-white rounded-lg shadow-md m-2 border-l-4 border-white hover:shadow-2xl hover:border-pink-500 cursor-pointer relative">
                <div class="p-4 pr-6 leading-normal">
                <div class="font-medium text-xl truncate" x-text="user.name"></div>
                <div class="truncate uppercase text-xs text-gray-500 font-semibold pb-2 tracking-widest" x-text="user.company.name"></div>
                <div class="" x-text="user.phone"></div>
                <a class="text-blue-600 hover:text-blue-700 mr-4 block" x-bind:href="'mailto:' + user.email" x-text="user.email"></a>     
                <a class="text-blue-600 hover:text-blue-700 block" x-bind:href="'https://' + user.website" x-text="user.website"></a>
                </div>
            </div>
            </div>
        </template>
        <!-- end: user card -->
        </div>
    </div>
  `;

  let props;
  let propsTwo;

  beforeEach(() => {
    const div = document.createElement("div");
    div.id = "test-div";
    document.body.appendChild(div);

    props = { name: "test" };
    propsTwo = { name: "testTwo" };
  });

  afterEach(() => {
    document.getElementById("test-div").remove();
    window.singleSpaAlpineXInit = null;
  });

  it(`Can create lifecycle functions`, () => {
    const lifecycles = singleSpaAlpinejs({
      template: appOneTemplate.trim(),
    });

    const domEl = domElementGetter();
    expect(domEl.innerHTML.trim()).toBe("");
    expect(typeof lifecycles.bootstrap).toBe("function");
    expect(typeof lifecycles.mount).toBe("function");
    expect(typeof lifecycles.unmount).toBe("function");
  });

  it(`Can create lifecycle functions with x-data as object`, () => {
    const lifecycles = singleSpaAlpinejs({
      template: appTwoTemplate.trim(),
      xData: { open: false },
    });

    const domEl = domElementGetter();
    expect(domEl.innerHTML.trim()).toBe("");
    expect(typeof lifecycles.bootstrap).toBe("function");
    expect(typeof lifecycles.mount).toBe("function");
    expect(typeof lifecycles.unmount).toBe("function");
  });

  it(`Can create lifecycle functions with x-data as function`, () => {
    const lifecycles = singleSpaAlpinejs({
      template: appTwoTemplate.trim(),
      xData: () => ({ open: false }),
    });

    const domEl = domElementGetter();
    expect(domEl.innerHTML.trim()).toBe("");
    expect(typeof lifecycles.bootstrap).toBe("function");
    expect(typeof lifecycles.mount).toBe("function");
    expect(typeof lifecycles.unmount).toBe("function");
  });

  it(`throws if we create lifecycle functions with x-data as string`, () => {
    expect(() =>
      singleSpaAlpinejs({
        template: appTwoTemplate.trim(),
        xData: "({ open: false })",
      })
    ).toThrow();
  });

  it(`throws if you don't provide a template`, () => {
    expect(() => {
      singleSpaAlpinejs({});
    }).toThrow();
  });

  it(`throws if you provide a non-string template`, () => {
    expect(() => {
      singleSpaAlpinejs({
        template: 123,
      });
    }).toThrow();
  });

  it(`throws if you provide a domElementGetter that is not a function`, () => {
    expect(() => {
      singleSpaAlpinejs({
        template: {},
      });
    }).toThrow();
  });

  it(`renders function template with x-data , template and props`, () => {
    const lifecycles = singleSpaAlpinejs({
      template: () => Promise.resolve(appTwoTemplate.trim()),
      xData: { open: false },
      domElementGetter,
    });

    return lifecycles
      .bootstrap(props)
      .then(() => lifecycles.mount(props))
      .then(() => {
        const domEl = domElementAlpineGetter(props.name);
        expect(domEl.getAttribute("x-data").trim()).toBe(
          JSON.stringify(getCombinedProps(props, { open: false })).trim()
        );
        expect(domEl.innerHTML.trim()).toBe(appTwoTemplate.trim());
      });
  });

  it(`renders function template with x-data , x-init template and props`, () => {
    const opts = {
      template: appThreeTemplate,
      xData: (data) => appThreeData(data), // pass props to x-data
      xInit: appThreeFn,
      domElementGetter,
    };

    const lifecycles = singleSpaAlpinejs(opts);
    const appName = props.appName || props.name;
    expect(window.singleSpaAlpineXInit).not.toBeTruthy();
    return lifecycles
      .bootstrap(props)
      .then(() => lifecycles.mount(props))
      .then(() => {
        const domEl = domElementAlpineGetter(props.name);
        expect(domEl.getAttribute("x-data").trim()).toBe(
          JSON.stringify(getCombinedProps(props, appThreeData(props))).trim()
        );
        expect(domEl.getAttribute("x-init").trim()).toBe(
          `singleSpaAlpineXInit.${appName}('alpine-${appName}')`.trim()
        );
        expect(domEl.innerHTML.trim()).toBe(appThreeTemplate.trim());
        expect(window.singleSpaAlpineXInit).toHaveProperty(
          `${appName}`,
          appThreeFn
        );
      });
  });

  it(`renders function template with function with only template returning a promise`, () => {
    const lifecycles = singleSpaAlpinejs({
      template: () => Promise.resolve(appOneTemplate.trim()),
      domElementGetter,
    });

    return lifecycles
      .bootstrap(props)
      .then(() => lifecycles.mount(props))
      .then(() => {
        const domEl = domElementAlpineGetter(props.name);
        expect(domEl.innerHTML.trim()).toBe(appOneTemplate.trim());
      });
  });

  it(`throws if you provide a xInit that is not a function`, () => {
    const opts = {
      template: appThreeTemplate,
      xData: (data) => appThreeData(data), // pass props to x-data
      xInit: "appThreeFn",
      domElementGetter,
    };

    expect(() => {
      singleSpaAlpinejs(opts);
    }).toThrow();
  });

  it(`throws if you provide a xData that is not a function or object`, () => {
    const opts = {
      template: appThreeTemplate,
      xData: "string value", // pass props to x-data
      xInit: appThreeFn,
      domElementGetter,
    };

    expect(() => {
      singleSpaAlpinejs(opts);
    }).toThrow();
  });

  it(`renders multiple parcels with x-init`, () => {
    const optsOne = {
      template: appThreeTemplate,
      xData: (data) => appThreeData(data), // pass props to x-data
      xInit: appThreeFn,
      domElementGetter,
    };

    const optsTwo = {
      template: () => Promise.resolve(appTwoTemplate.trim()),
      xData: { open: false },
      domElementGetterTwo,
    };

    const lifecyclesOne = singleSpaAlpinejs(optsOne);
    const lifecyclesTwo = singleSpaAlpinejs(optsTwo);
    expect(window.singleSpaAlpineXInit).not.toBeTruthy();
    lifecyclesOne
      .bootstrap(props)
      .then(() => lifecyclesOne.mount(props))
      .then(() => {
        expect(window.singleSpaAlpineXInit).toHaveProperty(`${props.name}`);
      });
    lifecyclesTwo
      .bootstrap(propsTwo)
      .then(() => lifecyclesTwo.mount(propsTwo))
      .then(() => {
        expect(window.singleSpaAlpineXInit).toHaveProperty(`${propsTwo.name}`);
      });
  });
});
