import { UserType } from '../../types/enums';
import { TAGS } from '../projectTag';
import { Ratings, Tag, Tags } from '../../types/database-types';
import supabase from '../../config/supabaseClient';
import { RoleTableName, TutorialCodes } from '../helperInterface';

/**
 * Converts a role string to a UserType enum.
 *
 * @param {string} role - The role string to convert.
 * @returns {UserType} The corresponding UserType enum.
 */
export const convertRoleToUserType = (role: string): UserType => {
  return (role.slice(0, 1).toUpperCase() + role.slice(1)) as UserType;
};

/**
 * Converts a ratings object to an array of Tag objects.
 *
 * @param {Ratings} ratings - The ratings object to convert.
 * @returns {Tag[]} The array of Tag objects.
 */
export const convertRatingsToTags = (ratings: Ratings): Tag[] => {
  const keys = Object.keys(ratings) as Tags[];
  if (keys.length === 0) {
    return TAGS.map((tag) => {
      return { tag, weight: 0 };
    });
  }
  return keys.map((tag) => {
    if (tag in ratings) {
      const weight = ratings[tag];
      return { tag, weight };
    }
    return { tag, weight: 0 };
  });
};

/**
 * Gets the table name corresponding to a UserType enum.
 *
 * @param {UserType} role - The UserType enum.
 * @returns {RoleTableName} The corresponding table name.
 * @throws {Error} If the UserType is invalid.
 */
export const getRoleTableName = (role: UserType): RoleTableName => {
  switch (role) {
    case UserType.Student:
      return 'students';
    case UserType.Tutor:
      return 'tutors';
    case UserType.Coordinator:
      return 'coordinators';
    case UserType.Client:
      return 'clients';
    default:
      throw new Error('Invalid user role');
  }
};

/**
 * Casts a string to a RoleTableName type.
 *
 * @param {string} tableName - The table name to cast.
 * @returns {RoleTableName} The casted table name.
 * @throws {Error} If the table name is invalid.
 */
export const castToRoleTableName = (tableName: string): RoleTableName => {
  if (['students', 'tutors', 'coordinators', 'clients'].includes(tableName)) {
    return tableName as RoleTableName;
  }
  throw new Error('Invalid table name');
};

/**
 * Updates the role of a user by removing them from the current role-specific table,
 * inserting them into the new role-specific table, and updating their role in the users table.
 *
 * @param {string} email - The email of the user whose role is to be updated.
 * @param {UserType} currentRole - The current role of the user.
 * @param {UserType} newRole - The new role to assign to the user.
 * @returns {Promise<void>} - A promise that resolves when the role update is complete.
 * @throws {Error} - If there is an error during the update process.
 */
export const updateRole = async (email: string, currentRole: UserType, newRole: UserType): Promise<void> => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('auth_id')
      .eq('email', email)
      .single();
    if (userError) throw new Error(`Error fetching user auth_id: ${userError.message}`);
    if (!userData) throw new Error('No user data found');
    const authId = userData.auth_id;
    const currentRoleTable = castToRoleTableName(getRoleTableName(currentRole));
    const newRoleTable = castToRoleTableName(getRoleTableName(newRole));
    const { error: deleteError } = await supabase.from(currentRoleTable).delete().match({ user_id: authId });
    if (deleteError) throw new Error(`Error removing user from current role table: ${deleteError.message}`);
    const { error: insertError } = await supabase.from(newRoleTable).insert([{ user_id: authId }]);
    if (insertError) throw new Error(`Error inserting user into new role table: ${insertError.message}`);
    const { error: updateError } = await supabase.from('users').update({ role: newRole }).eq('auth_id', authId);
    if (updateError) throw new Error(`Error updating user role in users table: ${updateError.message}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error updating role:', error.message);
      throw error;
    } else {
      console.error('Unknown error:', error);
      throw new Error('Unknown error occurred while updating role');
    }
  }
};

/**
 * Fetches class data using a serverless function.
 *
 * @returns {Promise<TutorialCodes>} A promise that resolves to the tutorial codes.
 * @throws {Error} If there is an error while fetching the class data.
 */
export const fetchClassData = async (): Promise<TutorialCodes> => {
  const data = (await supabase.functions.invoke<TutorialCodes>('timetable-scraper')).data;
  if (!data) {
    throw new Error('Failed to fetch class data');
  } else {
    return data;
  }
};

/**
 * Fetches tutorial codes for COMP3900 and COMP9900 from the database.
 *
 * @returns {Promise<TutorialCodes>} A promise that resolves to an object containing tutorial codes for COMP3900 and COMP9900.
 * @throws {Error} If there is an error while fetching the tutorial codes.
 */
export const getTutorialCodes = async (): Promise<TutorialCodes> => {
  const { data, error } = await supabase.from('class_data').select('*');

  if (error) throw new Error(error.message);

  if (!data) {
    throw new Error('Failed to fetch tutorial codes');
  } else {
    const comp3900 = data.filter((classData) => classData.course_code === 'COMP3900').map((tut) => tut.tutorial_code);
    const comp9900 = data.filter((classData) => classData.course_code === 'COMP9900').map((tut) => tut.tutorial_code);
    return { COMP3900: comp3900, COMP9900: comp9900 };
  }
};
