import React, {
  ReactNode,
  useImperativeHandle,
  Ref,
  forwardRef,
  useRef,
  MutableRefObject,
  useState,
  useMemo,
  useEffect
} from 'react'
import AyCard from '../AyCard'
import { theme } from '../Theme'
import { Form, Row, Col, Input, Tooltip, Space, Button } from 'antd'
import { AyFormField, AyFormProps, RegisterFieldProps } from './ay-form'
import { copy, omitObj } from '../utils'
import { AySearchField } from '../AySearch/ay-search'
import { AnyKeyProps } from '../types/AnyKeyProps'
import { install } from './FieldsInit'
import {
  FORM_TYPE_SELECT,
  FORM_TYPE_PASSWORD,
  FORM_TYPE_INPUT,
  FORM_TYPE_CUSTOM,
  FORM_TYPE_DATE,
  FORM_TYPE_TEXTAREA,
  FORM_TYPE_DATE_RANGE,
  FORM_TYPE_NUMBER,
  FORM_TYPE_PERCENT,
  FORM_TYPE_CARD,
  FORM_TYPE_GROUP,
  FORM_TYPE_INPUT_GROUP,
  FORM_TYPE_CHECKBOX,
  FORM_TYPE_CHECKBOX_GROUP,
  FORM_TYPE_RADIO_GROUP,
  FORM_TYPE_CARD_GROUP,
  FORM_TYPE_TAG_GROUP,
  FORM_TYPE_LIST
} from '../constant'
import moment from 'moment'
import 'moment/locale/zh-cn'
import { AySearchTableField } from '../AySearchTable/ay-search-table'
import { ColProps } from 'antd'
import { convertChildrenToField } from '../AyFields/convertFields'
import { QuestionCircleOutlined } from '@ant-design/icons'
import locale from '../locale'
import { FormValues } from '../types/FormValues'
import parseFields from './parseFields'
import AyFormList from './AyFormList'

moment.locale('zh-cn')

const defaultLayout = {
  labelCol: { flex: '120px' },
  wrapperCol: { flex: '1' }
}

const fieldMap: AnyKeyProps = {}

/**
 * 注册一个 field type
 * @param fieldType field 类型
 * @param field 注册的 field
 */
export const registerField = (fieldType: string, field: RegisterFieldProps) => {
  fieldMap[fieldType] = field
}

// 初始化注册 field
install(registerField)

/**
 * 获取隐藏配置项
 * @param field 配置项
 */
const getNoVisibleField = (field: AyFormField | AySearchTableField): AyFormField | AySearchTableField => {
  return {
    ...field,
    title: '',
    type: 'empty'
  }
}

/**
 * 生成 placeholder
 * @param field 配置项
 */
const getPlaceholder = (field: AyFormField | AySearchTableField): string => {
  const defaultProps = field.props

  if (defaultProps && defaultProps.placeholder) {
    return defaultProps.placeholder
  }

  if (!field.type) {
    return `${locale.form.pleaseInput}${field.title || ''}${locale.form.pleaseInputAfter}`
  }

  if (
    [FORM_TYPE_INPUT, FORM_TYPE_NUMBER, FORM_TYPE_PERCENT, FORM_TYPE_PASSWORD, FORM_TYPE_TEXTAREA].includes(field.type)
  ) {
    return `${locale.form.pleaseInput}${field.title || ''}${locale.form.pleaseInputAfter}`
  } else if (
    [
      FORM_TYPE_SELECT,
      FORM_TYPE_DATE,
      FORM_TYPE_DATE_RANGE,
      FORM_TYPE_CHECKBOX,
      FORM_TYPE_CHECKBOX_GROUP,
      FORM_TYPE_RADIO_GROUP,
      FORM_TYPE_CARD_GROUP,
      FORM_TYPE_TAG_GROUP
    ].includes(field.type)
  ) {
    return `${locale.form.pleaseSelect}${field.title || ''}${locale.form.pleaseSelectAfter}`
  }

  return locale.form.pleaseInput + field.title || ''
}

/**
 * 获得配置列表
 * @param fields 配置列表
 */
export const getDefaultValue = (fields: Array<AyFormField | AySearchField | AySearchTableField>) => {
  let form: AnyKeyProps = {}
  fields.forEach((field: AyFormField | AySearchField | AySearchTableField) => {
    if ([FORM_TYPE_CARD, FORM_TYPE_GROUP, FORM_TYPE_INPUT_GROUP].includes(field.type || '')) {
      let children = field.children || []
      if (!Array.isArray(children)) {
        children = [children]
      }
      form = {
        ...form,
        ...getDefaultValue(children)
      }
      return
    }
    if (field.type === FORM_TYPE_LIST) {
      form = {
        ...form,
        [field.key || '']: [...(field.defaultValue || [])]
      }
      return
    }
    let type = field.type || 'input'
    const key = field?.key || ''
    // 如果配置项里存在默认值，直接返回默认值，否则从默认值表里获取
    if (field.hasOwnProperty('defaultValue')) {
      // 日期类型的需要通过 moment 转一遍
      if (type === FORM_TYPE_DATE && field.defaultValue) {
        form[key] = moment(field.defaultValue)
      } else if (type === FORM_TYPE_DATE_RANGE && field.defaultValue) {
        let [value0, value1] = field.defaultValue
        form[key] = [value0 ? moment(value0) : null, value1 ? moment(value1) : null]
      } else {
        form[key] = field.defaultValue
      }
    } else if (type) {
      if (fieldMap[type]) {
        const fieldItem = fieldMap[type]
        let defaultValue = fieldItem.defaultValue
        defaultValue = typeof defaultValue === 'object' ? copy(defaultValue) : defaultValue

        // 如果是多选则默认值是数组
        if (field.multiple || field.mode === 'multiple') {
          form[key] = []
        } else {
          form[key] = defaultValue
        }
      } else {
        form[key] = undefined
      }
    }
  })
  return form
}

export const getFieldDefaultValue = (key: string, fields: Array<AyFormField | AySearchField | AySearchTableField>) => {
  if (!key) {
    return ''
  }
  let field: any = getField(key, fields as Array<AyFormField>)
  if (field) {
    let type = field.type || 'input'
    // 如果配置项里存在默认值，直接返回默认值，否则从默认值表里获取
    if (field.hasOwnProperty('defaultValue')) {
      return field.defaultValue
    } else if (type) {
      if (fieldMap[type]) {
        const fieldItem = fieldMap[type]
        let defaultValue = fieldItem.defaultValue
        defaultValue = typeof defaultValue === 'object' ? copy(defaultValue) : defaultValue
        return defaultValue
      } else {
        return ''
      }
    }
  }
}

const fieldKeys = [
  'props',
  'title',
  'key',
  'options',
  'type',
  'grid',
  'span',
  'defaultValue',
  'order',
  'required',
  'rules',
  'visible',
  'hidden',
  'formItemProps',
  'renderContent',
  'onChange',
  'help',
  'startKey',
  'endKey',
  'formatRule',
  'readonlyFormatRule',
  'reSetting',
  'tooltip'
]

/**
 * 根据不同的 type 生成不同种类的标签 Tag
 * @param field 配置项
 */
const getTag = (
  field: AyFormField | AySearchTableField,
  fields: Array<AyFormField | AySearchTableField>,
  formInstans: AnyKeyProps,
  readonly?: boolean
) => {
  let { type } = field
  type = type || 'input'
  let tag: ReactNode = null
  if (fieldMap[type || '']) {
    let fieldItem = fieldMap[type || '']
    tag = fieldItem.render({
      field,
      setFieldsValue: formInstans.setFieldsValue,
      formInstans,
      readonly: readonly || field.readonly || false,
      getFieldValue: formInstans.getFieldValue
    })
  } else {
    switch (type) {
      case FORM_TYPE_CUSTOM:
        if (typeof field.renderContent === 'function') {
          tag = field.renderContent(field, formInstans.getFieldsValue() || getDefaultValue(fields))
        }
        break
    }
  }

  return tag
}

/**
 * 通过配置列表转 Form.Item
 * @param fields 配置列表
 * @param formInstans form 实例
 * @param props form 的 props
 * @param childrenType 子类型
 */
const getFormItem = (
  fields: Array<AyFormField | AySearchTableField>,
  formInstans: AnyKeyProps,
  props: AyFormProps,
  childrenType?: 'group' | 'card' | 'input-group' | 'list'
) => {
  const { span, readonly, formLayout, gutter } = props
  const ayFormProps: AyFormProps = props

  return fields.map((field: AyFormField | AySearchTableField, index: number) => {
    // 把其它属性 添加到 props 里面
    field = {
      ...field,
      props: {
        ...omitObj(field, fieldKeys),
        ...field.props
      }
    }

    const fieldSpan = field.span !== 0 ? field.span || span || 24 : span || 24

    if (field.type === FORM_TYPE_CARD) {
      let children = field.children || []
      if (!Array.isArray(children)) {
        children = [children]
      }
      let content = getFormItem(
        children as Array<AyFormField | AySearchTableField>,
        formInstans,
        ayFormProps,
        FORM_TYPE_CARD
      )
      return (
        <Col key={field.key} span={field.span || 24}>
          <AyCard title={field.title} {...field.props}>
            <Row gutter={gutter}>{content}</Row>
          </AyCard>
        </Col>
      )
    }
    if (childrenType === FORM_TYPE_LIST) {
      // debugger
    }

    let visible = true

    // 隐藏该项目，保留占位，但是保留值
    if (field.visible !== undefined) {
      visible = typeof field.visible === 'function' ? field.visible() : field.visible
    }

    let hidden = false

    // 隐藏该项目，不保留占位，但是保留值
    if (field.hidden !== undefined) {
      hidden = typeof field.hidden === 'function' ? field.hidden() : field.hidden
    }

    // 隐藏该项，只显示占位，保留 form 值
    if (!visible || hidden) {
      field = getNoVisibleField(field)
    }

    // 设置 Form.Item 的属性
    let formItemProps: AnyKeyProps = {
      ...field.formItemProps,
      label: field.title,
      name: field.key,
      extra: field.help
    }

    // 如果自元素类型是列表，则重置 name，此时一定有 field.formItemProps
    if (childrenType === FORM_TYPE_LIST) {
      formItemProps.name = field.formItemProps.name
    }

    // 组合元素的 formItem 不需要样式
    if (childrenType === FORM_TYPE_GROUP || childrenType === FORM_TYPE_INPUT_GROUP) {
      formItemProps.noStyle = true
    }

    // 设定 开关、多选框 等的值类型 （这是 ant design form 的限制）
    if (field.type && fieldMap[field.type]) {
      formItemProps.valuePropName = fieldMap[field.type].valuePropName || 'value'
    }

    // 设置每个【表单项】的占位
    const colProps: ColProps = {
      span: fieldSpan,
      offset: field.offset
    }

    // 填充 rules 属性
    if (field.rules) {
      formItemProps.rules = [...field.rules]
    }

    // 填充快捷 required 属性
    if (field.required) {
      let rule = { required: true, message: getPlaceholder(field) + locale.form.requiredText }
      if (field.children && field.type !== FORM_TYPE_CHECKBOX) {
        formItemProps.label = (
          <span>
            <span className="required-mark">*</span>
            {field.title}
          </span>
        )
      } else {
        if (formItemProps.rules) {
          formItemProps.rules.push(rule)
        } else {
          formItemProps.rules = [rule]
        }
      }
    }

    // 不保留占位
    if (hidden) {
      colProps.span = 0
      colProps.xs = 0
      colProps.sm = 0
      colProps.md = 0
      colProps.lg = 0
      colProps.xl = 0
    }

    // 不显示状态下 rule 无效
    if (hidden || !visible) {
      formItemProps.rules = []
    }

    // 支持 tooltip 属性
    if (field.tooltip) {
      formItemProps.label = (
        <span>
          {field.title}
          <Tooltip placement="top" title={field.tooltip}>
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      )
    }

    let tag: ReactNode

    switch (field.type) {
      // 组合类型
      case FORM_TYPE_GROUP:
        tag = (
          <Row className="ay-form-group" {...field.props}>
            {getFormItem(
              field.children as Array<AyFormField | AySearchTableField>,
              formInstans,
              ayFormProps,
              FORM_TYPE_GROUP
            )}
          </Row>
        )
        break
      // 输入框组合
      case FORM_TYPE_INPUT_GROUP:
        tag = (
          <Input.Group compact {...field.props}>
            {getFormItem(
              field.children as Array<AyFormField | AySearchTableField>,
              formInstans,
              ayFormProps,
              FORM_TYPE_INPUT_GROUP
            )}
          </Input.Group>
        )
        break
      // 列表类型
      case FORM_TYPE_LIST:
        tag = (
          <AyFormList
            field={field as AyFormField}
            formInstant={formInstans}
            getFormItem={getFormItem}
            ayFormProps={ayFormProps}
          />
        )
        break

      default:
        tag = getTag(field, fields, formInstans, readonly)
        break
    }

    const content = field.render ? (
      field.render(field as AyFormField, formInstans.getFieldsValue() || getDefaultValue(fields), index)
    ) : (
      <Form.Item key={field.key} {...formItemProps}>
        {tag}
      </Form.Item>
    )

    if (formLayout === 'inline' || childrenType === FORM_TYPE_INPUT_GROUP) {
      return content
    }

    return (
      <Col key={field.key} {...colProps}>
        {content}
      </Col>
    )
  })
}

const getField = (key: string, fields: Array<AyFormField | AySearchTableField>) => {
  let field: AyFormField | AySearchTableField | null = null

  const loop = (fields: Array<AyFormField | AySearchTableField>) => {
    for (let i = 0; i < fields.length; i++) {
      let item = fields[i]
      if (item.key === key) {
        field = item
        break
      } else if (Array.isArray(item.children) && item.children.length) {
        loop(item.children)
      }
    }
  }

  loop(fields)

  return field
}

/**
 * 格式化 日期
 * @param values 格式化的数据
 * @param fields 配置项
 */
const formatValues = (values: AnyKeyProps, fields: Array<AyFormField | AySearchTableField>): AnyKeyProps => {
  let result: AnyKeyProps = {}
  for (let key in values) {
    if (key.startsWith('__')) {
      continue
    }
    let value = values[key]
    let field: any = getField(key, fields)
    if (value && field) {
      // 获得格式化日期格式
      let formatRule: string = field?.showTime || field?.props?.showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'
      if (field.formatRule) {
        formatRule = field.formatRule
      }
      if (Array.isArray(value) && field.type === FORM_TYPE_DATE_RANGE) {
        // 区间类型取 startKey 与 endKey
        if (value[0]) {
          if (typeof value[0] === 'string') {
            result[field.startKey || 'startDate'] = value[0]
          } else {
            result[field.startKey || 'startDate'] = value[0]?.format(formatRule) || null
          }
        }
        if (value[1]) {
          if (typeof value[1] === 'string') {
            result[field.endKey || 'endDate'] = value[1]
          } else {
            result[field.endKey || 'endDate'] = value[1]?.format(formatRule) || null
          }
        }
      } else if (field.type === FORM_TYPE_DATE) {
        // 单值类型直接转
        if (typeof value === 'string') {
          result[key] = value
        } else {
          result[key] = value?.format(formatRule) || null
        }
      } else {
        result[key] = value
      }
    } else {
      result[key] = value
      // undefined 视为 null
      if (value === undefined) {
        result[key] = null
      }
    }
  }
  return result
}

/**
 * 提交表单，如果有 onConfirm 事件传入，则触发一次
 * @param values 表单值
 * @param onConfirm 提交表单事件
 * @param onFinish 提交表单事件，效果跟 onConfirm 一致
 * @param onSubmit 提交表单事件，效果跟 onConfirm 一致
 */
const handleConfirm = (
  values: AnyKeyProps,
  fields: Array<AyFormField | AySearchTableField>,
  onConfirm?: (values: FormValues) => void,
  onFinish?: (values: FormValues) => void,
  onSubmit?: (values: FormValues) => void
) => {
  let filterValues: FormValues = formatValues(values, fields)
  if (onConfirm) {
    onConfirm(filterValues)
  }
  if (onFinish) {
    onFinish(filterValues)
  }
  if (onSubmit) {
    onSubmit(filterValues)
  }
}

/**
 * 支持表单改变事件监听
 * @param changedValues 改变的值
 * @param allValues 表单所有的值
 * @param fields 所有的饿配置项
 * @param setFieldsValue 设置表单值的方法
 */
const handleChange = (
  changedValues: AnyKeyProps,
  allValues: AnyKeyProps,
  fields: Array<AyFormField | AySearchTableField>,
  setFieldsValue: (params: AnyKeyProps) => void
) => {
  for (let key in changedValues) {
    let field: any = getField(key, fields)
    if (field) {
      let value = changedValues[key]
      if (field.onChange) {
        field.onChange(value, allValues, setFieldsValue)
      }
    }
  }
}

/**
 * 获取 AyForm 样式
 * @param className 外部 className
 * @param desc 是否处于文档模式
 * @param readonly 是否处于只读模式
 */
const getAyFormClassName = (className?: string, desc?: boolean, readonly?: boolean) => {
  const classList = ['ay-form', theme]
  if (className) {
    classList.push(className)
  }
  if (desc) {
    classList.push('desc')
  }
  if (readonly) {
    classList.push('readonly')
  }
  return classList.join(' ')
}

/**
 * antd form 原生支持的方法尽数暴露出去
 */
export const funcs = [
  'getFieldValue',
  'getFieldsValue',
  'getFieldError',
  'getFieldsError',
  'isFieldTouched',
  'isFieldsTouched',
  'isFieldValidating',
  'resetFields',
  'scrollToField',
  'setFields',
  'setFieldsValue',
  'submit',
  'validateFields'
]

export default forwardRef(function AyForm(props: AyFormProps, ref: Ref<any>) {
  const {
    fields: originFields,
    formLayout = 'horizontal',
    onConfirm,
    onFinish,
    onSubmit,
    children,
    props: defaultProps,
    readonly,
    desc,
    layout,
    className,
    style,
    labelAlign,
    gutter,
    ...otherProps
  } = props

  // 子元素转化出来的 fields + 标签上的 fields
  const totalFields: Array<AyFormField> = useMemo(() => {
    const childrenFields = convertChildrenToField(children)
    return [...(originFields || []), ...childrenFields] as Array<AyFormField>
  }, [originFields, children])

  /** 当前表单值 */
  const [formValues, setFormValues] = useState<FormValues>(getDefaultValue(totalFields))
  /** 转换过后的 fields */
  const [fields, setFields] = useState(parseFields(totalFields, formValues))
  /** 是否初始化 */
  const [firstMount, setFirstMount] = useState(false)
  /** 控制 any form 的实例 */
  const formRef: MutableRefObject<any> = useRef()
  /** 暴露出去的 form 的实例，允许父组件通过 ref 调用方法 */
  const formInstans: AnyKeyProps = {}

  useEffect(() => {
    if (!firstMount) {
      setFields(parseFields(totalFields, formValues))
    } else {
      setFirstMount(true)
    }
  }, [totalFields, formValues])

  /** 填充方法 */
  funcs.forEach(func => {
    formInstans[func] = (...args: any) => formRef.current[func](...args)
  })

  // 设置表单值
  formInstans.setFieldsValue = (values: AnyKeyProps) => {
    fields.forEach(field => {
      try {
        let key = field?.key || ''
        let value = values[key]
        if (field.type === FORM_TYPE_DATE) {
          if (value) {
            values[key] = moment(value)
          }
        } else if (field.type === FORM_TYPE_DATE_RANGE && Array.isArray(value)) {
          let [value0, value1] = value as [string, string]
          values[key] = [value0 ? moment(value0) : null, value1 ? moment(value1) : null]
        }
      } catch {
        console.error('日期值转化错误')
      }
    })
    formRef.current.setFieldsValue(values)
    let newFormValues = { ...getFieldsValue(), ...values }
    setFormValues(newFormValues)
  }

  // 刷新 field
  formInstans.refreshFields = () => {
    setFields(parseFields(totalFields, formValues))
  }

  /**
   * 获取 field 的值
   * 如果 field 还没有渲染完，那获得的是 defaultValue
   * @param key field 的 key
   * @param readonly 是否只读
   */
  const getFieldValue = (key: string, readonly?: boolean) => {
    let value = getFieldDefaultValue(key, fields)
    if (formRef.current) {
      value = formRef.current.getFieldValue(key)
    }
    let field: any = getField(key, fields)
    if (field && value) {
      // 获得格式化日期格式
      let formatRule: string = field?.showTime || field?.props?.showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'
      if (field.formatRule) {
        formatRule = field.formatRule
      }
      // 只读模式下，格式化日期取 readonlyFormatRule
      if (field.readonlyFormatRule && readonly) {
        formatRule = field.readonlyFormatRule
      }
      if (field.type === FORM_TYPE_DATE) {
        // 日期格式化
        value = value ? moment(value).format(formatRule) : null
      } else if (Array.isArray(value) && field.type === FORM_TYPE_DATE_RANGE) {
        let [value0, value1] = value
        // 日期区间格式化
        value = [value0 ? moment(value0).format(formatRule) : null, value1 ? moment(value1).format(formatRule) : null]
      }
    }
    return value
  }

  /**
   * 根据 fields 获取 values
   * @param fields 配置项
   * @param readonly 是否只读
   * @returns object
   */
  const getValues = (fields: AyFormField | AySearchTableField, readonly?: boolean) => {
    let result: AnyKeyProps = {}
    fields.forEach((field: AyFormField | AySearchTableField) => {
      if (!field.key) {
        return
      }
      // 获取每个单个的值
      let value = getFieldValue(field.key, readonly)
      // 处理子层数据
      if (field.children && field.children.length) {
        let values = getValues(field.children, readonly)
        result = {
          ...result,
          ...values
        }
      }
      result[field.key] = value
    })
    return result
  }

  /**
   * 获取所有 field 的值
   * @param readonly 是否只读
   */
  const getFieldsValue = (readonly?: boolean) => {
    return formatValues(getValues(fields, readonly), fields)
  }

  /**
   * 重置表单值
   */
  const resetFields = () => {
    formRef.current.resetFields()
    setFormValues(getDefaultValue(totalFields))
  }

  /** 覆盖 antd Form resetFields 方法 */
  formInstans.resetFields = resetFields

  /** 覆盖 antd Form getFieldsValue 方法 */
  formInstans.getFieldsValue = getFieldsValue

  /** 覆盖 antd Form getFieldValue 方法 */
  formInstans.getFieldValue = getFieldValue

  /** 添加 getFormatFiledsValue 的值，历史遗留 */
  formInstans.getFormatFieldsValue = getFieldsValue

  /** 暴露方法 */
  useImperativeHandle(ref, () => formInstans)

  const formItemLayout =
    formLayout === 'horizontal'
      ? {
          ...defaultLayout,
          ...layout
        }
      : null

  return (
    <div className={getAyFormClassName(className, desc, readonly)} style={style}>
      <Form
        ref={formRef}
        colon={desc ? false : true}
        layout={formLayout as any}
        labelAlign={labelAlign}
        labelWrap
        {...formItemLayout}
        {...otherProps}
        {...defaultProps}
        initialValues={getDefaultValue(fields)}
        onFinish={values => handleConfirm(values, fields, onConfirm, onFinish, onSubmit)}
        onValuesChange={(changedValues, allValues) => {
          setFormValues(formatValues(allValues, fields))
          handleChange(changedValues, allValues, fields, formInstans.setFieldsValue)
        }}
      >
        <Row gutter={gutter}>
          {getFormItem(fields, formInstans, props)}
          {children}
        </Row>
      </Form>
    </div>
  )
})
