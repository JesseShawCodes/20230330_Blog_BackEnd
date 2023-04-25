// const sum = require('./functions');
import sum from './functions'

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});