import { User } from '../../types/database-types';
import supabase from '../../config/supabaseClient';

/**
 * Fetches user data by user ID.
 *
 * @param {string} id - The ID of the user to fetch data for.
 * @returns {Promise<User>} A promise that resolves to the user data.
 * @throws {Error} If there is an error while fetching the user data.
 */
export const getUserDataById = async (id: string): Promise<User> => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('auth_id', id).single();
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching public user data:', error);
    throw error;
  }
};

/**
 * Fetches the authenticated user's information.
 *
 * @returns {Promise<{ id: string; metaData: User } | undefined>} A promise that resolves to the authenticated user's information or undefined if no user is authenticated.
 * @throws {Error} If there is an error while fetching the user data.
 */
export const getUserInfo = async (): Promise<{ id: string; metaData: User } | undefined> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return { id: user.id, metaData: await getUserDataById(user.id) };
    }
    return undefined;
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

/**
 * Fetches user data for multiple user IDs.
 *
 * @param {string[]} ids - An array of user IDs to fetch data for.
 * @returns {Promise<User[]>} A promise that resolves to an array of user data.
 * @throws {Error} If there is an error while fetching the user data.
 */
export const getUsersDataByIds = async (ids: string[]): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*').in('auth_id', ids);
  if (error) {
    console.error('Error fetching users data:', error);
    return [];
  }
  return data as User[];
};

/**
 * Updates user data.
 *
 * @param {User} userData - The user data to update.
 * @returns {Promise<void>} A promise that resolves when the user data is updated.
 * @throws {Error} If there is an error while updating the user data.
 */
export const setUserInfo = async (userData: User) => {
  await supabase.from('users').update(userData).eq('auth_id', userData.auth_id);
};

/**
 * Fetches the display picture URL for a user by user ID.
 *
 * @param {string} id - The ID of the user to fetch the display picture for.
 * @returns {string} The URL of the user's display picture.
 */
export const getDisplayPicWithId = (id: string): string => {
  const { data } = supabase.storage.from(`user/${id}`).getPublicUrl('displayPic');
  return data.publicUrl + `?t=${new Date().getTime()}`;
};

/**
 * Updates the display picture URL for a user by user ID.
 *
 * @param {string} id - The ID of the user to update the display picture for.
 * @returns {Promise<void>} A promise that resolves when the display picture URL is updated.
 * @throws {Error} If there is an error while updating the display picture URL.
 */
export const updateUserImg = async (id: string) => {
  await supabase
    .from('users')
    .update({ img: getDisplayPicWithId(id) })
    .eq('auth_id', id);
};

/**
 * Checks if an email address exists in the user database.
 *
 * @param {string} email - The email address to check.
 * @returns {Promise<boolean>} A promise that resolves to true if the email exists, false otherwise.
 * @throws {Error} If there is an error while checking the email.
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  const { data, error } = await supabase.from('users').select('email').eq('email', email);
  return error ? false : data.length > 0;
};
