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

describe("logic/Profile.js (Profile screen)", () => {
  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = `
      <span id="studentNameDisplay">[Nombre]</span>
      <div id="backButton">←</div>

      <form id="profileForm">
        <input id="userName" />
        <input id="paternalSurname" />
        <input id="maternalSurname" />
        <input id="email" />
        <input id="profileImageInput" type="file" />
        <img id="profileImagePreview" />
        <button type="submit">Guardar</button>
      </form>
    `;

    global.alert = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});

    window.nav = { goTo: jest.fn(), goBack: jest.fn() };

    window.api = {
      findUserByEmailJSON: jest.fn(),
      updateUserBasicProfile: jest.fn()
    };

    localStorage.clear();
  });

  test("si falta sesión => navega a login", async () => {
    runOnDOMContentLoaded("../../../logic/Profile.js");
    expect(window.nav.goTo).toHaveBeenCalledWith("login");
  });

  test("loadProfile: llena inputs, deshabilita email, setea sidebar y localStorage", async () => {
    localStorage.setItem("userId", "7");
    localStorage.setItem("userEmail", "test@mail.com");
    localStorage.setItem("token", "tok");

    window.api.findUserByEmailJSON.mockResolvedValueOnce({
      success: true,
      user: {
        userName: "Lilly",
        paternalSurname: "G",
        maternalSurname: "M",
        email: "test@mail.com",
        profileImageUrl: "data:image/png;base64,abc"
      }
    });

    runOnDOMContentLoaded("../../../logic/Profile.js");

    await flushPromises();

    expect(window.api.findUserByEmailJSON).toHaveBeenCalledWith("test@mail.com");

    expect(document.getElementById("userName").value).toBe("Lilly");
    expect(document.getElementById("paternalSurname").value).toBe("G");
    expect(document.getElementById("maternalSurname").value).toBe("M");

    const emailInput = document.getElementById("email");
    expect(emailInput.value).toBe("test@mail.com");
    expect(emailInput.disabled).toBe(true);

    expect(document.getElementById("studentNameDisplay").textContent).toBe("Lilly G");

    expect(localStorage.getItem("userName")).toBe("Lilly");
    expect(localStorage.getItem("userPaternalSurname")).toBe("G");
  });

  test("submit success: llama updateUserBasicProfile, alerta y recarga perfil", async () => {
    localStorage.setItem("userId", "7");
    localStorage.setItem("userEmail", "test@mail.com");
    localStorage.setItem("token", "tok");

    window.api.findUserByEmailJSON.mockResolvedValueOnce({
      success: true,
      user: { userName: "Lilly", paternalSurname: "G", maternalSurname: "", email: "test@mail.com" }
    });

    window.api.updateUserBasicProfile.mockResolvedValueOnce({ success: true });

    window.api.findUserByEmailJSON.mockResolvedValueOnce({
      success: true,
      user: { userName: "Lilly2", paternalSurname: "G2", maternalSurname: "", email: "test@mail.com" }
    });

    runOnDOMContentLoaded("../../../logic/Profile.js");

    await flushPromises();

    document.getElementById("userName").value = "Lilly2";
    document.getElementById("paternalSurname").value = "G2";
    document.getElementById("maternalSurname").value = "";

    document.getElementById("profileForm").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await flushPromises();
    await flushPromises();

    expect(window.api.updateUserBasicProfile).toHaveBeenCalledWith("7", {
      userName: "Lilly2",
      paternalSurname: "G2",
      maternalSurname: "",
      token: "tok"
    });

    expect(global.alert).toHaveBeenCalledWith("Perfil actualizado correctamente.");
    expect(window.api.findUserByEmailJSON).toHaveBeenCalledTimes(2);
  });

  test("submit fail: alerta error", async () => {
    localStorage.setItem("userId", "7");
    localStorage.setItem("userEmail", "test@mail.com");
    localStorage.setItem("token", "tok");

    window.api.findUserByEmailJSON.mockResolvedValueOnce({
      success: true,
      user: { userName: "Lilly", paternalSurname: "G", maternalSurname: "", email: "test@mail.com" }
    });

    window.api.updateUserBasicProfile.mockResolvedValueOnce({ success: false, message: "Fallo" });

    runOnDOMContentLoaded("../../../logic/Profile.js");

    await flushPromises();

    document.getElementById("profileForm").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await flushPromises();

    expect(global.alert).toHaveBeenCalledWith("Error al actualizar: Fallo");
  });

  test("backButton: llama nav.goBack si existe", async () => {
    localStorage.setItem("userId", "7");
    localStorage.setItem("userEmail", "test@mail.com");
    localStorage.setItem("token", "tok");

    window.api.findUserByEmailJSON.mockResolvedValueOnce({
      success: true,
      user: { userName: "Lilly", paternalSurname: "G", email: "test@mail.com" }
    });

    require("../../../logic/Profile.js");
    await flushPromises();

    document.getElementById("backButton").click();
    expect(window.nav.goBack).toHaveBeenCalled();
  });
});
