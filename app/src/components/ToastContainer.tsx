import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

import { Toast } from '@/types'
import { cn } from '@/lib/utils'

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-primary-600" />
    }
  }

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'toast-success'
      case 'error':
        return 'toast-error'
      case 'warning':
        return 'toast-warning'
      case 'info':
      default:
        return 'toast-info'
    }
  }

  return (
    <div className={cn('toast', getStyles(), 'animate-slide-in')}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-secondary-900">
              {toast.title}
            </h4>
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-secondary-100 transition-colors"
            >
              <X className="w-4 h-4 text-secondary-500" />
            </button>
          </div>
          
          {toast.message && (
            <p className="mt-1 text-sm text-secondary-600 break-words">
              {toast.message}
            </p>
          )}
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ToastContainer() {
  // This would typically come from a global state management store
  // For now, we'll create a simple implementation
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Expose addToast globally for simplicity
  React.useEffect(() => {
    (window as any).addToast = addToast
    return () => {
      delete (window as any).addToast
    }
  }, [])

  if (toasts.length === 0) {
    return null
  }

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>,
    document.body
  )
}

// Hook for using toasts
export function useToast() {
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const fullToast: Toast = { ...toast, id }
    
    // This would typically dispatch to a store
    if ((window as any).addToast) {
      (window as any).addToast(fullToast)
    }
  }

  const success = (title: string, message?: string) =>
    addToast({ type: 'success', title, message })

  const error = (title: string, message?: string) =>
    addToast({ type: 'error', title, message })

  const warning = (title: string, message?: string) =>
    addToast({ type: 'warning', title, message })

  const info = (title: string, message?: string) =>
    addToast({ type: 'info', title, message })

  return {
    addToast,
    success,
    error,
    warning,
    info,
  }
}

// Global toast helper for non-component usage
export const toast = {
  success: (title: string, message?: string) => {
    if ((window as any).addToast) {
      (window as any).addToast({ type: 'success', title, message })
    }
  },
  error: (title: string, message?: string) => {
    if ((window as any).addToast) {
      (window as any).addToast({ type: 'error', title, message })
    }
  },
  warning: (title: string, message?: string) => {
    if ((window as any).addToast) {
      (window as any).addToast({ type: 'warning', title, message })
    }
  },
  info: (title: string, message?: string) => {
    if ((window as any).addToast) {
      (window as any).addToast({ type: 'info', title, message })
    }
  },
}