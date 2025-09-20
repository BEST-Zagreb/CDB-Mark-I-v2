import { useDeleteAlert } from "@/contexts/delete-alert-context";

export function useSimpleDelete() {
  const { showDeleteAlert } = useDeleteAlert();

  const confirmDelete = (
    entity: string,
    entityName: string,
    deleteFunction: () => void | Promise<void>
  ) => {
    showDeleteAlert({
      entity,
      entityName,
      onConfirm: deleteFunction,
    });
  };

  return { confirmDelete };
}
