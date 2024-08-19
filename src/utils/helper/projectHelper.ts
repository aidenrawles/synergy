import { Project, ProjectTags, Tag } from '../../types/database-types';
import supabase from '../../config/supabaseClient';
import { SupabaseProject } from '../helperInterface';

/**
 * Formats a Supabase project object into a Project object.
 *
 * @param {SupabaseProject} data - The raw project data from Supabase.
 * @returns {Project} The formatted project data.
 */
const formatProject = (data: SupabaseProject): Project => {
  const {
    client_id,
    project_id,
    project_number,
    title,
    description,
    requirements_list,
    technical_requirements,
    slots,
  } = data;
  let tags: Tag[] = [];
  if (data.tags) {
    tags = (data.tags as unknown as ProjectTags).tags;
    tags = tags.length ? (JSON.parse(tags.toString()) as Tag[]) : [];
  }
  return {
    client_id,
    project_id,
    project_number,
    title,
    description,
    requirements_list,
    slots,
    tags: { tags },
    technical_requirements,
  };
};

/**
 * Fetches all projects from the database.
 *
 * @returns {Promise<Project[]>} A promise that resolves to an array of projects.
 * @throws {Error} If there is an error while fetching the projects.
 */
export const getProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase.from('projects').select();
  if (error) {
    throw new Error(error.message);
  } else {
    return data.map((project) => formatProject(project));
  }
};

/**
 * Fetches a project by its ID.
 *
 * @param {string} projectId - The ID of the project to fetch.
 * @returns {Promise<Project>} A promise that resolves to the fetched project.
 * @throws {Error} If there is an error while fetching the project.
 */
export const getProjectWithId = async (projectId: string): Promise<Project> => {
  const { data, error } = await supabase.from('projects').select('*').eq('project_id', projectId).single();
  if (error) {
    throw new Error(error.message);
  } else {
    return formatProject(data);
  }
};

/**
 * Fetches all projects for a specific client.
 *
 * @param {string} clientId - The ID of the client whose projects are to be fetched.
 * @returns {Promise<Project[]>} A promise that resolves to an array of projects.
 * @throws {Error} If there is an error while fetching the projects.
 */
export const getProjectsWithClientId = async (clientId: string): Promise<Project[]> => {
  const { data, error } = await supabase.from('projects').select().eq('client_id', clientId);
  if (error) {
    throw new Error(error.message);
  } else {
    return data.map((project) => formatProject(project));
  }
};

/**
 * Upserts a project in the database.
 *
 * @param {string | undefined} id - The ID of the project to be updated, or undefined for a new project.
 * @param {string} title - The title of the project.
 * @param {string} description - The description of the project.
 * @param {string} technical - The technical requirements of the project.
 * @param {string} requirements - The requirements of the project.
 * @param {number} slots - The number of slots for the project.
 * @param {Tag[]} tags - The tags for the project.
 * @throws {Error} If there are validation errors or if there is an error while upserting the project.
 */
export const upsertProject = async (
  id: string | undefined,
  title: string,
  description: string,
  technical: string,
  requirements: string,
  slots: number,
  tags: Tag[]
) => {
  if (title.length === 0) throw new Error('Project must have a title');
  if (tags.length === 0) throw new Error('Project must have at least one tag');
  if (slots <= 0) throw new Error('Project must have at least one group');
  if (tags.some((tag) => tag.weight === 0)) throw new Error('Tag(s) must have ratings');

  const { error } = await supabase.from('projects').upsert(
    {
      project_id: id,
      title,
      description,
      tags: { tags: JSON.stringify(tags) },
      requirements_list: requirements,
      technical_requirements: technical,
      slots,
    },
    { onConflict: 'project_id', ignoreDuplicates: false }
  );

  if (error) {
    throw new Error(error.message);
  }
};
