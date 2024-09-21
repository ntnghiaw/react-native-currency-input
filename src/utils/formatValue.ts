import { IntlConfig } from '@/src/components/CurrencyInputProps'
import { escapeRegExp } from '@/src/utils/escapeRegExp'
import { getSuffix } from '@/src/utils/getSuffix'

export type FormatValueOptions = {
  /**
   * Value to format
   */
  value: string | undefined

  /**
   * Decimal separator
   *
   * Default = '.'
   */
  decimalSeparator?: string

  /**
   * Group separator
   *
   * Default = ','
   */
  groupSeparator?: string

  /**
   * Turn off separators
   *
   * This will override Group separators
   *
   * Default = false
   */
  disableGroupSeparators?: boolean

  /**
   * Intl locale currency config
   */
  intlConfig?: IntlConfig

  /**
   * Specify decimal scale for padding/trimming
   *
   * Eg. 1.5 -> 1.50 or 1.234 -> 1.23
   */
  decimalScale?: number

  /**
   * Prefix
   */
  prefix?: string

  /**
   * Suffix
   */
  suffix?: string
}

/**
 * Format value with decimal separator, group separator and prefix
 */
export const formatValue = (options: FormatValueOptions): string => {
  const {
    value: _value,
    decimalSeparator,
    intlConfig,
    decimalScale,
    prefix = '',
    suffix = '',
  } = options
  console.log('🚀 ~ formatValue ~ options:', options)
  if (_value === '' || _value === undefined) {
    return ''
  }

  if (_value === '-') {
    return '-'
  }

  const isNegative = new RegExp(`^\\d?-${prefix ? `${escapeRegExp(prefix)}?` : ''}\\d`).test(_value)

  let value =
    decimalSeparator !== '.'
      ? replaceDecimalSeparator(_value, decimalSeparator, isNegative)
      : _value

  if (decimalSeparator && decimalSeparator !== '-' && value.startsWith(decimalSeparator)) {
    value = '0' + value
  }

  const defaultNumberFormatOptions = {
    minimumFractionDigits: decimalScale || 0,
    maximumFractionDigits: 10,
  }

  const numberFormatter = intlConfig
    ? new Intl.NumberFormat(
        intlConfig.locale,
        intlConfig.currency
          ? {
              ...defaultNumberFormatOptions,
              style: 'currency',
              currency: intlConfig.currency,
            }
          : defaultNumberFormatOptions
      )
    : new Intl.NumberFormat(undefined, defaultNumberFormatOptions)
  const parts = numberFormatter.formatToParts(Number(value))
  let formatted = replaceParts(parts, options)
  // Does intl formatting add a suffix?
  const intlSuffix = getSuffix(formatted, { ...options })

  // Include decimal separator if user input ends with decimal separator
  const includeDecimalSeparator = _value.slice(-1) === decimalSeparator ? decimalSeparator : ''

  const [, decimals] = value.match(RegExp('\\d+\\.(\\d+)')) || []

  // Keep original decimal padding if no decimalScale
  if (decimalScale === undefined && decimals && decimalSeparator) {
    if (formatted.includes(decimalSeparator)) {
      formatted = formatted.replace(
        RegExp(`(\\d+)(${escapeRegExp(decimalSeparator)})(\\d+)`, 'g'),
        `$1$2${decimals}`
      )
    } else {
      if (intlSuffix && !suffix) {
        formatted = formatted.replace(intlSuffix, `${decimalSeparator}${decimals}${intlSuffix}`)
      } else {
        formatted = `${formatted}${decimalSeparator}${decimals}`
      }
    }
  }
  if (suffix && includeDecimalSeparator) {
    console.log('🚀 ~ formatValue ~ suffix1:', suffix)

    return `${formatted}${includeDecimalSeparator}${suffix}`
  }

  if (intlSuffix && includeDecimalSeparator) {
    console.log('🚀 ~ formatValue ~ suffix2:', intlSuffix)

    return formatted.replace(intlSuffix, `${includeDecimalSeparator}${intlSuffix}`)
  }

  if (intlSuffix && suffix) {
    console.log('🚀 ~ formatValue ~ suffix3:', suffix)

    return formatted.replace(intlSuffix, `${includeDecimalSeparator}${suffix}`)
  }
  return [formatted, includeDecimalSeparator, suffix].join('')
}

/**
 * Before converting to Number, decimal separator has to be .
 */
const replaceDecimalSeparator = (
  value: string,
  decimalSeparator: FormatValueOptions['decimalSeparator'],
  isNegative: boolean
): string => {
  let newValue = value
  if (decimalSeparator && decimalSeparator !== '.') {
    newValue = newValue.replace(RegExp(escapeRegExp(decimalSeparator), 'g'), '.')
    if (isNegative && decimalSeparator === '-') {
      newValue = `-${newValue.slice(1)}`
    }
  }
  return newValue
}

const replaceParts = (
  parts: Intl.NumberFormatPart[],
  {
    prefix,
    groupSeparator,
    decimalSeparator,
    decimalScale,
    disableGroupSeparators = false,
  }: Pick<
    FormatValueOptions,
    'prefix' | 'groupSeparator' | 'decimalSeparator' | 'decimalScale' | 'disableGroupSeparators'
  >
): string => {
  console.log(parts)
  return parts
    .reduce(
      (prev, { type, value }, i) => {
        console.log(i, value, type)
        if (i === 0 && prefix) {
          if (type === 'minusSign') {
            return [value, prefix]
          }

          if (type === 'currency') {
            return [...prev, prefix]
          }

          return [prefix, value]
        }

        if (type === 'currency') {
          return prefix ? prev : [...prev, value]
        }

        if (type === 'integer' && !RegExp(/(\d)+/, 'gi').test(value)) {
          if (groupSeparator && value === groupSeparator) {
            return !disableGroupSeparators ? [...prev, value] : prev
          }
          return !disableGroupSeparators
            ? [...prev, !!groupSeparator ? groupSeparator : value]
            : prev
        }

        if (type === 'decimal') {
          if (decimalScale !== undefined && decimalScale === 0) {
            return prev
          }
          if (decimalSeparator && value === decimalSeparator) {
            return [...prev, value]
          }
          return [...prev, !!decimalSeparator ? decimalSeparator : value]
        }

        if (type === 'fraction') {
          return [...prev, decimalScale !== undefined ? value.slice(0, decimalScale) : value]
        }

        return [...prev, value]
      },
      ['']
    )
    .join('')
}
