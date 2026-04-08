/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],
  ignoreFiles: ['dist/**/*'],
  rules: {
    'at-rule-no-unknown': null,
    'selector-class-pattern': null,
    'selector-type-no-unknown': [
      true,
      {
        ignoreTypes: ['page', 'scroll-view']
      }
    ],
    'color-function-alias-notation': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'color-hex-length': null,
    'declaration-block-no-redundant-longhand-properties': null
  }
}
