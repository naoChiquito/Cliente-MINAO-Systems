// tests/mocks/electron.js
// Mock estable para Electron (main/preload) + helpers para tests

const handlers = new Map();   // IPC handlers: ipcMain.handle(channel, fn)
const appEvents = new Map();  // App events: app.on(event, fn)

const ipcMain = {
  handle: jest.fn((channel, fn) => {
    handlers.set(channel, fn);
  }),
  on: jest.fn(),
  // Helper de tests: simula ipcMain.handle(...) invocándolo manualmente
  __invoke: async (channel, ...args) => {
    const fn = handlers.get(channel);
    if (!fn) throw new Error(`No handler registered: ${channel}`);
    // En Electron real el primer argumento suele ser "event"
    return fn({}, ...args);
  }
};

const ipcRenderer = {
  invoke: jest.fn(),
  send: jest.fn(),
  on: jest.fn()
};

const contextBridge = {
  exposeInMainWorld: jest.fn()
};

const BrowserWindow = jest.fn().mockImplementation(() => ({
  loadFile: jest.fn(),
  loadURL: jest.fn(),
  webContents: {
    send: jest.fn(),
    openDevTools: jest.fn()
  },
  on: jest.fn(),
  once: jest.fn(),
  show: jest.fn(),
  close: jest.fn(),
  destroy: jest.fn()
}));

const app = {
  on: jest.fn((evt, cb) => {
    appEvents.set(evt, cb);
  }),
  whenReady: jest.fn(() => Promise.resolve()),
  quit: jest.fn(),
  getAppPath: jest.fn(() => process.cwd()),
  // Helper de tests: dispara eventos registrados con app.on(...)
  __emit: async (evt, ...args) => {
    const cb = appEvents.get(evt);
    if (typeof cb === "function") return cb(...args);
  }
};

const dialog = {
  showErrorBox: jest.fn(),
  showOpenDialog: jest.fn(async () => ({ canceled: true, filePaths: [] }))
};

const shell = {
  openExternal: jest.fn()
};

module.exports = {
  ipcMain,
  ipcRenderer,
  contextBridge,
  BrowserWindow,
  app,
  dialog,
  shell
};
