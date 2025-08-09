// =====================================
// src/components/ui/index.ts - UPDATED with new components
// =====================================

// Existing components
export { Button } from './button'
export type { ButtonProps } from './button'

export { Input } from './input'
export type { InputProps } from './input'

export { Label } from './label'
export type { LabelProps } from './label'

export { Textarea } from './textarea'
export type { TextareaProps } from './textarea'

export { Badge } from './badge'
export type { BadgeProps } from './badge'

export { Alert, AlertTitle, AlertDescription } from './alert'

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from './card'

export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

// NEW: Toast components
export {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  useToast,
  toast,
  type ToastProps,
  type ToastActionElement,
} from './toast'

// NEW: Dialog components
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  ConfirmationDialog,
  AlertDialog,
  Modal,
} from './dialog'

// NEW: Select components
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SimpleSelect,
  GroupedSelect,
  MultiSelect,
  SearchableSelect,
} from './select'