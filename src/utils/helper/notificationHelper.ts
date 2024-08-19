import supabase from '../../config/supabaseClient';
import { fetchGroupMembers } from './groupHelper';
import { NotificationAllocation, Notification as SimpleNotification } from '../helperInterface';
import { Notification } from '../../types/database-types';

/**
 * Sends notifications by inserting them into the database.
 *
 * @param {SimpleNotification[]} notifications - An array of notifications to send.
 * @returns {Promise<void>} A promise that resolves when the notifications have been sent.
 * @throws {Error} If there is an error while sending the notifications.
 */
export const sendNotifications = async (notifications: SimpleNotification[]): Promise<void> => {
  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) throw new Error(error.message);
};

/**
 * Fetches notifications for a specific user.
 *
 * @param {string} userId - The ID of the user whose notifications are to be fetched.
 * @returns {Promise<Notification[]>} A promise that resolves to an array of notifications.
 * @throws {Error} If there is an error while fetching notifications from the database.
 */
export const getNotificationsWithUserId = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId);
  if (error) throw new Error(error.message);
  return data as Notification[];
};

/**
 * Removes a notification with a specific ID.
 *
 * @param {string} notifId - The ID of the notification to be removed.
 * @returns {Promise<void>} A promise that resolves when the notification is removed.
 * @throws {Error} If there is an error while removing the notification from the database.
 */
export const removeNotificationWithId = async (notifId: string): Promise<void> => {
  const { error } = await supabase.from('notifications').delete().eq('id', notifId);
  if (error) throw new Error(error.message);
};

/**
 * Updates notifications for a specific user.
 *
 * @param {string} userId - The ID of the user whose notifications are to be updated.
 * @param {Notification[]} notifications - The updated notifications.
 * @returns {Promise<void>} A promise that resolves when the notifications are updated.
 * @throws {Error} If there is an error while updating the notifications in the database.
 */
export const updateUserNotifications = async (userId: string, notifications: Notification[]): Promise<void> => {
  const currentNotifs = await getNotificationsWithUserId(userId);
  const updatedNotifs = notifications.filter((notif) => currentNotifs.some((curr) => curr.id === notif.id));
  const deletedNotifs = currentNotifs.filter((curr) => !notifications.some((notif) => curr.id === notif.id));
  deletedNotifs.forEach((notif) => void removeNotificationWithId(notif.id));
  const { error } = await supabase
    .from('notifications')
    .upsert(updatedNotifs, { onConflict: 'id', ignoreDuplicates: false });
  if (error) throw new Error(error.message);
};

/**
 * Subscribes to notification changes for a specific user.
 *
 * @param {string} userId - The ID of the user whose notifications are to be streamed.
 * @param {() => void} handleChange - The callback function to be called when a notification change occurs.
 */
export const streamNotifications = (userId: string, handleChange: () => void) => {
  supabase
    .channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      handleChange
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      handleChange
    )
    .subscribe();
};

/**
 * Fetches the allocated groups and notifies their members.
 *
 * @returns {Promise<void>} A promise that resolves when the notifications have been sent.
 * @throws {Error} If there is an issue fetching the allocations or sending the notifications.
 */
export const notifyAllocatedGroups = async (): Promise<void> => {
  const { data, error } = await supabase
    .from('allocations')
    .select('groups (group_id, name, project_number, client_id)');
  if (error) throw new Error(error.message);

  const response = data as NotificationAllocation[];
  const groupIdToMembers = await fetchGroupMembers(response.map((group) => group.groups.group_id));
  const formattedGroups = response.map((res) => ({
    clientId: res.groups.client_id,
    members: groupIdToMembers[res.groups.group_id],
    notification: `P${res.groups.project_number} allocated to ${res.groups.name}`,
  }));

  const notifications: { user_id: string; body: string }[] = [];
  for (const group of formattedGroups) {
    if (group.members) {
      group.members.forEach((member) => notifications.push({ user_id: member, body: group.notification }));
    }
    notifications.push({ user_id: group.clientId, body: group.notification });
  }

  const { error: notifError } = await supabase.from('notifications').insert(notifications);
  if (notifError) throw new Error(notifError.message);
};

/**
 * Notifies group members by sending them notifications.
 *
 * @param {string[]} members - An array of member IDs to notify.
 * @param {string} body - The body of the notification message.
 * @returns {Promise<void>} A promise that resolves when the notifications have been sent.
 * @throws {Error} If there is an error while sending the notifications.
 */
export const notifyGroupMembers = async (members: string[], body: string): Promise<void> => {
  const notifications = members.map((member) => {
    return { user_id: member, body } as SimpleNotification;
  });
  await sendNotifications(notifications);
};
