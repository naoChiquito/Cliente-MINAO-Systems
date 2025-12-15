const { findUserByEmailJSON, updateUserBasicProfile } = require("../../../services/userService");

describe("services/userService.js", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  test("findUserByEmailJSON: success retorna parsed JSON", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ success: true, user: { userName: "Lilly" } })
    });

    const res = await findUserByEmailJSON("a@a.com");
    expect(fetch).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.user.userName).toBe("Lilly");
  });

  test("findUserByEmailJSON: server devuelve NO JSON => retorna success:false", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => "NO_JSON"
    });

    const res = await findUserByEmailJSON("a@a.com");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/NO JSON/i);
  });

  test("findUserByEmailJSON: response not ok => retorna success:false con message", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => JSON.stringify({ message: "No encontrado" })
    });

    const res = await findUserByEmailJSON("a@a.com");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/No encontrado/i);
  });

  test("updateUserBasicProfile: success retorna data", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: "ok" })
    });

    const res = await updateUserBasicProfile("7", { userName: "X" });
    expect(res.success).toBe(true);
    expect(res.message).toBe("ok");
  });

  test("updateUserBasicProfile: not ok retorna success:false y message", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Error al actualizar" })
    });

    const res = await updateUserBasicProfile("7", { userName: "X" });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Error al actualizar/i);
  });
});
