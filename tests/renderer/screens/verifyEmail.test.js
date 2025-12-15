describe("logic/verifyEmail.js (Verify Email screen)", () => {
  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = `
      <form id="signup_form">
        <input id="code" />
        <button type="submit">Verificar</button>
        <p id="error-message"></p>
      </form>
    `;

    window.api = { verifyEmail: jest.fn() };

    global.alert = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});

    window.history.pushState({}, "", "/verifyEmail.html?email=test%40mail.com");
  });

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


  test("verify success: llama api y muestra alerta de éxito", async () => {
    window.api.verifyEmail.mockResolvedValueOnce({ success: true });

    require("../../../logic/verifyEmail.js");
    window.dispatchEvent(new Event("DOMContentLoaded"));

    document.getElementById("code").value = "123456";
    document.getElementById("signup_form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await flushPromises();

    expect(window.api.verifyEmail).toHaveBeenCalledWith("test@mail.com", "123456");
    expect(global.alert).toHaveBeenCalledWith("¡Verificación exitosa! Puedes iniciar sesión.");
    expect(console.log).toHaveBeenCalled();
  });

  test("verify fail: muestra mensaje en #error-message", async () => {
    window.api.verifyEmail.mockResolvedValueOnce({ success: false, message: "Wrong code" });

    require("../../../logic/verifyEmail.js");
    window.dispatchEvent(new Event("DOMContentLoaded"));

    document.getElementById("code").value = "000000";
    document.getElementById("signup_form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await flushPromises();

    expect(document.getElementById("error-message").textContent)
      .toMatch(/código incorrecto|error de red/i);
  });
});
