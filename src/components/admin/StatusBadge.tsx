// Status Badge Component
// src/components/admin/StatusBadge.tsx

import { FileText, Globe, Archive } from 'lucide-react'

interface StatusBadgeProps {
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = {
    DRAFT: {
      label: 'Draft',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: FileText
    },
    PUBLISHED: {
      label: 'Published',
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: Globe
    },
    ARCHIVED: {
      label: 'Archived',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Archive
    }
  }

  const { label, className, icon: Icon } = config[status]
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-1 text-xs' 
    : 'px-3 py-1 text-sm'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border ${className} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {label}
    </span>
  )
}