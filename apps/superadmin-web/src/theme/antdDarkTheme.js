/**
 * @module antdDarkTheme
 * @description Ant Design 5.x dark theme token overrides.
 *              Applied via ConfigProvider in main.jsx.
 *              All colors mapped to AttendEase command center palette.
 */

import { theme } from 'antd';

export const antdDarkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary:        '#00d4ff',
    colorBgBase:         '#080810',
    colorBgContainer:    '#0f0f1a',
    colorBgElevated:     '#161625',
    colorBorder:         '#1e1e35',
    colorBorderSecondary:'#1e1e35',
    colorText:           '#e8e8f0',
    colorTextSecondary:  '#6b6b8a',
    colorTextPlaceholder:'#6b6b8a',
    colorSuccess:        '#00ff88',
    colorWarning:        '#ffaa00',
    colorError:          '#ff3366',
    colorInfo:           '#00d4ff',
    colorLink:           '#00d4ff',
    colorLinkHover:      '#33ddff',
    borderRadius:        6,
    borderRadiusLG:      8,
    borderRadiusSM:      4,
    fontFamily:          "'Geist', system-ui, sans-serif",
    fontFamilyCode:      "'JetBrains Mono', monospace",
    fontSize:            13,
    fontSizeLG:          14,
    fontSizeSM:          12,
    lineHeight:          1.5,
    controlHeight:       36,
    controlHeightLG:     40,
    controlHeightSM:     28,
    paddingContentHorizontal: 12,
    motionDurationMid:   '0.15s',
    motionDurationSlow:  '0.25s',
    colorSplit:          '#1e1e35',
    colorFillAlter:      '#161625',
    colorFillContent:    '#161625',
  },
  components: {
    Table: {
      colorBgContainer:      '#0f0f1a',
      headerBg:              '#161625',
      headerColor:           '#6b6b8a',
      headerSortActiveBg:    '#1e1e35',
      headerSortHoverBg:     '#1e1e35',
      rowHoverBg:            '#161625',
      rowSelectedBg:         '#00d4ff10',
      rowSelectedHoverBg:    '#00d4ff18',
      borderColor:           '#1e1e35',
      footerBg:              '#161625',
      cellPaddingBlock:      10,
      cellPaddingInline:     12,
    },
    Modal: {
      contentBg:             '#0f0f1a',
      headerBg:              '#0f0f1a',
      footerBg:              '#0f0f1a',
      titleColor:            '#e8e8f0',
      colorIcon:             '#6b6b8a',
      colorIconHover:        '#e8e8f0',
    },
    Drawer: {
      colorBgElevated:       '#0f0f1a',
      colorText:             '#e8e8f0',
    },
    Select: {
      colorBgContainer:      '#161625',
      optionSelectedBg:      '#1e1e35',
      optionActiveBg:        '#1e1e35',
      selectorBg:            '#161625',
    },
    Input: {
      colorBgContainer:      '#161625',
      activeBorderColor:     '#00d4ff',
      hoverBorderColor:      '#00d4ff80',
      activeShadow:          '0 0 0 2px rgba(0,212,255,0.1)',
    },
    Button: {
      colorPrimary:          '#00d4ff',
      colorPrimaryHover:     '#33ddff',
      colorPrimaryActive:    '#00b8e0',
      primaryShadow:         '0 0 12px rgba(0,212,255,0.3)',
    },
    Tabs: {
      inkBarColor:           '#00d4ff',
      itemActiveColor:       '#00d4ff',
      itemHoverColor:        '#e8e8f0',
      itemSelectedColor:     '#00d4ff',
      cardBg:                '#161625',
    },
    Tag: {
      defaultBg:             '#161625',
      defaultColor:          '#6b6b8a',
    },
    Tooltip: {
      colorBgSpotlight:      '#161625',
      colorTextLightSolid:   '#e8e8f0',
    },
    Pagination: {
      itemActiveBg:          '#00d4ff20',
      colorPrimary:          '#00d4ff',
    },
    Switch: {
      colorPrimary:          '#00d4ff',
      colorPrimaryHover:     '#33ddff',
    },
    Badge: {
      colorBgContainer:      '#0f0f1a',
    },
    Card: {
      colorBgContainer:      '#0f0f1a',
      colorBorderSecondary:  '#1e1e35',
    },
    Dropdown: {
      colorBgElevated:       '#161625',
      controlItemBgHover:    '#1e1e35',
      controlItemBgActive:   '#00d4ff15',
    },
    DatePicker: {
      colorBgContainer:      '#161625',
      colorBgElevated:       '#161625',
      activeBorderColor:     '#00d4ff',
      cellActiveWithRangeBg: '#00d4ff15',
      cellHoverBg:           '#1e1e35',
    },
    Popconfirm: {
      colorBgElevated:       '#161625',
    },
    Message: {
      contentBg:             '#161625',
    },
    Notification: {
      colorBgElevated:       '#161625',
    },
    Progress: {
      colorSuccess:          '#00ff88',
      defaultColor:          '#00d4ff',
    },
    Spin: {
      colorPrimary:          '#00d4ff',
    },
    Empty: {
      colorTextDescription:  '#6b6b8a',
    },
    Form: {
      labelColor:            '#6b6b8a',
      colorError:            '#ff3366',
    },
    Segmented: {
      trackBg:               '#161625',
      itemSelectedBg:        '#1e1e35',
      itemSelectedColor:     '#00d4ff',
    },
  },
};
