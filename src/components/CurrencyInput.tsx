import React, {
  FC,
  useState,
  useEffect,
  useRef,
  forwardRef,
  useMemo,
  useImperativeHandle,
} from 'react'
import { CurrencyInputProps, CurrencyInputOnChangeValues } from '@/src/components/CurrencyInputProps'
import {
  isNumber,
  cleanValue,
  fixedDecimalValue,
  formatValue,
  getLocaleConfig,
  padTrimValue,
  CleanValueOptions,
  getSuffix,
  FormatValueOptions,
  repositionCursor,
} from '@/src/utils'
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputChangeEventData,
  TextInputEndEditingEventData,
  TextInputFocusEventData,
  TextInputProps,
  TextInputSelectionChangeEventData,
} from 'react-native'

export const CurrencyInput: FC<CurrencyInputProps> = forwardRef<TextInput, CurrencyInputProps>(
  (
    {
      allowDecimals = true,
      allowNegativeValue = true,
      decimalsLimit,
      defaultValue,
      disabled = false,
      maxLength: userMaxLength,
      value: userValue,
      onValueChange,
      onSelectionChange,
      fixedDecimalLength,
      placeholder,
      decimalScale,
      prefix,
      suffix,
      intlConfig,
      min,
      max,
      disableGroupSeparators = false,
      disableAbbreviations = false,
      decimalSeparator: _decimalSeparator,
      groupSeparator: _groupSeparator,
      onChangeText,
      onFocus,
      onBlur,
      onEndEditing,
      transformRawValue,
      formatValueOnBlur = true,
      ...props
    }: CurrencyInputProps,
    ref
  ) => {
    if (_decimalSeparator && isNumber(_decimalSeparator)) {
      throw new Error('decimalSeparator cannot be a number')
    }

    if (_groupSeparator && isNumber(_groupSeparator)) {
      throw new Error('groupSeparator cannot be a number')
    }

    const localeConfig = useMemo(() => getLocaleConfig(intlConfig), [intlConfig])
    const decimalSeparator = _decimalSeparator || localeConfig.decimalSeparator || ''
    const groupSeparator = _groupSeparator || localeConfig.groupSeparator || ''
    if (
      decimalSeparator &&
      groupSeparator &&
      decimalSeparator === groupSeparator &&
      disableGroupSeparators === false
    ) {
      throw new Error('decimalSeparator cannot be the same as groupSeparator')
    }

    const formatValueOptions: Partial<FormatValueOptions> = {
      decimalSeparator,
      groupSeparator,
      disableGroupSeparators,
      intlConfig,
      prefix: prefix || localeConfig.prefix,
      suffix: suffix,
    }

    const cleanValueOptions: Partial<CleanValueOptions> = {
      decimalSeparator,
      groupSeparator,
      allowDecimals,
      decimalsLimit: decimalsLimit || fixedDecimalLength || 2,
      allowNegativeValue,
      disableAbbreviations,
      prefix: prefix || localeConfig.prefix,
      transformRawValue,
    }

    const [stateValue, setStateValue] = useState(() =>
      defaultValue != null
        ? formatValue({ ...formatValueOptions, decimalScale, value: String(defaultValue) })
        : userValue != null
        ? formatValue({ ...formatValueOptions, decimalScale, value: String(userValue) })
        : ''
    )

    const [dirty, setDirty] = useState(false)
    const [cursor, setCursor] = useState(0)
    const [changeCount, setChangeCount] = useState(0)
    const [lastKeyStroke, setLastKeyStroke] = useState<string | null>(null)
    const [selectIndex, setSelectIndex] = useState<{ start: number; end: number }>({
      start: 0,
      end: 0,
    })
    const inputRef = useRef<TextInput>(null)
    useImperativeHandle(ref, () => inputRef.current as TextInput)

    /**
     * Process change in value
     */
    const processChange = (value: string, selectionStart?: number | null): void => {
      setDirty(true)

      const { modifiedValue, cursorPosition } = repositionCursor({
        selectionStart,
        value,
        lastKeyStroke,
        stateValue,
        groupSeparator,
      })

      const stringValue = cleanValue({ value: modifiedValue, ...cleanValueOptions })
      if (userMaxLength && stringValue.replace(/-/g, '').length > userMaxLength) {
        return
      }

      if (stringValue === '' || stringValue === '-' || stringValue === decimalSeparator) {
        onValueChange && onValueChange(undefined, { float: null, formatted: '', value: '' })
        setStateValue(stringValue)
        // Always sets cursor after '-' or decimalSeparator input
        setSelectIndex({
          start: 1,
          end: 1,
        })
        return
      }

      const stringValueWithoutSeparator = decimalSeparator
        ? stringValue.replace(decimalSeparator, '.')
        : stringValue

      const numberValue = parseFloat(stringValueWithoutSeparator)
      const formattedValue = formatValue({
        value: stringValue,
        ...formatValueOptions,
      })

      if (cursorPosition != null) {
        // Prevent cursor jumping
        let newCursor
        if (cursorPosition === 0 || cursorPosition === 1) {
          newCursor =
            cursorPosition + (formatValueOptions.prefix ? formatValueOptions.prefix.length + 1 : 0)
        } else {
          newCursor = cursorPosition + (formattedValue.length - value.length)
        }

        newCursor =
          newCursor <= 0
            ? formatValueOptions.prefix
              ? formatValueOptions.prefix.length
              : 0
            : newCursor
        setSelectIndex({
          start: newCursor,
          end: newCursor,
        })
        setChangeCount(changeCount + 1)
      }

      setStateValue(formattedValue)

      if (onValueChange) {
        const values: CurrencyInputOnChangeValues = {
          float: numberValue,
          formatted: formattedValue,
          value: stringValue,
        }
        onValueChange(stringValue, values)
      }
    }

    /**
     * Handle change event
     */
    const handleOnChange = (text: string): void => {
      processChange(text, selectIndex?.start)
      onChangeText && onChangeText(text)
    }

    /**
     * Handle focus event
     */
    const handleOnFocus = (event: NativeSyntheticEvent<TextInputFocusEventData>): number => {
      onFocus && onFocus(event)
      return stateValue ? stateValue.length : 0
    }

    /**
     * Handle selection change event
     */

    const handleOnSelectionChange = (
      event: NativeSyntheticEvent<TextInputSelectionChangeEventData>
    ): void => {
      setSelectIndex(event.nativeEvent.selection)
    }

    /**
     * Handle blur event -> onEndEditing
     *
     * Format value by padding/trimming decimals if required by
     */
    const handleOnEndEditing = (
      event: NativeSyntheticEvent<TextInputEndEditingEventData>
    ): void => {
      const {
        nativeEvent: { text: value },
      } = event

      const valueOnly = cleanValue({ value, ...cleanValueOptions })

      if (valueOnly === '-' || valueOnly === decimalSeparator || !valueOnly) {
        setStateValue('')
        onEndEditing && onEndEditing(event)
        return
      }

      const fixedDecimals = fixedDecimalValue(valueOnly, decimalSeparator, fixedDecimalLength)

      const newValue = padTrimValue(
        fixedDecimals,
        decimalSeparator,
        decimalScale !== undefined ? decimalScale : fixedDecimalLength
      )

      const numberValue = parseFloat(newValue.replace(decimalSeparator, '.'))

      const formattedValue = formatValue({
        ...formatValueOptions,
        value: newValue,
      })

      if (onValueChange && formatValueOnBlur) {
        onValueChange(newValue, {
          float: numberValue,
          formatted: formattedValue,
          value: newValue,
        })
      }

      setStateValue(formattedValue)

      onEndEditing && onEndEditing(event)
    }

    // Update state if userValue changes to undefined
    useEffect(() => {
      if (userValue == null && defaultValue == null) {
        setStateValue('')
      }
    }, [defaultValue, userValue])

    useEffect(() => {
      // prevent cursor jumping if editing value
      if (dirty && stateValue !== '-' && inputRef.current) {
        const suffix = getSuffix(stateValue, formatValueOptions)
        if (selectIndex) {
          // if (!groupSeparator) {
          //   setSelectIndex((prev) => {
          //     return {
          //       start: prev.start + 1,
          //       end: prev.end + 1,
          //     }
          //   })
          // }
          inputRef.current.setSelection(selectIndex.start + 1, selectIndex.end + 1)
        }
        // inputRef.current.setSelection()
      }
    }, [stateValue, cursor, inputRef, dirty, changeCount])

    /**
     * If user has only entered "-" or decimal separator,
     * keep the char to allow them to enter next value
     */
    const getRenderValue = () => {
      if (
        userValue != null &&
        stateValue !== '-' &&
        (!decimalSeparator || stateValue !== decimalSeparator)
      ) {
        return formatValue({
          ...formatValueOptions,
          decimalScale: dirty ? undefined : decimalScale,
          value: String(userValue),
        })
      }

      return stateValue
    }

    const inputProps: TextInputProps = {
      keyboardType: 'numeric',
      onChangeText: handleOnChange,
      onEndEditing: handleOnEndEditing,
      onFocus: handleOnFocus,
      onSelectionChange: handleOnSelectionChange,
      placeholder,
      editable: !disabled,
      value: getRenderValue(),
      ...props,
    }

    // if (customInput) {
    //   const CustomInput = customInput
    //   return <CustomInput {...inputProps} />
    // }

    return (
      <TextInput
        {...inputProps}
        ref={inputRef}
        onKeyPress={(e) => {
          setLastKeyStroke(e.nativeEvent.key)
        }}
      />
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

export default CurrencyInput
