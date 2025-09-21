import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface TableActionsProps<T> {
  item: T;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export function TableActions<T>({
  item,
  onView,
  onEdit,
  onDelete,
}: TableActionsProps<T>) {
  return (
    <TableCell className="text-center">
      <div className="flex justify-center items-center gap-2">
        {onView && (
          <Button variant="outline" size="icon" onClick={() => onView(item)}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {onEdit && (
          <Button variant="outline" size="icon" onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(item)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </TableCell>
  );
}
