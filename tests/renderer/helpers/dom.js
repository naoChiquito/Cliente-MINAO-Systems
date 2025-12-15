function runOnDOMContentLoaded(modulePath) {
  const realAdd = document.addEventListener.bind(document);

  const spy = jest
    .spyOn(document, "addEventListener")
    .mockImplementation((type, cb, opts) => {
      if (type === "DOMContentLoaded") {
        cb(new Event("DOMContentLoaded"));
        return;
      }
      return realAdd(type, cb, opts);
    });

  require(modulePath);
  spy.mockRestore();
}

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

module.exports = { runOnDOMContentLoaded, flushPromises };
