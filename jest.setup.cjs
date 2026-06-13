require('@testing-library/jest-dom')
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  document.title = 'Docu Create'
  document.head.querySelectorAll('meta[name="description"], meta[name="robots"]').forEach((el) => el.remove())
  document.head.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove())
})
