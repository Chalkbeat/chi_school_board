/*

export an array of filter functions for markers
Each should expect the data row and the option state object

*/

export default [
  function(data, state) {
    return state.grades.has(data.category)
  }
];