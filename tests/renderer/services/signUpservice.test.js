describe("signUpservice", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test("signup OK", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: "Created" })
    });

    const { signUp } = require("../../../services/signUpservice.js");
    const res = await signUp({ email: "a@a.com", password: "1234" });

    expect(global.fetch).toHaveBeenCalled();
    expect(res.success).toBe(true);
  });

    test("signup FAIL: lanza error con message del backend", async () => {
    global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: "Email exists" })
    });

    const { signUp } = require("../../../services/signUpservice.js");

    await expect(signUp({ email: "a@a.com", password: "1234" }))
        .rejects
        .toThrow(/Email exists/i);
    });

});
