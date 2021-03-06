/**
 * Opts are passed into single-spa-alpinejs when creating an application/parcel
 * template: (required) main template as string
 * xData: (optional) externally provided x-data as an object or function. The single spa env props are passed to this if its a function
 * xInit: (optional) externally provided x-init as a function it takes an argument as the dom element ID of the application/parcel root element. This will only be used if xData is also provided
 */
const defaultOpts = {
  template: null, // required
  xData: undefined,
  xInit: undefined,
};

export default function singleSpaAlpineJs(opts) {
  opts = Object.assign({}, defaultOpts, opts);

  const typeofTemplate = typeof opts.template;
  const typeofXData = typeof opts.xData;

  if (typeofTemplate !== "function" && typeofTemplate !== "string") {
    throw Error(
      `single-spa-alpinejs: opts.template must be provided as a string or a function that returns a promise that resolves with a string`
    );
  }

  // xData can be optional , but when provided needs to be either a function or an object
  if (opts.xData && typeofXData !== "function" && typeofXData !== "object") {
    throw Error(
      `single-spa-alpinejs: optional parameter opts.xData if provided must be as an object or a function that returns an object`
    );
  }

  // xInit can be optional , but when provided needs to be a function
  if (opts.xInit && typeof opts.xInit !== "function") {
    throw Error(
      `single-spa-alpinejs: optional parameter opts.xInit if provided must be as a function that returns a promise`
    );
  }

  if (typeofTemplate === "string") {
    opts.loadTemplate = () => Promise.resolve(opts.template);
  } else {
    opts.loadTemplate = opts.template;
  }

  return {
    bootstrap: bootstrap.bind(null, opts),
    mount: mount.bind(null, opts),
    unmount: unmount.bind(null, opts),
  };
}

function bootstrap(opts, props) {
  return Promise.resolve();
}

/**
 * Remove special characters from the string
 * @param {*} str
 */
function normalizeString(str) {
  return str && typeof str === "string"
    ? str.replace(/[^a-z0-9,. ]/gi, "_")
    : "";
}

/**
 * Create the Alpine Element
 * @param {*} template - The final template
 * @param {*} opts     - alpine options
 * @param {*} props    - props
 */
function createAlpineElement(template, opts, props) {
  // create any global x-init,x-data functions that are needed
  return Promise.resolve()
    .then(() => {
      // setup opts x-data value
      if (opts.xData) {
        return typeof opts.xData === "function"
          ? opts.xData({ ...props })
          : opts.xData;
      } else {
        return {};
      }
    })
    .then((originalData) => {
      // merge the opts.xData with the single-spa props
      const finalData = Object.assign({}, props, originalData);
      // remove attributes that are not required for alpine x-data
      delete finalData.domElement;
      delete finalData.singleSpa;

      // create child Element
      let childElement = document.createElement("div");
      childElement.id = `alpine-${props.name}`;
      childElement.innerHTML = template;
      const appName = props.appName || props.name;
      const normalizedName = normalizeString(appName);
      // add x-data attribute
      childElement.setAttribute("x-data", JSON.stringify(finalData));

      // Add x-init only if the x-data is provided as an object as both need to be on the same root dom element
      if (opts.xInit) {
        // create any global x-init functions that are needed
        if (window.hasOwnProperty("singleSpaAlpineXInit")) {
          // add new x-init function globally for the specific ID
          window.singleSpaAlpineXInit[normalizedName] = opts.xInit;
        } else {
          window.singleSpaAlpineXInit = { [normalizedName]: opts.xInit };
        }

        // Add x-init attribute
        childElement.setAttribute(
          "x-init",
          `singleSpaAlpineXInit.${normalizedName}('alpine-${appName}')`
        );
      }

      return childElement;
    });
}

function mount(opts, props) {
  return Promise.resolve()
    .then(() => {
      const templatePromise = opts.loadTemplate();
      if (!templatePromise || typeof templatePromise.then !== "function") {
        throw Error(
          `single-spa-alpinejs: template function for application/parcel '${props.name}' must return a promise that resolves with the string template`
        );
      }
      return templatePromise;
    })
    .then((template) => {
      if (typeof template !== "string") {
        throw Error(
          `single-spa-alpinejs: template function for application/parcel returned a promise that resolved with '${typeof template}', but 'string' is required.`
        );
      }

      // create child Element
      const alpineDomElement = createAlpineElement(template, opts, props);
      return alpineDomElement;
    })
    .then((finalDomEl) => {
      const domElementGetter = chooseDomElementGetter(opts, props);
      if (typeof domElementGetter !== "function") {
        throw new Error(
          `single-spa-alpinejs: the domElementGetter for application '${
            props.appName || props.name
          }' is not a function`
        );
      }

      const domElement = domElementGetter(props);
      if (!domElement) {
        throw new Error(
          `single-spa-alpinejs: domElementGetter function for application '${
            props.appName || props.name
          }' did not return a valid dom element. Please pass a valid domElement or domElementGetter via opts or props`
        );
      }

      // wrap in container div
      domElement.appendChild(finalDomEl);
      document.body.appendChild(domElement);
    });
}

function unmount(opts, props) {
  return Promise.resolve().then(() => {
    const domElementGetter = chooseDomElementGetter(opts, props);
    const appName = props.appName || props.name;
    const normalizedName = normalizeString(appName);
    if (typeof domElementGetter !== "function") {
      throw new Error(
        `single-spa-alpinejs: the domElementGetter for application '${
          props.appName || props.name
        }' is not a function`
      );
    }

    const domElement = domElementGetter(props);
    if (!domElement) {
      throw new Error(
        `single-spa-alpinejs: domElementGetter function for application '${
          props.appName || props.name
        }' did not return a valid dom element. Please pass a valid domElement or domElementGetter via opts or props`
      );
    }

    domElement.innerHTML = "";

    // remove any global functions that were used for x-init
    if (opts.xInit) {
      if (
        !window.hasOwnProperty("singleSpaAlpineXInit") ||
        typeof window.singleSpaAlpineXInit[`${normalizedName}`] === "undefined"
      ) {
        throw new Error(
          `single-spa-alpinejs: global function for xInit not found. Optional parameter opts.xInit if provided must be as a function that returns a promise`
        );
      }
      delete window.singleSpaAlpineXInit[`${normalizedName}`];
    }
  });
}

function chooseDomElementGetter(opts, props) {
  if (props.domElement) {
    return () => props.domElement;
  } else if (props.domElementGetter) {
    return props.domElementGetter;
  } else if (opts.domElementGetter) {
    return opts.domElementGetter;
  } else {
    return defaultDomElementGetter(props);
  }
}

function defaultDomElementGetter(props) {
  const appName = props.appName || props.name;
  if (!appName) {
    throw Error(
      `single-spa-alpinejs was not given an application name as a prop, so it can't make a unique dom element container for the alpinejs application`
    );
  }
  const htmlId = `single-spa-application:${appName}`;

  return function defaultDomEl() {
    let domElement = document.getElementById(htmlId);
    if (!domElement) {
      domElement = document.createElement("div");
      domElement.id = htmlId;
      document.body.appendChild(domElement);
    }

    return domElement;
  };
}
