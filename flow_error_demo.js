// @flow

function addNumbers(a: number, b: number): number {
  return a + b;
}

// This will cause a Flow error
const result = addNumbers("hello", 5);
