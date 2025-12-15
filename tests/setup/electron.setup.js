process.env.NODE_ENV = "test";
jest.mock("electron", () => require("../mocks/electron"));
