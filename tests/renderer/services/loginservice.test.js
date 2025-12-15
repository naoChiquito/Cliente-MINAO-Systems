describe("loginservice", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test("login OK: devuelve data usable", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { token: "t", user: { id: 1 } } })
    });

    const { login } = require("../../../services/loginservice.js");
    const res = await login("a@a.com", "1234");

    expect(global.fetch).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.data.token).toBe("t");
  });

  test("login FAIL: devuelve success false con mensaje", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: "Invalid credentials" })
    });

    const { login } = require("../../../services/loginservice.js");
    const res = await login("a@a.com", "bad");

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/invalid/i);
  });
});
