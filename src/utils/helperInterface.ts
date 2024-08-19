import { Json } from '../types/database-generated';
import { Tag } from '../types/database-types';

/**
 * Represents a project in Supabase.
 */
export interface SupabaseProject {
  client_id: string;
  description: string;
  project_id: string;
  project_number: number;
  requirements_list: string;
  slots: number;
  tags: Json;
  technical_requirements: string;
  title: string;
}

/**
 * Type representing possible role table names.
 */
export type RoleTableName = 'students' | 'tutors' | 'coordinators' | 'clients';

/**
 * Represents a generic report record.
 */
type Report = Record<string, string>;

/**
 * Represents the course codes compatible with Synergy.
 */
export type Course = 'COMP3900' | 'COMP9900';

/**
 * Represents an allocation report.
 */
export interface AllocationReport extends Report {
  project: string;
  group: string;
  student: string;
  zid: string;
  email: string;
}

/**
 * Represents a project report.
 */
export interface ProjectReport extends Report {
  project: string;
  group: string;
  user: string;
  email: string;
}

/**
 * Represents an individual report.
 */
export interface IndividualReport extends Report {
  zid: string;
  ratings: string;
}

/**
 * Represents an individual group report.
 */
export interface IndividualGroupReport extends Report {
  zid: string;
  group: string;
  project: string;
  ratings: string;
}

/**
 * Represents the body of a report request.
 */
export interface reportBody {
  format: string;
  allocationReport?: AllocationReport[];
  projectReport?: ProjectReport[];
  individualReport?: IndividualReport[];
  individualGroupReport?: IndividualGroupReport[];
  /* Add other report types here */
}

/**
 * Represents tutorial codes for different courses.
 */
export interface TutorialCodes {
  COMP3900: string[];
  COMP9900: string[];
}

/**
 * Represents a formatted allocation.
 */
export interface FormattedAllocation {
  group_id: number;
  group_name: string;
  project_id: string;
  project_number: number;
}

/**
 * Represents a student's profile allocation.
 */
export interface StudentProfileAllocation {
  groupName: string;
  allocatedProject: string;
  teamScore: Tag[];
}

/**
 * Represents a formatted unallocated group.
 */
export interface FormattedUnallocated {
  group_id: number;
  group_name: string;
}

/**
 * Represents a notification group.
 */
interface NotificationGroup {
  group_id: number;
  name: string;
  project_number: number;
  client_id: string;
}

/**
 * Represents a notification allocation.
 */
export interface NotificationAllocation {
  groups: NotificationGroup;
}

/**
 * Represents a notification to be sent to a user.
 */
export interface Notification {
  user_id: string;
  body: string;
}

/**
 * Represents a group to be inserted.
 */
export interface Group {
  name: string;
  description: string;
  capacity: number;
  members_count: number;
}
