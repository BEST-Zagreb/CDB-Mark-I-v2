"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { DeleteAlert } from "@/components/delete-alert";

interface DeleteAlertConfig {
  entity: string;
  entityName?: string;
  onConfirm: () => void | Promise<void>;
}

interface DeleteAlertContextType {
  showDeleteAlert: (config: DeleteAlertConfig) => void;
  hideDeleteAlert: () => void;
}

const DeleteAlertContext = createContext<DeleteAlertContextType | undefined>(
  undefined
);

interface DeleteAlertProviderProps {
  children: ReactNode;
}

export function DeleteAlertProvider({ children }: DeleteAlertProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<DeleteAlertConfig | null>(null);

  const showDeleteAlert = (alertConfig: DeleteAlertConfig) => {
    setConfig(alertConfig);
    setIsOpen(true);
  };

  const hideDeleteAlert = () => {
    setIsOpen(false);
    setIsLoading(false);
    setConfig(null);
  };

  const handleConfirm = async () => {
    if (!config) return;

    setIsLoading(true);
    try {
      await config.onConfirm();
      hideDeleteAlert();
    } catch (error) {
      // Handle error if needed - the calling component can handle toasts
      console.error("Delete operation failed:", error);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    hideDeleteAlert();
  };

  return (
    <DeleteAlertContext.Provider value={{ showDeleteAlert, hideDeleteAlert }}>
      {children}
      <DeleteAlert
        open={isOpen}
        onOpenChange={setIsOpen}
        entity={config?.entity || ""}
        entityName={config?.entityName || ""}
        isLoading={isLoading}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </DeleteAlertContext.Provider>
  );
}

export function useDeleteAlert() {
  const context = useContext(DeleteAlertContext);
  if (context === undefined) {
    throw new Error("useDeleteAlert must be used within a DeleteAlertProvider");
  }
  return context;
}
