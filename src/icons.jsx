import {
  HiOutlineMoon,
  HiOutlineSun,
  HiFire,
  HiOutlineHome,
  HiBuildingOffice2,
  HiHomeModern,
  HiBuildingOffice,
  HiBuildingStorefront,
  HiOutlineBanknotes,
  HiOutlineKey,
  HiOutlineCurrencyDollar,
  HiOutlineInboxArrowDown,
  HiOutlineCalendarDays,
  HiArrowDownTray,
  HiOutlineEnvelope,
  HiOutlinePrinter,
  HiLockClosed,
  HiOutlinePencil,
  HiOutlineCommandLine,
  HiCheck,
  HiOutlineCheckCircle,
  HiExclamationTriangle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineTrash,
} from 'react-icons/hi2'

/** Lease type icons keyed by document type id */
export const DOC_TYPE_ICONS = {
  room:       HiOutlineHome,
  apartment:  HiBuildingOffice2,
  house:      HiHomeModern,
  condo:      HiBuildingOffice,
  commercial: HiBuildingStorefront,
}

export function DocTypeIcon({ typeId, className = 'w-7 h-7' }) {
  const Icon = DOC_TYPE_ICONS[typeId] ?? HiOutlineHome
  return <Icon className={className} aria-hidden="true" />
}

export function IconWell({ children, className = '' }) {
  return (
    <span className={`wizard-icon-well ${className}`} aria-hidden="true">
      {children}
    </span>
  )
}

export function IconBadge({ children, className = '' }) {
  return (
    <span className={`wizard-info-icon ${className}`} aria-hidden="true">
      {children}
    </span>
  )
}

export {
  HiOutlineMoon,
  HiOutlineSun,
  HiFire,
  HiOutlineBanknotes,
  HiOutlineKey,
  HiOutlineCurrencyDollar,
  HiOutlineInboxArrowDown,
  HiOutlineCalendarDays,
  HiArrowDownTray,
  HiOutlineEnvelope,
  HiOutlinePrinter,
  HiLockClosed,
  HiOutlinePencil,
  HiOutlineCommandLine,
  HiCheck,
  HiOutlineCheckCircle,
  HiExclamationTriangle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineTrash,
}
