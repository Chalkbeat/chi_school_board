/*

export an array of filter functions for markers
Each should expect the data row and the option state object

*/

export default [
  function gradeLevel(data, state) {
    return state[data.category];
  },
  function districtMatch(data, state) {
    if (!state.district) return true;
    return data.districts.has(state.district);
  }
];