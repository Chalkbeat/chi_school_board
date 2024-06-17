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
  function subcategory(data, state) {
    if (state.type == "all") return true;
    return data.secondary == state.type;
  },
  function districtMatch(data, state) {
    if (!state.district) return true;
    return data.home_district == state.district;
  },
];

export var districtFilters = [
  function districtRevision(feature, state) {
    return (state.districtLayer == 20) == ("sub" in feature.properties);
  },
  function singleDistrict(feature, state) {
    if (!state.district) return true;
    if (typeof state.district == "string" && state.district.match(/\d+[ab]/)) {
      return state.district == feature.properties.sub;
    }
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
      black: "var(--demo-black)",
      hispanic: "var(--demo-hispanic)",
      white: "var(--demo-white)"
    }
    var { district, sub } = props;
    var { majority } = state.demographics[sub || district]?.population;
    var fillColor = palette[majority] || "#888"
    return {
      ...COMMON_STYLES,
      fillColor,
      fillOpacity: .8,
      color: "white",
    }
  },
  enrollmentMajority(props, state) {
    if (!state.demographics) {
      return districtThemes.transparent();
    }
    var palette = {
      black: "var(--demo-black)",
      hispanic: "var(--demo-hispanic)",
      white: "var(--demo-white)"
    }
    var { district, sub } = props;
    var { majority } = state.demographics[sub || district]?.enrollment;
    var fillColor = palette[majority] || "#888"
    return {
      ...COMMON_STYLES,
      fillColor,
      fillOpacity: .8,
      color: "white",
    };
  },
  subdistricts(props) {
    return {
      ...COMMON_STYLES,
      fillColor: props.sub && props.sub.match(/b/) ? "#F77575" : "#19AB76"
    };
  },
  stripe(props) {
    var colors = [
      "#19AB76",
      "#F79C75",
      "#828282",
      "#855279",
      "#F4C96C"
    ];
    return {
      ...COMMON_STYLES,
      fillColor: colors[props.district % colors.length]
    }
  },
  highlighter() {
    return {
      ...COMMON_STYLES,
      color: "var(--seat-color)",
      fillColor: "var(--seat-color)"
    }
  }
}