import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({ className, type = 'text', label, error, icon: Icon, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'erp-input',
            Icon && 'pl-9',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export { Input };
export default Input;
