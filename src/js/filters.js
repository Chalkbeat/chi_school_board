/*

export an array of filter functions for markers and districts
Each should expect the data row or feature and the option state object

*/

export var markerFilters = [
  function showAny(data, state) {
    return state.schoolTheme;
  },
  function gradeLevel(data, state) {
    return state[data.category];
  },
  function districtMatch(data, state) {
    if (!state.district) return true;
    return data.home_district == state.district;
  }
];

export var districtFilters = [
  function districtRevision(feature, state) {
    return (state.districtLayer == 20) == ("sub" in feature.properties);
  },
  function singleDistrict(feature, state) {
    if (!state.district) return true;
    return state.district == feature.properties.district;
  }
];

const COMMON_STYLES = {
  color: "#888",
  fillColor: "#888",
  fillOpacity: .4,
  weight: 1
};

export var districtThemes = {
  transparent() {
    return {
      ...COMMON_STYLES,
      weight: 0
    };
  },
  allGray() {
    return {
      ...COMMON_STYLES,
      color: "black"
    }
  },
  districtMajority(props, state) {
    if (!state.demographics) {
      return districtThemes.transparent();
    }
    var palette = {
      black: "var(--peach)",
      hispanic: "var(--teal)",
      white: "var(--purple)"
    }
    var { district, sub } = props;
    var { majority } = state.demographics[sub || district];
    var fillColor = palette[majority] || "#888"
    return {
      ...COMMON_STYLES,
      fillColor,
      fillOpacity: .8,
      color: "white",
    }
  },
  highlighter() {
    return {
      ...COMMON_STYLES,
      color: "var(--seatColor)",
      fillColor: "var(--seatColor)"
    }
  }
}