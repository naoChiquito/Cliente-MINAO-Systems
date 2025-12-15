describe("verifyEmailService", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test("verify OK", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: "Verified" })
    });

    const { verifyEmail } = require("../../../services/verifyEmailService.js");
    const res = await verifyEmail("a@a.com", "123456");

    expect(global.fetch).toHaveBeenCalled();
    expect(res.success).toBe(true);
  });

  test("verify FAIL", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: "Wrong code" })
    });

    const { verifyEmail } = require("../../../services/verifyEmailService.js");
    const res = await verifyEmail("a@a.com", "000000");

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/wrong|code|incorrect/i);
  });
});
