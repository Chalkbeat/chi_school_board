/*

export an array of filter functions that can be run on districts
each should expect to get a feature, a property object, and the state data

*/

export default [
  function(feature, state) {
    if (!state.district) return true;
    return state.district == feature.properties.name;
  }
]