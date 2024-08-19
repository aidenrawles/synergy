// Displays User picture with link to profile
// Use with fetchGroupMembers from helpers.ts if want to show all memberavatars in a group
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@mui/material';
import styles from './MemberAvatar.module.scss';
import profile from '../../assets/profile.svg';
import { getUserDataById, getDisplayPicWithId } from '../../utils/helper/userHelper';

interface MemberAvatarProps {
  ids: string[];
  size?: number; // Add to allow users to change size of display as they like
}

// Default size 40 x 40, Change size when importing for own configuration
const MemberAvatar: React.FC<MemberAvatarProps> = ({ ids, size = 40 }) => {
  return (
    <div className={styles.avatarGroup}>
      {ids.map((id) => (
        <SingleAvatar key={id} id={id} size={size} />
      ))}
    </div>
  );
};

const SingleAvatar: React.FC<{ id: string; size: number }> = ({ id, size }) => {
  const [userName, setUserName] = useState<string>('');
  const [isHovered, setIsHovered] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    const userData = await getUserDataById(id);
    if (userData) {
      setUserName(`${userData.first_name} ${userData.last_name}`);
      const displayPic = getDisplayPicWithId(id);
      setAvatarSrc(displayPic ?? null);
    }
  }, [id]);

  useEffect(() => {
    void fetchUserData();
  }, [fetchUserData]);

  return (
    <div
      className={styles.avatarWrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <Link to={`/profile/${id}`} className={styles.avatarLink}>
        <Avatar src={avatarSrc ?? undefined} className={styles.avatarImage} sx={{ width: size, height: size }}>
          {!avatarSrc && <img src={profile} alt='Default profile' className={styles.defaultIcon} />}
        </Avatar>
      </Link>
      {isHovered && <div className={styles.nameOverlay}>{userName}</div>}
    </div>
  );
};

export default MemberAvatar;
