import { cn } from '../../lib/utils';
import { cva } from 'class-variance-authority';

const badgeVariants = cva(
  'erp-badge border',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground border-secondary',
        destructive: 'bg-destructive/10 text-destructive border-destructive/20',
        success: 'bg-success/10 text-success border-success/20',
        warning: 'bg-warning/10 text-warning border-warning/20',
        outline: 'border-border text-foreground',
        muted: 'bg-muted text-muted-foreground border-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
export default Badge;
