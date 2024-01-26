/*

export an array of filter functions for markers and districts
Each should expect the data row or feature and the option state object

*/

export var markerFilters = [
  function gradeLevel(data, state) {
    return state[data.category];
  },
  function districtMatch(data, state) {
    if (!state.district) return true;
    return data.districts.has(state.district);
  }
];

export var districtFilters = [
  function singleDistrict(feature, state) {
    if (!state.district) return true;
    return state.district == feature.properties.name;
  }
]