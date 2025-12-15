function makeApiMock(overrides = {}) {
  return {
    // Ejemplos típicos (ajústalos a tus canales reales)
    login: jest.fn(),
    signUp: jest.fn(),
    verifyEmail: jest.fn(),

    getCourseDetails: jest.fn(),
    getCourseContent: jest.fn(),
    getCourseQuizzes: jest.fn(),

    ...overrides
  };
}

module.exports = { makeApiMock };
