import { Tag } from '../../types/database-types';
import supabase from '../../config/supabaseClient';
import { fetchGroupMembers } from './groupHelper';
import {
  AllocationReport,
  ProjectReport,
  IndividualReport,
  IndividualGroupReport,
  StudentProfileAllocation,
} from '../helperInterface';
import { getProjectsWithClientId } from './projectHelper';
import { getUsersDataByIds } from './userHelper';

interface reportBody {
  format: string;
  allocationReport?: AllocationReport[];
  projectReport?: ProjectReport[];
  individualReport?: IndividualReport[];
  individualGroupReport?: IndividualGroupReport[];
}

/**
 * Invokes the 'generate-report' function in Supabase with the given body.
 * @param {reportBody} body - The body to send to the Supabase function.
 * @returns {Promise<string>} - The data returned from the Supabase function.
 * @throws {Error} - Throws an error if the Supabase function invocation fails.
 */
const generateReport = async (body: reportBody): Promise<string> => {
  const { data } = await supabase.functions.invoke<string>('generate-report', { body });
  if (!data) throw new Error('Failed to generate report');
  return data;
};

/**
 * Fetches allocation report data from Supabase and generates the report.
 * @param {string} format - The format of the report to generate (e.g., 'csv').
 * @returns {Promise<string>} - The generated report data.
 * @throws {Error} - Throws an error if fetching or generating the report fails.
 */
export const generateAllocationReport = async (format: string): Promise<string> => {
  const { data, error } = await supabase.from('groups').select('group_id, name, project_number');
  if (error) throw new Error(error.message);
  if (data) {
    const validAllocations = data
      .filter((record) => record.project_number !== null)
      .map((record) => ({
        groupId: record.group_id,
        project: record.project_number!.toString(),
        group: record.name,
      }));
    const unAllocated = data
      .filter((record) => record.project_number === null)
      .map((record) => ({
        groupId: record.group_id,
        project: 'Unallocated',
        group: record.name,
      }));
    const groups = [...validAllocations, ...unAllocated];
    const membersByGroup = await fetchGroupMembers(groups.map((group) => group.groupId));
    const formattedGroups = groups.map((group) => ({
      project: group.project,
      group: group.group,
      members: membersByGroup[group.groupId],
    }));
    let allocationReport: AllocationReport[] = [];
    for (const group of formattedGroups) {
      const members = await getUsersDataByIds(group.members);
      allocationReport = allocationReport.concat(
        members.map((user) => ({
          project: group.project,
          group: group.group,
          student: `${user.first_name} ${user.last_name}`,
          zid: user.zid,
          email: user.email,
        }))
      );
    }
    return await generateReport({ format, allocationReport });
  }
  throw new Error('Failed to fetch report data');
};

/**
 * Generates an individual project report in the specified format.
 *
 * @param {string} format - The format of the report (e.g., 'csv').
 * @param {string} projectNumber - The project number for which the report is to be generated.
 * @returns {Promise<string>} - A promise that resolves to the generated report data.
 * @throws {Error} - Throws an error if fetching or generating the report fails.
 */
export const generateIndividualProjectReport = async (format: string, projectNumber: string): Promise<string> => {
  const { data: groups, error } = await supabase
    .from('groups')
    .select('group_id, name, members_count')
    .eq('project_number', projectNumber);
  if (error) throw new Error(error.message);
  const groupIds = groups.map((group) => group.group_id);
  const membersByGroup = await fetchGroupMembers(groupIds);
  let projectReport: ProjectReport[] = [];
  for (const group of groups) {
    const members = await getUsersDataByIds(membersByGroup[group.group_id]);
    projectReport = projectReport.concat(
      members.map((user) => ({
        project: projectNumber,
        group: group.name,
        user: `${user.first_name} ${user.last_name}`,
        email: user.email,
      }))
    );
  }
  return await generateReport({ format, projectReport });
};

/**
 * Generates a report for all projects associated with a specific client in the specified format.
 *
 * @param {string} format - The format of the report (e.g., 'csv').
 * @param {string} clientId - The client ID for which the projects report is to be generated.
 * @returns {Promise<string>} - A promise that resolves to the generated report data.
 * @throws {Error} - Throws an error if fetching or generating the report fails.
 */
export const generateClientProjectsReport = async (format: string, clientId: string): Promise<string> => {
  const projects = await getProjectsWithClientId(clientId);
  const projectNumbers = projects.map((project) => project.project_number);
  const { data: groups, error } = await supabase
    .from('groups')
    .select('group_id, name, members_count, project_number')
    .in('project_number', projectNumbers);
  if (error) throw new Error(error.message);
  const groupIds = groups.map((group) => group.group_id);
  const membersByGroup = await fetchGroupMembers(groupIds);
  const formattedGroups = groups.map((group) => {
    const projectNumber = group.project_number ? group.project_number.toString() : '';
    return { name: group.name, project: projectNumber, members: membersByGroup[group.group_id] };
  });
  let projectReport: ProjectReport[] = [];
  for (const group of formattedGroups) {
    const members = await getUsersDataByIds(group.members);
    projectReport = projectReport.concat(
      members.map((user) => ({
        project: group.project,
        group: group.name,
        user: `${user.first_name} ${user.last_name}`,
        email: user.email,
      }))
    );
  }
  return await generateReport({ format, projectReport });
};

/**
 * Converts an array of tags to a formatted string.
 *
 * @param {Tag[]} ratings - The tags to convert.
 * @returns {string} - The formatted string of ratings.
 */
const convertRatingsToString = (ratings: Tag[]): string => {
  return ratings.map((tag) => `${tag.tag}: ${tag.weight}/5`).join();
};

/**
 * Generates an individual report in the specified format.
 *
 * @param {string} format - The format of the report (e.g., 'csv').
 * @param {string} zid - The zid of the individual for whom the report is to be generated.
 * @param {Tag[]} data - The data for the individual report.
 * @returns {Promise<string>} - A promise that resolves to the generated report data.
 * @throws {Error} - Throws an error if generating the report fails.
 */
export const generateIndividualReport = async (format: string, zid: string, data: Tag[]): Promise<string> => {
  const ratings = convertRatingsToString(data);
  const individualReport: IndividualReport[] = [{ zid, ratings }];
  return await generateReport({ format, individualReport });
};

/**
 * Generates an individual group report in the specified format.
 *
 * @param {string} format - The format of the report (e.g., 'csv').
 * @param {string} zid - The zid of the individual for whom the report is to be generated.
 * @param {StudentProfileAllocation} data - The data for the individual group report.
 * @returns {Promise<string>} - A promise that resolves to the generated report data.
 * @throws {Error} - Throws an error if generating the report fails.
 */
export const generateIndividualGroupReport = async (
  format: string,
  zid: string,
  data: StudentProfileAllocation
): Promise<string> => {
  const ratings = convertRatingsToString(data.teamScore);
  const individualGroupReport: IndividualGroupReport[] = [
    { zid, group: data.groupName, project: data.allocatedProject, ratings },
  ];
  return await generateReport({ format, individualGroupReport });
};
