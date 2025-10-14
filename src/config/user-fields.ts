export const USER_FIELDS = [
  {
    id: "fullName",
    label: "Full Name",
    required: true,
  },
  {
    id: "email",
    label: "Email",
    required: false,
  },
  {
    id: "role",
    label: "Role",
    required: false,
  },
  {
    id: "description",
    label: "Description",
    required: false,
  },
  {
    id: "isLocked",
    label: "Locked",
    required: false,
  },
  {
    id: "lastLogin",
    label: "Last Login",
    required: false,
  },
  {
    id: "createdAt",
    label: "Created At",
    required: false,
  },
  {
    id: "updatedAt",
    label: "Updated At",
    required: false,
  },
] as const;

// Default visible columns
export const DEFAULT_USER_COLUMNS = [
  "fullName",
  "email",
  "role",
  "lastLogin",
] as const;
