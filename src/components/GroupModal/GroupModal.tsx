import React from 'react';
import { Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from './GroupModal.module.scss';
import { Group } from '../../types/database-types';
import MemberAvatar from '../../components/MemberAvatar/MemberAvatar';

interface GroupModalProps {
  open: boolean;
  handleClose: () => void;
  group: Group | null;
  groupMembers: Record<number, string[]>;
}

const GroupModal: React.FC<GroupModalProps> = ({ open, handleClose, group, groupMembers }) => {
  if (!group) return null;

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby='group-modal' aria-describedby='group-details'>
      <div className={styles.groupForm}>
        <IconButton aria-label='close' onClick={handleClose} className={styles.closeButton}>
          <CloseIcon />
        </IconButton>

        <div className={styles.groupHeader}>
          <div className={styles.title}>
            <h1>
              Group {group.group_id}: {group.name}
            </h1>
          </div>
        </div>

        <div className={styles.tags}>
          <div className={styles.desc}>
            <div className={styles.labelField}>
              <label>Description</label>
            </div>
            <p>{group.description}</p>
          </div>
        </div>

        <div className={styles.tags}>
          <div className={styles.desc}>
            <div className={styles.labelField}>
              <label>Course</label>
            </div>
            <p>{group.course}</p>
          </div>
        </div>

        <div className={styles.tags}>
          <div className={styles.desc}>
            <div className={styles.labelField}>
              <label>Tutorial</label>
            </div>
            <p>{group.tutorial}</p>
          </div>
        </div>

        <div className={styles.tags}>
          <div className={styles.desc}>
            <div className={styles.labelField}>
              <label>Members</label>
            </div>
            <div className={styles.memberAvatars}>
              <MemberAvatar ids={groupMembers[group.group_id] || []} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default GroupModal;
