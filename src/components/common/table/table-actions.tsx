import { memo, ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface TableActionsProps<T> {
  item: T;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  canView?: boolean | ((item: T) => boolean);
  canEdit?: boolean | ((item: T) => boolean);
  canDelete?: boolean | ((item: T) => boolean);
}

export const TableActions = memo(function TableActions<T>({
  item,
  onView,
  onEdit,
  onDelete,
  canView,
  canEdit,
  canDelete,
}: TableActionsProps<T>) {
  const allow = (flag: boolean | ((item: T) => boolean) | undefined) => {
    if (typeof flag === "function") return flag(item);
    if (typeof flag === "boolean") return flag;
    return true;
  };

  const showView = !!onView && allow(canView);
  const showEdit = !!onEdit && allow(canEdit);
  const showDelete = !!onDelete && allow(canDelete);

  return (
    <TableCell className="text-center">
      <div className="flex justify-center items-center gap-2">
        {showView && (
          <Button variant="outline" size="icon" onClick={() => onView(item)}>
            <Eye className="h-4 w-4 text-primary" />
          </Button>
        )}
        {showEdit && (
          <Button variant="outline" size="icon" onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4 text-primary" />
          </Button>
        )}
        {showDelete && (
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
}) as <T>(props: TableActionsProps<T>) => ReactElement;
