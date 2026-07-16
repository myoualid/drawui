export default {
  rules: {
    "block-no-empty": true,
    "color-no-invalid-hex": true,
    "declaration-block-no-duplicate-properties": true,
    "font-family-no-duplicate-names": true,
    "no-invalid-double-slash-comments": true,
    "property-no-unknown": true,
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["global"]
      }
    ],
    "unit-no-unknown": true
  }
};
