import { StyleProp, TextInputProps, TextStyle } from 'react-native'

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

/**
 * Value in different formats
 *
 * @experimental
 */
export type CurrencyInputOnChangeValues = {
  /**
   * Value as float or null if empty
   *
   * Example:
   *   "1.99" > 1.99
   *   "" > null
   */
  float: number | null

  /**
   * Value after applying formatting
   *
   * Example: "1000000" > "1,000,0000"
   */
  formatted: string

  /**
   * Non formatted value as string
   */
  value: string
}

export type IntlConfig = {
  locale: string
  currency?: string
}

export type CurrencyInputProps = Overwrite<
  TextInputProps,
  {
    /**
     * Allow decimals
     *
     * Default = true
     */
    allowDecimals?: boolean

    /**
     * Allow user to enter negative value
     *
     * Default = true
     */
    allowNegativeValue?: boolean


    /**
     *  Maximum characters the user can enter
     */
    maxLength?: number

    /**
     *  Min value of the input
     */
    min?: number

    /**
     *  Max value of the input
     */
    max?: number

    /**
     * styles
     */
    style?: StyleProp<TextStyle> | undefined

    /**
     * Limit length of decimals allowed
     *
     * Default = 2
     */
    decimalsLimit?: number

    /**
     * Specify decimal scale for padding/trimming
     *
     * Example:
     *   1.5 -> 1.50
     *   1.234 -> 1.23
     */
    decimalScale?: number

    /**
     * Default value if not passing in value via props
     */
    defaultValue?: number | string

    /**
     * Disabled
     *
     * Default = false
     */
    disabled?: boolean

    /**
     * Value will always have the specified length of decimals
     *
     * Example:
     *   123 -> 1.23
     *
     * Note: This formatting only happens onBlur
     */
    fixedDecimalLength?: number

    /**
     * Handle change in value
     */
    onValueChange?: (text: string | undefined, values?: CurrencyInputOnChangeValues) => void

    /**
     * Placeholder if there is no value
     */
    placeholder?: string

    /**
     * Include a prefix eg. £
     */
    prefix?: string

    /**
     * Include a suffix eg. €
     */
    suffix?: string


    /**
     * Separator between integer part and fractional part of value.
     *
     * This cannot be a number
     */
    decimalSeparator?: string

    /**
     * Separator between thousand, million and billion
     *
     * This cannot be a number
     */
    groupSeparator?: string

    /**
     * Disable auto adding separator between values eg. 1000 -> 1,000
     *
     * Default = false
     */
    disableGroupSeparators?: boolean

    /**
     * Disable abbreviations (m, k, b)
     *
     * Default = false
     */
    disableAbbreviations?: boolean

    /**
     * International locale config, examples:
     *   { locale: 'ja-JP', currency: 'JPY' }
     *   { locale: 'en-IN', currency: 'INR' }
     *
     * Any prefix, groupSeparator or decimalSeparator options passed in
     * will override Intl Locale config
     */
    intlConfig?: IntlConfig

    /**
     * Transform the raw value form the input before parsing
     */
    transformRawValue?: (rawValue: string) => string

    /**
     * When set to false, the formatValueOnBlur flag disables the application of the __onValueChange__ function
     * specifically on blur events. If disabled or set to false, the onValueChange will not trigger on blur.
     * Default = true
     */
    formatValueOnBlur?: boolean
  }
>
