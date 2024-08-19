import React, { useEffect, useState } from 'react';
import { Modal, Box, TextField, IconButton, Avatar } from '@mui/material';
import supabase from '../../config/supabaseClient';
import CustomButton from '../../components/Button/Button';
import CloseIcon from '@mui/icons-material/Close';
import styles from './EditGroupModal.module.scss';
import { User } from '../../types/database-types';
import { Link } from 'react-router-dom';
import { getUsersDataByIds } from '../../utils/helper/userHelper';

interface GroupMember {
  auth_id: string;
  id: string;
  first_name: string;
  last_name: string;
  zid: string;
  email: string;
  img: string;
}

interface EditGroupModalProps {
  open: boolean;
  handleClose: () => void;
  groupId: number;
  initialGroupTitle: string;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({ open, handleClose, groupId }) => {
  const [groupTitle, setGroupTitle] = useState<string>('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [newMember, setNewMember] = useState<string>('');

  useEffect(() => {
    if (groupId) {
      const fetchGroupDetails = async () => {
        try {
          const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .select('name')
            .eq('group_id', groupId)
            .single();

          if (groupError) {
            console.error('Error fetching group details:', groupError);
            return;
          }

          const { data: membersData, error: membersError } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', groupId);

          if (membersError) {
            console.error('Error fetching group members:', membersError);
            return;
          }

          const userIds = membersData?.map((member: { user_id: string }) => member.user_id) || [];
          const usersData = await getUsersDataByIds(userIds);

          const groupMembers: GroupMember[] = usersData.map((user: User) => ({
            auth_id: user.auth_id,
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            zid: user.zid,
            email: user.email,
            img: user.img,
          }));

          setGroupTitle(groupData?.name || '');
          setMembers(groupMembers);
        } catch (error) {
          console.error('Error in fetchGroupDetails:', error);
        }
      };

      fetchGroupDetails().catch((error) => console.error('Error fetching group details:', error));
    }
  }, [groupId]);

  const handleRemoveMember = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', userId)
        .single();

      if (userError ?? !userData) {
        console.error('Error fetching user auth_id:', userError);
        return;
      }

      const authId = userData.auth_id;

      const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', authId);

      if (error) {
        console.error('Error removing member:', error);
        return;
      }

      setMembers(members.filter((member) => member.id !== userId));
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleAddMember = async () => {
    try {
      if (members.length >= 6) {
        alert('Group already has 6 members. Cannot add more.');
        return;
      }
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, auth_id, first_name, last_name, zid, email, img')
        .eq('zid', newMember)
        .single();

      if (userError ?? !userData) {
        console.error('Error finding user:', userError);
        return;
      }

      const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: userData.auth_id });

      if (error) {
        console.error('Error adding member:', error);
        return;
      }

      setMembers([
        ...members,
        {
          auth_id: userData.auth_id,
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          zid: userData.zid,
          img: userData.img,
        },
      ]);

      setNewMember('');
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('groups').update({ name: groupTitle }).eq('group_id', groupId);

      if (error) {
        console.error('Error saving group title:', error);
        return;
      }

      handleClose();
    } catch (error) {
      console.error('Error saving group title:', error);
    }
    window.location.reload();
  };

  const handleModalClose = () => {
    handleClose();
    window.location.reload();
  };

  return (
    <Modal open={open} onClose={handleModalClose} aria-labelledby='edit-group-modal' aria-describedby='edit-group-form'>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '85%',
          height: '95%',
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          borderRadius: 2,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}>
        <IconButton
          aria-label='close'
          onClick={handleModalClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'black',
            fontSize: 40,
            '& svg': {
              fill: 'currentcolor',
              strokeWidth: '2',
              stroke: 'currentcolor',
            },
          }}>
          <CloseIcon fontSize='inherit' />
        </IconButton>
        <div className={styles.header}>
          <h1>Title:</h1>
          <TextField
            margin='normal'
            required
            fullWidth
            id='title'
            // label="Title"
            name='title'
            autoComplete='title'
            autoFocus
            value={groupTitle}
            variant='outlined'
            onChange={(e) => setGroupTitle(e.target.value)}
            placeholder='Enter Title of Group'
            sx={{ marginBottom: 5, backgroundColor: '#f9f9f9', width: '95%' }}
            InputProps={{
              sx: { border: '1px solid #ccc', borderRadius: '4px', fontSize: '1.6rem', color: '#787486' },
            }}
          />
        </div>
        <div className={styles.header}>
          <h1>Members:</h1>
          <div className={styles.addMemberSection}>
            <TextField
              margin='normal'
              required
              fullWidth
              id='newMember'
              // label="New Member zID"
              name='newMember'
              autoComplete='newMember'
              value={newMember}
              variant='outlined'
              onChange={(e) => setNewMember(e.target.value)}
              placeholder='Enter zID'
              sx={{ backgroundColor: '#f9f9f9' }}
              InputProps={{
                sx: { border: '1px solid #ccc', borderRadius: '4px' },
              }}
            />
            <CustomButton
              label='Add member'
              labelColour='#5030e5'
              backgroundColour='#d4cef2'
              handleClick={() => void handleAddMember()}
              className={styles.memberButtonWrapper}
            />
          </div>
        </div>
        <div className={styles.rowNames}>
          <h3>Member</h3>
          <h3>zID</h3>
          <h3>Email</h3>
          <h3></h3>
        </div>
        <div className={styles.membersList}>
          {members.map((member) => (
            <div key={member.id} className={styles.memberRow}>
              <div className={styles.memberInfo}>
                <Link to={`/profile/${member.auth_id}`}>
                  <Avatar src={member.img} alt={member.first_name} />
                </Link>
                <h4>
                  {member.first_name} {member.last_name}
                </h4>
              </div>
              <h4>{member.zid}</h4>
              <h4>{member.email}</h4>
              <CustomButton
                label='Remove member'
                labelColour='#5030e5'
                backgroundColour='#d4cef2'
                handleClick={() => void handleRemoveMember(member.id)}
                className={styles.memberButtonWrapper}
              />
            </div>
          ))}
        </div>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
          <CustomButton
            label='Save'
            labelColour='#5030E5'
            backgroundColour='#F1EFFD'
            handleClick={() => void handleSave()}
          />
        </Box>
      </Box>
    </Modal>
  );
};

export default EditGroupModal;
