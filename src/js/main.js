import "./state-bindings.js"
import { mergeChanges } from "./map.js";

/*

TODO:
- Start the ArchieML doc
- Some properties are going to need filters when the scroll entry runs state assignment
- Decide on data to merge in
- Add a map state mutation method

*/

document.querySelector(".demo-button").addEventListener("click", () => mergeChanges({ district: "District F" }))