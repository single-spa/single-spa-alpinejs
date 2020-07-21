// Opts are passed into single-spa-alpinejs when creating an application/parcel
const defaultOpts = {
  // required
  template: null,
};

export default function singleSpaAlpineJs(opts) {
  opts = Object.assign({}, defaultOpts, opts);

  const typeofTemplate = typeof opts.template;

  if (typeofTemplate !== "function" && typeofTemplate !== "string") {
    throw Error(
      `single-spa-alpinejs: opts.template must be provided as a string or a function that returns a promise that resolves with a string`
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

      domElement.innerHTML = template;
      // TODO - create any global x-init functions that are needed
      // TODO - pass single-spa props to the alpinejs application somehow. Maybe through domElement.__x.$data.singleSpaProps?
    });
}

function unmount(opts, props) {
  return Promise.resolve().then(() => {
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

    domElement.innerHTML = "";
    // TODO, remove any global functions that were used for x-init
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
