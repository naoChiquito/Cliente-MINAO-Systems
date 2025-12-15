describe("electron main", () => {
  beforeEach(() => {
    jest.resetModules();
    const { ipcMain, app } = require("electron");
    ipcMain.handle.mockClear();
    app.on.mockClear();
    app.whenReady.mockClear();
  });

  test("debe registrar al menos un ipcMain.handle al inicializar", async () => {
    // 1) Carga main.js (esto usualmente registra listeners y/o whenReady)
    require("../../app/main.js");

    const { ipcMain, app } = require("electron");

    // 2) Si usa whenReady().then(...), esperamos microtareas
    if (app.whenReady.mock.calls.length > 0) {
      // resuelve el Promise de whenReady y el .then
      await Promise.resolve();
      await Promise.resolve();
    }

    // 3) Si usa app.on("ready", cb), lo “disparamos”
    await app.__emit("ready");

    // 4) Volvemos a dar chance a microtareas por si registra handlers dentro del callback
    await Promise.resolve();

    expect(ipcMain.handle).toHaveBeenCalled();
  });
});
