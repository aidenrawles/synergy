import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../Context';
import { useNavigate } from 'react-router-dom';
import { Invite } from '../../types/database-types';
import Button from '../Button/Button';
import { Avatar } from '@mui/material';
import add from '../../assets/purple-add.svg';

import styles from './InviteStatus.module.scss';
import { getInviteesWithIssuerId } from '../../utils/auth';

const InviteStatus = () => {
  const { userContext } = useAuth();
  const navigate = useNavigate();
  const isInitialMount = useRef(true);
  const [inviteesList, setInviteesList] = useState<Invite[]>([]);

  useEffect(() => {
    // Check if values from initial context have been changedd
    if (isInitialMount.current) isInitialMount.current = false;
    else {
      const fetchInvitees = async () => {
        const invitees = await getInviteesWithIssuerId(userContext.id);
        if (!('error' in invitees)) {
          setInviteesList(invitees ? invitees : []);
        }
      };
      if (userContext?.id) void fetchInvitees();
    }
  }, [userContext?.id]);

  const renderInviteeRows = (idx: number, invitee: Invite) => {
    return (
      <div key={idx} className={styles.inviteeInfo}>
        <div className={styles.user}>
          <Avatar />
          <h4>{invitee.email}</h4>
        </div>
        <h4>{invitee.email}</h4>
        <h4>{invitee.role}</h4>
        <div className={invitee?.accepted ? styles.acceptedTag : styles.pendingTag}>
          {invitee?.accepted ? 'Accepted' : 'Pending'}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.inviteStatusWrapper}>
      <div className={styles.header}>
        <h1>Invite statuses:</h1>
        <Button backgroundColour='var(--light-purple)' handleClick={() => navigate('/invite')} icon={add} />
      </div>
      <hr className={styles.lineBreaker} />
      {inviteesList.length > 0 ? (
        <div className={styles.rowNames}>
          <h3 className={styles.userHeading}>User</h3>
          <h3>Email</h3>
          <h3>Role</h3>
          <h3>Status</h3>
        </div>
      ) : (
        <h1 className={styles.noInvitesDisclaimer}>No invites yet!</h1>
      )}
      {inviteesList.map((invitee, idx) => renderInviteeRows(idx, invitee))}
    </div>
  );
};

export default InviteStatus;
