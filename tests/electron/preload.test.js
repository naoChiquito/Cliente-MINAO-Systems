describe("preload", () => {
  beforeEach(() => {
    jest.resetModules(); // importante: para que preload se ejecute “de nuevo”
    const { contextBridge } = require("electron");
    contextBridge.exposeInMainWorld.mockClear();
  });

  test("debe exponer al menos un objeto en window (via contextBridge)", () => {
    // Ejecuta el preload (normalmente solo corre al requerirlo)
    require("../../app/preload.js");

    const { contextBridge } = require("electron");
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalled();

    // Validación genérica para no depender de nombres exactos
    const calls = contextBridge.exposeInMainWorld.mock.calls;
    // Cada llamada es [nombre, objeto]
    for (const [name, api] of calls) {
      expect(typeof name).toBe("string");
      expect(api).toBeTruthy();
      expect(typeof api).toBe("object");
    }
  });
});
