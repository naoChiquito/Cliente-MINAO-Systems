describe("courseService", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.useRealTimers();
  });

  describe("getCoursesByInstructorJSON", () => {
    test("OK: parsea JSON y devuelve success true con data[]", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: [{ id: 1 }, { id: 2 }] })
      });

      const { getCoursesByInstructorJSON } = require("../../../services/courseService.js");
      const res = await getCoursesByInstructorJSON(10);

      expect(res).toEqual({ success: true, data: [{ id: 1 }, { id: 2 }] });
    });

    test("OK: respuesta no JSON => devuelve success true con data vacío", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "OK"
      });

      const { getCoursesByInstructorJSON } = require("../../../services/courseService.js");
      const res = await getCoursesByInstructorJSON(10);

      expect(res).toEqual({ success: true, data: [] });
    });

    test("FAIL: lanza error con message del backend si viene en JSON", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ message: "Boom" })
      });

      const { getCoursesByInstructorJSON } = require("../../../services/courseService.js");

      await expect(getCoursesByInstructorJSON(10))
        .rejects
        .toThrow(/Boom/i);
    });
  });

  describe("getCoursesByInstructor", () => {
    test("OK: si viene result[] lo regresa tal cual", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ count: 1, result: [{ cursoId: 2 }] })
      });

      const { getCoursesByInstructor } = require("../../../services/courseService.js");
      const res = await getCoursesByInstructor(99);

      expect(res.count).toBe(1);
      expect(Array.isArray(res.result)).toBe(true);
      expect(res.result[0].cursoId).toBe(2);
    });

    test("OK: si no viene result[] => fallback count 0 result []", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ hello: "world" })
      });

      const { getCoursesByInstructor } = require("../../../services/courseService.js");
      const res = await getCoursesByInstructor(99);

      expect(res).toEqual({ count: 0, result: [] });
    });

    test("FAIL: si backend responde JSON con message => lanza ese message", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ message: "Not found" })
      });

      const { getCoursesByInstructor } = require("../../../services/courseService.js");

      await expect(getCoursesByInstructor(99))
        .rejects
        .toThrow(/Not found/i);
    });
  });

  describe("getCourseDetails", () => {
    test("OK: devuelve JSON parseado", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: { cursoId: 1, name: "X" } })
      });

      const { getCourseDetails } = require("../../../services/courseService.js");
      const res = await getCourseDetails(1);

      expect(res.result.name).toBe("X");
    });

    test("FAIL: lanza error con message del backend", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Nope" })
      });

      const { getCourseDetails } = require("../../../services/courseService.js");

      await expect(getCourseDetails(1))
        .rejects
        .toThrow(/Nope/i);
    });
  });
});
