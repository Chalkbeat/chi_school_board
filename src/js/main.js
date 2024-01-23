import "./statefulInputs.js"
import "./map.js";

/*
- SoT is the hash, but we don't look at that outside of the last section
- Three troll arrays for filtering/painting:
  - district filter
  - district paint
  - school filter
- state object accepts changes (maybe a proxy) and dispatches a debounced update event
- create custom elements that can automatically dispatch to the state based on their contents?
  - stateful-checkbox
  - stateful-radio
  - stateful-select
*/
