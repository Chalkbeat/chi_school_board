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
    return data.districts.has(state.district * 1);
  }
];

export var districtFilters = [
  function singleDistrict(feature, state) {
    if (!state.district) return true;
    return state.district == feature.properties.district;
  }
];

export var districtThemes = {
  transparent() {
    return {
      color: "#999",
      fillColor: "#999",
      fillOpacity: .4,
      weight: 0
    };
  },
  allGray() {
    return {
      color: "black",
      fill: "#888",
      fillOpacity: .4,
      weight: 3
    }
  },
  districtMajority(props) {
    var palette = {
      black: "var(--peach)",
      hispanic: "var(--teal)",
      white: "var(--purple)"
    }
    var { district } = props;
    var { majority } = window.DEMOGRAPHICS[district];
    var fillColor = palette[majority] || "#888"
    return {
      fillColor,
      fillOpacity: .8,
      color: "white",
      weight: 1
    }
  },
  highlighter() {
    return {
      color: "var(--seatColor)",
      fillColor: "var(--seatColor)"
    }
  }
}