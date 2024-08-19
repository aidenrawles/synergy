import { Group, Allocation, Unallocated } from '../../types/database-types';
import supabase from '../../config/supabaseClient';
import { FormattedAllocation, FormattedUnallocated, Group as SimpleGroup } from '../helperInterface';
import { getProjectWithId } from './projectHelper';

/**
 * Inserts new groups into the database.
 *
 * @param {SimpleGroup[]} groups - An array of groups to insert.
 * @returns {Promise<number>} A promise that resolves to the group ID of the inserted group.
 * @throws {Error} If there is an error while inserting the groups.
 */
export const insertGroups = async (groups: SimpleGroup[]): Promise<number> => {
  const { data, error } = await supabase.from('groups').insert(groups).select('group_id').single();
  if (error) throw new Error(error.message);
  return data.group_id;
};

/**
 * Fetches a group by its ID.
 *
 * @param {number} groupId - The ID of the group to fetch.
 * @returns {Promise<Group>} A promise that resolves to the fetched group.
 * @throws {Error} If there is an error while fetching the group.
 */
export const getGroupWithId = async (groupId: number): Promise<Group> => {
  const { data, error } = await supabase.from('groups').select().eq('group_id', groupId).single();
  if (error) {
    throw new Error(error.message);
  } else {
    return data;
  }
};

/**
 * Formats allocation data by fetching additional project and group information.
 *
 * @param {Allocation} data - The raw allocation data.
 * @returns {Promise<FormattedAllocation>} A promise that resolves to the formatted allocation data.
 * @throws {Error} If there is an error while formatting the allocations.
 */
export const formatAllocations = async (data: Allocation): Promise<FormattedAllocation> => {
  const projectNum = await getProjectWithId(data.project_id);
  const groupName = await getGroupWithId(data.group_id);
  if (projectNum && groupName) {
    return { ...data, project_number: projectNum.project_number, group_name: groupName.name };
  } else {
    throw new Error('Failed to format allocations');
  }
};

/**
 * Formats unallocated group data by fetching the group name.
 *
 * @param {Unallocated} data - The raw unallocated group data.
 * @returns {Promise<FormattedUnallocated>} A promise that resolves to the formatted unallocated group data.
 * @throws {Error} If there is an error while formatting the unallocated groups.
 */
export const formatUnallocated = async (data: Unallocated): Promise<FormattedUnallocated> => {
  const groupName = await getGroupWithId(data.group_id);
  if (groupName) {
    return { ...data, group_name: groupName.name };
  } else {
    throw new Error('Failed to format allocations');
  }
};

/**
 * Fetches all unallocated groups and formats their data.
 *
 * @returns {Promise<FormattedUnallocated[]>} A promise that resolves to an array of formatted unallocated groups.
 * @throws {Error} If there is an error while fetching or formatting the unallocated groups.
 */
export const getUnallocated = async (): Promise<FormattedUnallocated[]> => {
  const { data, error } = await supabase.rpc('fetch_unallocated');
  if (error) {
    throw new Error(error.message);
  } else {
    const formattedAllocations = await Promise.all(data.map((groupId) => formatUnallocated(groupId)));
    return formattedAllocations;
  }
};

/**
 * Fetches all project allocations and formats their data.
 *
 * @returns {Promise<FormattedAllocation[]>} A promise that resolves to an array of formatted project allocations.
 * @throws {Error} If there is an error while fetching or formatting the project allocations.
 */
export const getProjectAllocations = async (): Promise<FormattedAllocation[]> => {
  const { data, error } = await supabase.from('allocations').select();
  if (error) {
    throw new Error(error.message);
  } else {
    const formattedAllocations = await Promise.all(data.map((allocation) => formatAllocations(allocation)));
    return formattedAllocations;
  }
};

/**
 * Fetches all groups.
 *
 * @returns {Promise<Group[]>} A promise that resolves to an array of groups.
 * @throws {Error} If there is an error while fetching the groups.
 */
export const getAllGroups = async (): Promise<Group[]> => {
  const { data, error } = await supabase.from('groups').select();
  if (error) {
    throw new Error(error.message);
  } else {
    return data;
  }
};

/**
 * Removes a group by its ID.
 *
 * @param {number} group_id - The ID of the group to remove.
 * @returns {Promise<void>} A promise that resolves when the group is removed or an error object.
 * @throws {Error} If there is an error while removing the group.
 */
export const removeGroup = async (group_id: number): Promise<void> => {
  const { error } = await supabase.from('groups').delete().eq('group_id', group_id);
  if (error) {
    throw new Error('Failed to remove');
  }
};

/**
 * Fetches group members for a list of group IDs.
 *
 * @param {number[]} groupIds - An array of group IDs to fetch members for.
 * @returns {Promise<Record<number, string[]>>} A promise that resolves to an object where keys are group IDs and values are arrays of user IDs.
 * @throws {Error} If there is an error while fetching the group members.
 */
export const fetchGroupMembers = async (groupIds: number[]): Promise<Record<number, string[]>> => {
  const { data: membersData, error: membersError } = await supabase
    .from('group_members')
    .select('group_id, user_id')
    .in('group_id', groupIds);
  if (membersError) {
    console.error('Error fetching group members:', membersError);
    throw new Error(membersError.message);
  }
  const membersByGroup: Record<number, string[]> = {};
  membersData?.forEach((member) => {
    if (!membersByGroup[member.group_id]) {
      membersByGroup[member.group_id] = [];
    }
    membersByGroup[member.group_id].push(member.user_id);
  });
  return membersByGroup;
};

/**
 * Fetches the group ID for a specific student.
 *
 * @param {string} studentId - The ID of the student to fetch data for.
 * @returns {Promise<{ group_id: number }>} A promise that resolves to an object containing the group ID.
 * @throws {Error} If there is an error while fetching the group ID.
 */
export const getGroupIdWithUserId = async (studentId: string): Promise<{ group_id: number }> => {
  const { data, error } = await supabase.from('group_members').select('group_id').eq('user_id', studentId).single();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Joins a student to a specific group.
 *
 * @param {string} studentId - The ID of the student to join the group.
 * @param {number} groupId - The ID of the group to join.
 * @returns {Promise<void>} A promise that resolves when the student has been added to the group.
 * @throws {Error} If there is an error while joining the group.
 */
export const joinGroup = async (studentId: string, groupId: number): Promise<void> => {
  const { error } = await supabase.from('group_members').insert({ user_id: studentId, group_id: groupId });
  if (error) throw new Error(error.message);
};

/**
 * Removes a student from a specific group.
 *
 * @param {string} studentId - The ID of the student to remove from the group.
 * @param {number} groupId - The ID of the group to leave.
 * @returns {Promise<void>} A promise that resolves when the student has been removed from the group.
 * @throws {Error} If there is an error while leaving the group.
 */
export const leaveGroup = async (studentId: string, groupId: number): Promise<void> => {
  const { error } = await supabase.from('group_members').delete().match({ user_id: studentId, group_id: groupId });
  if (error) throw new Error(error.message);
};
