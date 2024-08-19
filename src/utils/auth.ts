import { UserType } from '../types/enums';
import { URL } from '../config/config';
import supabase from '../config/supabaseClient';
import { RegisterToken, encrypt } from './crypto';
import { checkEmailExists } from './helper/userHelper';
import { Invite } from '../types/database-types';

/**
 * Interface representing a user to be registered.
 */
export interface RegisterUser {
  nameFirst: string;
  nameLast: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserType;
  zid?: string;
  tutorial?: string;
  class?: string;
}

/**
 * Interface representing email information.
 */
interface EmailInfo {
  to: string;
  subject: string;
  content: string;
  html: string;
}

/**
 * Checks if the provided email is a UNSW email.
 * @param {string} email - The email address to check.
 * @returns {boolean} - Returns true if the email is a UNSW email, otherwise false.
 */
export const isUnswEmail = (email: string): boolean => {
  return /^[^@]+@[^@]*\bunsw\b[^@]*$/i.test(email.toLowerCase());
};

/**
 * Checks if the user registration details are valid.
 * @param {RegisterUser} user - The user to be registered.
 * @returns {Promise<string>} A promise that resolves to an error message if validation fails, or an empty string if validation succeeds.
 */
export const registerCheck = async (user: RegisterUser): Promise<string> => {
  if (user.password !== user.confirmPassword) {
    return 'Password does not match';
  }

  if (user.role !== UserType.Client && !isUnswEmail(user.email)) {
    return 'Must be UNSW email';
  }

  if (user.zid && !/^z\d{7}$/.test(user.zid)) {
    return 'Invalid zID';
  }

  const { data } = await supabase.from('users').select('email, zid');
  if (data) {
    if (
      data.some(
        (d) =>
          d.email.toLowerCase() === user.email.toLowerCase() ||
          (d.zid?.toLowerCase() === user.zid?.toLowerCase() && d.zid.length !== 0)
      )
    ) {
      return 'Email or zID already taken!';
    }
  }
  return '';
};

/**
 * Validates if the role of the inviter can invite the invitee with the specified role.
 * @param {UserType} role - The role of the inviter.
 * @param {UserType} invitee - The role of the invitee.
 * @returns {boolean} True if the roles are valid for invitation, false otherwise.
 */
const validateRoles = (role: UserType, invitee: UserType): boolean => {
  switch (role) {
    case UserType.Coordinator:
      if (![UserType.Coordinator, UserType.Client, UserType.Student, UserType.Tutor].includes(invitee)) {
        return false;
      }
      break;
    case UserType.Tutor:
      if (![UserType.Client, UserType.Student, UserType.Tutor].includes(invitee)) {
        return false;
      }
      break;
    case UserType.Student:
      if (![UserType.Student].includes(invitee)) {
        return false;
      }
      break;
    case UserType.Client:
      return false;
    default:
      return true;
  }
  return true;
};

/**
 * Invites a user to register by creating an encrypted token.
 * @param {string} id - The ID of the inviter.
 * @param {string} email - The email of the invitee.
 * @param {UserType} role - The role of the invitee.
 * @returns {Promise<void>} A promise that resolves if the invitation is successful, or throws an error if it fails.
 * @throws Will throw an error if the user has already been invited or if the email already exists.
 */
export const inviteUser = async (id: string, email: string, role: UserType): Promise<void> => {
  const registerToken: RegisterToken = {
    iss: id,
    email,
    role,
  };

  if (await checkInvitedStatus(email)) {
    throw new Error('User has already been invited');
  }

  if (await checkEmailExists(email)) {
    throw new Error('Email already exists');
  }

  const { data, error } = await supabase.from('users').select('auth_id, role').eq('auth_id', id).single();
  if (error) {
    throw new Error('Failed to fetch user');
  }

  // Checking if they have permissions
  const dataRole = data.role.slice(0, 1).toUpperCase() + data.role.slice(1);
  if (validateRoles(dataRole as UserType, role)) {
    const { error } = await supabase.from('invites').insert({ iss: id, email, role });
    if (error) {
      throw new Error('Failed to insert invite');
    }

    const emailInfo: EmailInfo = {
      to: email,
      subject: 'Welcome to Synergy',
      content: 'You are invited to join Synergy!',
      html: `<p>You have been invited to join Synergy!</p>
             <p>Click the button below to register:</p>
             <a href="${URL}/register/${encrypt(registerToken)}" 
                style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #5030E5; text-align: center; text-decoration: none; border-radius: 4px;">
                Register an account!
             </a>`,
    };

    await supabase.functions.invoke('send-mail', {
      body: {
        emailInfo,
      },
    });
  } else {
    throw new Error('Not enough permissions');
  }
};

/**
 * Updates the invite status to accepted for the given email.
 * @param {string} email - The email of the invitee.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
export const updateInvite = async (email: string): Promise<void> => {
  await supabase.from('invites').update({ accepted: true }).eq('email', email);
};

/**
 * Validates the provided registration token.
 * @param {RegisterToken} token - The registration token.
 * @returns {Promise<boolean>} A promise that resolves to true if the token is valid, or false otherwise.
 */
export const validateToken = async (token: RegisterToken): Promise<boolean> => {
  if (!(token.email && token.iss)) {
    return false;
  }

  const { data } = await supabase
    .from('invites')
    .select()
    .eq('email', token.email)
    .eq('iss', token.iss)
    .eq('role', token.role)
    .single();
  return data ? true : false;
};

/**
 * Checks if a user has already been invited.
 *
 * @param {string} email - The email of the user to check.
 * @returns {Promise<boolean>} A promise that resolves to true if the user has been invited, false otherwise.
 */
export const checkInvitedStatus = async (email: string): Promise<boolean> => {
  const { data, error } = await supabase.from('invites').select('email').eq('email', email);
  return error ? false : data.length > 0;
};

/**
 * Fetches all invitees for a specific issuer.
 *
 * @param {string} issuerId - The ID of the issuer.
 * @returns {Promise<Invite[]>} A promise that resolves to an array of invites.
 * @throws {Error} If there is an error while fetching the invitees.
 */
export const getInviteesWithIssuerId = async (issuerId: string): Promise<Invite[]> => {
  const { data, error } = await supabase.from('invites').select().eq('iss', issuerId);
  if (error) {
    throw new Error(error.message);
  } else {
    return data;
  }
};
