describe("services/quizService.js", () => {
  beforeEach(() => {
    jest.resetModules();

    global.fetch = jest.fn();

    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function makeFetchResponse({ ok = true, status = 200, body = "{}" } = {}) {
    return {
      ok,
      status,
      text: jest.fn(async () => body)
    };
  }

  test("normalizeQuizListResponse: soporta {success:true,data:[]}, array directo y {result:[]}", () => {
    const svc = require("../../../services/quizService.js");

    expect(
      svc.normalizeQuizListResponse({ success: true, data: [{ quizId: 1 }] })
    ).toEqual([{ quizId: 1 }]);

    expect(svc.normalizeQuizListResponse([{ quizId: 2 }])).toEqual([{ quizId: 2 }]);

    expect(svc.normalizeQuizListResponse({ result: [{ quizId: 3 }] })).toEqual([
      { quizId: 3 }
    ]);

    expect(svc.normalizeQuizListResponse({})).toEqual([]);
  });

  test("getQuizzesByCourse: devuelve success true + data/result/count cuando el endpoint responde JSON OK", async () => {
    const svc = require("../../../services/quizService.js");

    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ success: true, data: [{ quizId: 1 }, { quizId: 2 }] })
      })
    );

    const res = await svc.getQuizzesByCourse(99);

    expect(res.success).toBe(true);
    expect(res.count).toBe(2);
    expect(res.data).toEqual([{ quizId: 1 }, { quizId: 2 }]);
    expect(res.result).toEqual([{ quizId: 1 }, { quizId: 2 }]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/course\/99$/);
    expect(options).toEqual({ method: "GET" });
  });

  test("getQuizzesByCourse: si primer endpoint devuelve NO-JSON, intenta fallback al segundo", async () => {
    const svc = require("../../../services/quizService.js");

    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        ok: true,
        status: 200,
        body: "<html>no json</html>"
      })
    );

    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ result: [{ quizId: 7 }] })
      })
    );

    const res = await svc.getQuizzesByCourse(5);

    expect(res.success).toBe(true);
    expect(res.count).toBe(1);
    expect(res.data).toEqual([{ quizId: 7 }]);
    expect(res.result).toEqual([{ quizId: 7 }]);

    expect(global.fetch).toHaveBeenCalledTimes(2);

    const [url1] = global.fetch.mock.calls[0];
    const [url2] = global.fetch.mock.calls[1];

    expect(url1).toMatch(/localhost:5050\/minao_systems\/quizzes\/course\/5$/);
    expect(url2).toMatch(/localhost:3309\/minao_systems\/quizzes\/course\/5$/);
  });

  test("getQuizzesByCourse: si todos los endpoints fallan, devuelve success false y listas vacías", async () => {
    const svc = require("../../../services/quizService.js");

    global.fetch
      .mockRejectedValueOnce(new Error("ECONNREFUSED 5050"))
      .mockRejectedValueOnce(new Error("ECONNREFUSED 3309"))
      .mockRejectedValueOnce(new Error("ECONNREFUSED 5050 again"));

    const res = await svc.getQuizzesByCourse(1);

    expect(res.success).toBe(false);
    expect(res.data).toEqual([]);
    expect(res.result).toEqual([]);
    expect(res.count).toBe(0);
    expect(res.message).toMatch(/No se pudo obtener JSON|ECONNREFUSED/i);

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  test("getQuizDetailForUser: agrega Authorization si hay token y retorna parsed del servidor", async () => {
    const svc = require("../../../services/quizService.js");

    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({
          success: true,
          result: { quizId: 10, title: "Quiz X", questions: [] }
        })
      })
    );

    const out = await svc.getQuizDetailForUser("10", "tok123");

    expect(out).toEqual({
      success: true,
      result: { quizId: 10, title: "Quiz X", questions: [] }
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];

    expect(url).toMatch(/\/10\/view$/);
    expect(options.method).toBe("GET");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers.Authorization).toBe("Bearer tok123");
  });

  test("answerQuiz: manda POST /answerQuiz con body esperado + Authorization", async () => {
    const svc = require("../../../services/quizService.js");

    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ success: true, message: "ok" })
      })
    );

    const answers = [
      { questionId: 101, optionId: 1 },
      { questionId: 102, optionId: 3 }
    ];

    const res = await svc.answerQuiz("7", "10", answers, "tok");

    expect(res.success).toBe(true);
    expect(res.data).toEqual({ success: true, message: "ok" });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];

    expect(url).toMatch(/\/answerQuiz$/);
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers.Authorization).toBe("Bearer tok");

    const parsedBody = JSON.parse(options.body);
    expect(parsedBody).toEqual({
      studentUserId: "7",
      quizId: "10",
      answers
    });
  });

  test("getStudentsAttempts: valida params (quizId y studentUserId)", async () => {
    const svc = require("../../../services/quizService.js");

    const r1 = await svc.getStudentsAttempts("", "7", "tok");
    expect(r1.success).toBe(false);
    expect(r1.message).toMatch(/quizId is required/i);

    const r2 = await svc.getStudentsAttempts("10", "", "tok");
    expect(r2.success).toBe(false);
    expect(r2.message).toMatch(/studentUserId is required/i);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("getStudentsAttempts: pega al endpoint correcto y retorna parsed", async () => {
    const svc = require("../../../services/quizService.js");

    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({
          success: true,
          attempts: [
            { attemptNumber: 1, questionId: 101, optionId: 1, isCorrect: 1 }
          ]
        })
      })
    );

    const out = await svc.getStudentsAttempts("10", "7", "tok");

    expect(out).toEqual({
      success: true,
      attempts: [{ attemptNumber: 1, questionId: 101, optionId: 1, isCorrect: 1 }]
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];

    expect(url).toMatch(/\/10\/students\/7\/attempts$/);
    expect(options.method).toBe("GET");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers.Authorization).toBe("Bearer tok");
  });

  test("viewQuizResult: si falta attemptNumber => success false", async () => {
    const svc = require("../../../services/quizService.js");

    const out = await svc.viewQuizResult("10", "7", null, "tok");

    expect(out.success).toBe(false);
    expect(out.message).toMatch(/attemptNumber is required/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("safeParseResponse: parsea JSON y respeta errores HTTP", async () => {
    const svc = require("../../../services/quizService.js");

    const okResp = makeFetchResponse({
      ok: true,
      status: 200,
      body: JSON.stringify({ hello: "world" })
    });

    await expect(svc.safeParseResponse(okResp)).resolves.toEqual({ hello: "world" });

    const badResp = makeFetchResponse({
      ok: false,
      status: 401,
      body: JSON.stringify({ message: "No autorizado" })
    });

    await expect(svc.safeParseResponse(badResp)).rejects.toThrow(/No autorizado/i);
  });

    test("listQuizResponses: agrega Authorization si hay token y retorna parsed", async () => {
    const svc = require("../../../services/quizService.js");

    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ success: true, responses: [{ a: 1 }] })
      })
    );

    const out = await svc.listQuizResponses("10", "tokXYZ");

    expect(out).toEqual({ success: true, responses: [{ a: 1 }] });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];

    expect(url).toMatch(/\/10\/responses$/);
    expect(options.method).toBe("GET");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers.Authorization).toBe("Bearer tokXYZ");
  });

  test("listQuizResponses: si el servidor responde HTTP error con JSON message => devuelve success false con ese message", async () => {
    const svc = require("../../../services/quizService.js");

    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        ok: false,
        status: 403,
        body: JSON.stringify({ message: "Forbidden" })
      })
    );

    const out = await svc.listQuizResponses("10", "tok");

    expect(out.success).toBe(false);
    expect(out.message).toMatch(/Forbidden/i);
  });

  test("getQuizDetailForUser: si el servidor responde HTTP error con JSON message => {success:false,message}", async () => {
    const svc = require("../../../services/quizService.js");

    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        ok: false,
        status: 401,
        body: JSON.stringify({ message: "Token inválido" })
      })
    );

    const out = await svc.getQuizDetailForUser("10", "tok");

    expect(out).toEqual({ success: false, message: "Token inválido" });
  });

  test("answerQuiz: si primer endpoint devuelve NO-JSON, intenta fallback y funciona", async () => {
    const svc = require("../../../services/quizService.js");

    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        ok: true,
        status: 200,
        body: "OK NO JSON"
      })
    );

    // 2) JSON OK
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ success: true, message: "ok" })
      })
    );

    const res = await svc.answerQuiz(
      "7",
      "10",
      [{ questionId: 1, optionId: 2 }],
      "tok"
    );

    expect(res.success).toBe(true);
    expect(res.data).toEqual({ success: true, message: "ok" });

    expect(global.fetch).toHaveBeenCalledTimes(2);

    const [url1] = global.fetch.mock.calls[0];
    const [url2] = global.fetch.mock.calls[1];

    expect(url1).toMatch(/localhost:5050\/minao_systems\/quizzes\/answerQuiz$/);
    expect(url2).toMatch(/localhost:3309\/minao_systems\/quizzes\/answerQuiz$/);
  });

});
