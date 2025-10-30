// @flow

function sum(nums: Array<number>): number {
    return nums.reduce((a, b) => a + b, 0);
}

const numbers: Array<number> = [1, 2, 3];
// Intentional error: pushing wrong element type
// $FlowExpectedError[incompatible-type-arg]
numbers.push('4');

console.log(sum(numbers));