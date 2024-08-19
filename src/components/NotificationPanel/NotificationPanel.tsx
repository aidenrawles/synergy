import { useEffect, useState } from 'react';
import styles from './NotificationPanel.module.scss';
import Button from '../Button/Button';
import close from '../../assets/close.svg';
import read from '../../assets/read.svg';
import { useAuth } from '../../Context';
import { Notification } from '../../types/database-types';
import { updateUserNotifications } from '../../utils/helper/notificationHelper';

interface NotificationPanelProps {
  isVisible: boolean;
  userNotifications: Notification[];
}

const NotificationPanel = ({ isVisible, userNotifications }: NotificationPanelProps) => {
  const { userContext } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(userNotifications);
  const [edit, setEdit] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const markAllAsRead = () => {
    setNotifications((prevNotifications) => prevNotifications.map((notification) => ({ ...notification, read: true })));
    setEdit(true);
  };

  const markAsRead = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification))
    );
    setEdit(true);
  };

  const markAsUnRead = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === id ? { ...notification, read: false } : notification
      )
    );
    setEdit(true);
  };

  const removeNotification = (id: string) => {
    setNotifications((prevNotifications) => prevNotifications.filter((notification) => notification.id !== id));
    setEdit(true);
  };

  const renderNotifications = () => {
    const filteredNotifications =
      filter === 'all' ? notifications : notifications.filter((notification) => !notification.read);

    return filteredNotifications.length > 0 ? (
      filteredNotifications
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((notification) => (
          <div
            key={notification.id}
            className={styles.notificationCard}
            onClick={notification.read ? () => markAsUnRead(notification.id) : () => markAsRead(notification.id)}
            style={{ cursor: 'pointer' }}>
            <div className={styles.cardContent}>
              <span className={styles.notificationText}>
                <p>{notification.body}</p>
              </span>
              <span className={styles.notificationDate}>
                <p>{new Date(notification.created_at).toLocaleString()}</p>
              </span>
            </div>
            {!notification.read ? (
              <div className={styles.readMarker} />
            ) : (
              <div onClick={() => removeNotification(notification.id)} className={styles.closeMarker}>
                {' '}
                <img src={close} alt='close' />
              </div>
            )}
          </div>
        ))
    ) : (
      <div className={styles.noNotifications}>
        <p>All Caught Up!</p>
      </div>
    );
  };

  useEffect(() => {
    setNotifications(userNotifications);
  }, [userNotifications]);

  useEffect(() => {
    const markReadAndDelete = async () => {
      try {
        await updateUserNotifications(userContext.id, notifications);
      } catch (error) {
        console.error(error);
      }
    };

    if (edit) {
      void markReadAndDelete();
      setEdit(false);
    }
  }, [notifications]);

  return (
    <div className={`${styles.notificationPanel} ${isVisible ? styles.notificationPanelVisible : ''}`}>
      <div className={styles.panelHeader}>
        <div className={styles.headerButtons}>
          <div className={styles.filterButtons}>
            <Button
              className={styles.filterButton}
              labelColour='var(--dark-purple)'
              backgroundColour={filter !== 'all' ? 'var(--base-white)' : 'var(--light-gray)'}
              label='All'
              handleClick={() => setFilter('all')}
            />
            <Button
              className={styles.filterButton}
              labelColour='var(--dark-purple)'
              backgroundColour={filter !== 'unread' ? 'var(--base-white)' : 'var(--light-gray)'}
              label='Unread'
              handleClick={() => setFilter('unread')}
            />
          </div>
          <Button
            className={styles.actionButton}
            labelColour='var(--dark-purple)'
            icon={read}
            handleClick={markAllAsRead}
          />
        </div>
        <hr className={styles.lineBreaker} />
      </div>
      <div className={styles.notificationBody}>{renderNotifications()}</div>
    </div>
  );
};

export default NotificationPanel;
