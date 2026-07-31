import { cn } from '../../lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-auto rounded-xl border border-border">
      <table className={cn('w-full caption-bottom text-sm data-table', className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

function TableBody({ className, ...props }) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

function TableFooter({ className, ...props }) {
  return <tfoot className={cn('border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0', className)} {...props} />;
}

function TableRow({ className, ...props }) {
  return <tr className={cn('border-b border-border/50 transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted', className)} {...props} />;
}

function TableHead({ className, sortable, sorted, onSort, ...props }) {
  return (
    <th
      className={cn('h-11 px-4 text-left align-middle text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40', sortable && 'cursor-pointer select-none hover:text-foreground', className)}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1">
        {props.children}
        {sortable && (
          <span className="ml-1 flex flex-col">
            <ChevronUp className={cn('w-3 h-3', sorted === 'asc' ? 'text-primary' : 'text-muted-foreground/40')} />
            <ChevronDown className={cn('w-3 h-3 -mt-1', sorted === 'desc' ? 'text-primary' : 'text-muted-foreground/40')} />
          </span>
        )}
      </div>
    </th>
  );
}

function TableCell({ className, ...props }) {
  return <td className={cn('px-4 py-3.5 align-middle', className)} {...props} />;
}

function TableCaption({ className, ...props }) {
  return <caption className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />;
}

function TableEmpty({ colSpan = 6, message = 'No data found.' }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg">—</div>
          <p>{message}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption, TableEmpty };
