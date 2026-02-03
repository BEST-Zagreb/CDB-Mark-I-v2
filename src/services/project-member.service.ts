import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export type ProjectMemberItem = {
  projectId: number;
  appUserId: string;
  role: string;
  fullName: string;
  email: string;
};

export type ProjectMembersResponse = { items: ProjectMemberItem[] };

export type AddProjectMembersResponse = {
  addedCount: number;
  addedUserIds: string[];
  skippedCount: number;
  invalidOrLocked: string[];
};

export const projectMemberService = {
  getByProject: async (projectId: number, role?: string) => {
    const params = new URLSearchParams({ projectId: String(projectId) });
    if (role) params.set("role", role);

    const res = await api.get<ProjectMembersResponse>(
      `/project-members?${params.toString()}`
    );
    return res.data;
  },

  addMembers: async (projectId: number, userIds: string[]) => {
    const res = await api.post<AddProjectMembersResponse>("/project-members", {
      projectId,
      userIds,
    });
    return res.data;
  },
};
