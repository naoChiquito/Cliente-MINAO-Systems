// JSDOM: window/document/localStorage ya existen
global.fetch = jest.fn();

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});

// Mock base de window.api para pantallas (se puede sobrescribir por test)
Object.defineProperty(window, "api", {
  value: {},
  writable: true
});
