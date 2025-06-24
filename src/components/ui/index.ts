// =====================================
// src/components/ui/index.ts - UPDATED
// =====================================
// Export all UI components including Textarea
export { Button } from './button'
export type { ButtonProps } from './button'

export { Input } from './input'
export type { InputProps } from './input'

export { Label } from './label'
export type { LabelProps } from './label'

export { Textarea } from './textarea'  // ✅ ADD THIS LINE
export type { TextareaProps } from './textarea'

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from './card'