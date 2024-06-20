import { state } from "./map.js";

function getPosition() {
  return new Promise((ok, fail) => {
    if (!("geolocation" in navigator)) {
      return fail("Unable to get location from GPS.");
    }
    navigator.geolocation.getCurrentPosition(ok, fail);
  });
}

class GeolocateMe extends HTMLElement {
  constructor() {
    super();
    var root = this.attachShadow({ mode: "open" });
    var button = document.createElement("button");
    root.innerHTML = `
<style>
button {
  background: white;
  border: none;
  border-radius: 4px;
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px 16px;
  font-family: inherit;
  text-transform: uppercase;
}
</style>
    `
    root.append(button);
    button.innerHTML = `
<svg width="16" height="16">
  <circle cx=8 cy=8 r=4 fill="currentColor" />
  <path d="M2,8 L14,8 M8,2 L8,14" transform-origin="center" transform="rotate(23)" stroke="currentColor" fill="none" />
</svg>
Find my district
    `;
    button.addEventListener("click", this.onClick.bind(this));
    this.output = document.createElement("div");
    root.append(this.output);
  }

  async onClick() {
    try {
      this.output.innerHTML = `Locating...`;
      var { coords } = await getPosition();
      var { wolf } = state.raw;
      if (!wolf) throw "District data is not yet available";
      var result = wolf.find([coords.longitude, coords.latitude]);
      if (!result[2024]) throw "Your current location doesn't match a district.";
      this.output.innerHTML = `
You're currently located in <b>District ${result[2024].district}</b>.
In 2026, you'll be in <b>District ${result[2026].sub}</b>.
      `;
      state.data.district = result[2024].district;
    } catch (err) {
      this.output.innerHTML = err;
    }
  }
}

window.customElements.define("geolocate-me", GeolocateMe);