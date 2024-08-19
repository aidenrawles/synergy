export type TableNames = 'students' | 'admins' | 'tutors' | 'coordinators' | 'clients';
export type Tags = 'Backend' | 'Frontend/UI' | 'Database' | 'AI' | 'Cyber Security' | 'DSA';
export type Ratings = Record<string, number>;

export interface User {
  auth_id: string;
  class: string;
  email: string;
  first_name: string;
  id: string;
  img: string;
  last_name: string;
  role: string;
  tutorial: string;
  zid: string;
}

export interface Project {
  client_id: string;
  description: string;
  project_id: string;
  project_number: number;
  requirements_list: string;
  slots: number;
  tags: ProjectTags;
  technical_requirements: string;
  title: string;
}

export interface Group {
  capacity: number;
  client_id: string | null;
  description: string;
  group_id: number;
  members_count: number;
  name: string;
  project_number: number | null;
  course: string | null;
  tutorial: string | null;
}

export interface GroupPreference {
  group_id: number;
  preference_rank: number;
  project_id: string;
}

export interface GroupMembers {
  group_id: number;
  user_id: string;
}

export interface Tag {
  tag: string;
  weight: number;
}

export interface ProjectTags {
  tags: Tag[];
}

export interface Invite {
  invite_id: number;
  iss: string;
  email: string;
  role: string;
  accepted: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  created_at: string;
  body: string;
  read: boolean;
}

export interface Allocation {
  group_id: number;
  project_id: string;
}

export interface Unallocated {
  group_id: number;
}
