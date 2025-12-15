describe("logic/logIn.js (Login screen)", () => {
  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = `
      <form id="login_form">
        <input id="email" type="email" />
        <input id="password" type="password" />
        <button type="submit">Entrar</button>
      </form>
    `;

    window.api = { login: jest.fn() };

    global.alert = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});

    localStorage.clear();
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


  test("login success: guarda session y muestra bienvenida", async () => {
    window.api.login.mockResolvedValueOnce({
      success: true,
      data: {
        userId: 7,
        name: "Lilly",
        paternalSurname: "G",
        token: "tok",
        email: "l@l.com",
        role: "Instructor"
      }
    });

    require("../../../logic/logIn.js");
    window.dispatchEvent(new Event("DOMContentLoaded"));

    document.getElementById("email").value = "l@l.com";
    document.getElementById("password").value = "1234";

    document.getElementById("login_form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await flushPromises();

    expect(window.api.login).toHaveBeenCalledWith("l@l.com", "1234");

    expect(localStorage.getItem("userId")).toBe("7");
    expect(localStorage.getItem("userName")).toBe("Lilly");
    expect(localStorage.getItem("userPaternalSurname")).toBe("G");
    expect(localStorage.getItem("token")).toBe("tok");
    expect(localStorage.getItem("userEmail")).toBe("l@l.com");

    // ✅ Esto confirma el “happy path” sin depender de navegación
    expect(global.alert).toHaveBeenCalledWith("Bienvenido Lilly G");
  });

  test("login fail: muestra alert de error (porque no hay #error-message)", async () => {
    window.api.login.mockResolvedValueOnce({
      success: false,
      message: "Credenciales incorrectas"
    });

    require("../../../logic/logIn.js");
    window.dispatchEvent(new Event("DOMContentLoaded"));

    document.getElementById("email").value = "bad@bad.com";
    document.getElementById("password").value = "bad";

    document.getElementById("login_form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await flushPromises();

    expect(window.api.login).toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith("Correo o contraseña incorrectos.");
  });
});
