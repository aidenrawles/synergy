import React, { useState } from 'react';
import { Modal, TextField, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Button from '../../components/Button/Button';
import { useAuth } from '../../Context';
import AlertSlider from '../AlertSlider/AlertSlider';

import styles from './CreateGroupModal.module.scss';
import { getGroupIdWithUserId, insertGroups, joinGroup } from '../../utils/helper/groupHelper';

interface Props {
  open: boolean;
  handleClose: () => void;
  fetchData: () => Promise<void>;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
}

const CreateGroupModal: React.FC<Props> = ({
  open,
  handleClose,
  fetchData,
  title,
  setTitle,
  description,
  setDescription,
}) => {
  const { userContext } = useAuth();
  const [alertActive, setAlertActive] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('error');
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const handleCreateGroup = async () => {
    if (!title || !description) {
      setAlertMessage('All fields are required.');
      setAlertSeverity('error');
      setAlertActive(true);
      return;
    }

    try {
      await getGroupIdWithUserId(userContext.id);
      setAlertMessage('Already in a group.');
      setAlertSeverity('error');
      setAlertActive(true);
      return;
    } catch (error) {
      // All good
    }

    try {
      const group = [{ name: title, description, capacity: 6, members_count: 0 }];
      const groupId = await insertGroups(group);
      await joinGroup(userContext.id, groupId);

      setAlertMessage('Group created successfully and you have been added as a member!');
      setAlertSeverity('success');
    } catch (error) {
      setAlertMessage(`${error}`);
      setAlertSeverity('error');
    }

    setAlertActive(true);
    await fetchData();
    handleClose();
  };

  const handleSubmit = () => {
    handleCreateGroup().catch((error) => {
      console.error('Failed to create group:', error);
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby='create-group-modal'
      aria-describedby='create-group-form'
      role='dialog'>
      <div className={styles.createForm}>
        <AlertSlider active={alertActive} severity={alertSeverity} errorMsg={alertMessage} setActive={setAlertActive} />
        <IconButton aria-label='close' onClick={handleClose} className={styles.closeButton}>
          <CloseIcon />
        </IconButton>
        <div className={styles.title}>
          <h1>Title</h1>
          <TextField
            margin='none'
            required
            fullWidth
            id='title'
            label='Title'
            name='title'
            autoComplete='title'
            autoFocus
            value={title}
            variant='outlined'
            onChange={handleTitleChange}
            placeholder='Enter group title'
            sx={{ backgroundColor: 'var(--light-gray)' }}
          />
        </div>
        <div className={styles.description}>
          <h1>Description</h1>
          <TextField
            margin='none'
            required
            fullWidth
            id='description'
            label='Description'
            name='description'
            autoComplete='description'
            value={description}
            onChange={handleDescriptionChange}
            placeholder='Enter group description'
            sx={{ backgroundColor: 'var(--light-gray)', marginBottom: 2 }}
            multiline
            rows={4}
          />
        </div>
        <div className={styles.formSubmit}>
          <Button label='Create Group' handleClick={handleSubmit} className={styles.submitButton} />
        </div>
      </div>
    </Modal>
  );
};

export default CreateGroupModal;
