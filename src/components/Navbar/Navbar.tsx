import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../../config/supabaseClient';
import { useAuth } from '../../Context';
import { UserType } from '../../types/enums';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import logo from '../../assets/synergy-logo.svg';
import NotificationsIcon from '@mui/icons-material/Notifications';

import styles from './Navbar.module.scss';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import { Badge } from '@mui/material';
import { Notification } from '../../types/database-types';
import { getNotificationsWithUserId, streamNotifications } from '../../utils/helper/notificationHelper';

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showBadge, setShowBadge] = useState(false);
  const [newNotif, setNewNotif] = useState(false);
  const open = Boolean(anchorEl);
  const { userContext } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNewNotif = () => {
    setNewNotif(!newNotif);
    setShowBadge(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.log('Error logging out:', error.message);
  };

  const navTabOptions = () => {
    switch (userContext?.userType) {
      case UserType.Admin:
        return ['Dashboard', 'Invite', 'Allocations'];
      case UserType.Coordinator:
        return ['Dashboard', 'Invite', 'Projects', 'Allocations'];
      case UserType.Tutor:
        return ['Dashboard', 'Invite', 'Projects', 'Allocations'];
      case UserType.Client:
        return ['Dashboard', 'Groups'];
      default: // For students
        return ['Dashboard', 'Invite', 'Projects', 'Groups'];
    }
  };

  const navTabs = navTabOptions();

  const handleClickOutside = (event: MouseEvent) => {
    if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
      setShowNotifications(false);
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs = await getNotificationsWithUserId(userContext.id);
        if (notifs.every((notif) => notif.read)) {
          setShowBadge(false);
        } else {
          setShowBadge(true);
        }
        setNotifications(notifs);
      } catch (error) {
        console.error(error);
      }
    };

    if (userContext.id.length > 0) {
      void fetchNotifications();
      streamNotifications(userContext.id, handleNewNotif);
    }
  }, [userContext.id, newNotif]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.navWrapper}>
      <div className={styles.navSection}>
        <div className={styles.navLeft}>
          <div className={styles.synergyLogo} onClick={() => navigate('/dashboard')}>
            <img src={logo} alt='' />
            <h1>Synergy</h1>
          </div>
          {navTabs.map((tab, idx) => {
            return (
              <h2
                key={idx}
                className={pathname === `/${tab.toLowerCase()}` ? styles.activeTab : ''}
                onClick={() => navigate(`/${tab.toLowerCase()}`)}>
                {tab}
              </h2>
            );
          })}
        </div>
        <div className={styles.navRight}>
          <IconButton onClick={handleNotificationsClick}>
            <Badge
              overlap='circular'
              variant='dot'
              invisible={!showBadge}
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: 'var(--primary-purple)',
                },
              }}>
              <NotificationsIcon
                sx={{
                  color: 'var(--dark-purple)',
                }}
              />
            </Badge>
          </IconButton>
          <div className={styles.stuInfo}>
            <h3>{userContext?.firstName}</h3>
            <h5>{userContext?.userType}</h5>
          </div>
          <IconButton
            onClick={handleMenuClick}
            aria-controls={open ? 'profile-dropdown' : undefined}
            aria-haspopup='true'
            aria-expanded={open ? 'true' : undefined}>
            <Avatar src={userContext?.img} sx={{ width: 54, height: 54 }} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            id='profile-dropdown'
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                width: 140,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&::before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}>
            <MenuItem onClick={() => navigate('/profile')} className={styles.dropField}>
              <PersonIcon sx={{ color: 'var(--dark-purple)' }} /> <span>Profile</span>
            </MenuItem>
            <MenuItem onClick={() => void handleLogout()} className={styles.dropField}>
              <LogoutIcon sx={{ color: 'var(--dark-purple)' }} /> <span>Logout</span>
            </MenuItem>
          </Menu>
        </div>
      </div>
      <div ref={notificationPanelRef}>
        <NotificationPanel isVisible={showNotifications} userNotifications={notifications} />
      </div>
    </div>
  );
};

export default Navbar;
