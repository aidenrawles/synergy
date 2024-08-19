import { useState, useEffect } from 'react';
import { UserType } from '../../types/enums';
import { useAuth } from '../../Context';
import supabase from '../../config/supabaseClient';
import { Group } from '../../types/database-types';
import Error from '../../pages/Error/Error';
import Button from '../../components/Button/Button';
import bin from '../../assets/bin.svg';
import edit from '../../assets/edit.svg';
import AlertSlider from '../../components/AlertSlider/AlertSlider';
import EditGroupModal from '../../components/EditGroupModal/EditGroupModal';
import MemberAvatar from '../../components/MemberAvatar/MemberAvatar';

import styles from './PreAllocation.module.scss';
import { fetchGroupMembers, getAllGroups } from '../../utils/helper/groupHelper';

const PreAllocation = () => {
  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [showGroupListError, setGroupsListError] = useState(false);
  const [onRemove, setOnRemove] = useState(false);
  const [removeSuccess, setRemoveSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<Record<number, string[]>>({});
  const { userContext } = useAuth();

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('groups').delete().eq('group_id', id);
    if (error) {
      console.error('Failed to remove group:', error);
      setRemoveSuccess(false);
    } else {
      setRemoveSuccess(true);
    }
    setOnRemove(true);
  };

  const handleEdit = (group: Group) => {
    setShowModal(true);
    setSelectedGroup(group);
  };

  useEffect(() => {
    const fetchGroups = async () => {
      const groups = await getAllGroups();
      if (!('error' in groups)) setGroupsList(typeof groups === 'object' ? groups : []);
      else setGroupsListError(true);
    };
    void fetchGroups();
    setOnRemove(false);
  }, [userContext?.id, onRemove]);

  useEffect(() => {
    const fetchAllGroupMembers = async () => {
      const groupIds = groupsList.map((group) => group.group_id);
      try {
        const members = await fetchGroupMembers(groupIds);
        setGroupMembers(members);
      } catch (error) {
        console.error('Error fetching group members:', error);
      }
    };
    void fetchAllGroupMembers();
  }, [groupsList]);

  const renderGroupCard = (group: Group, idx: number) => {
    return (
      <div className={styles.groupCard} key={idx}>
        <h1>{group.name}</h1>
        <h2>Description:</h2>
        <div className={styles.descContainer}>
          <h2 className={styles.desc}>{group.description}</h2>
        </div>
        <h3>
          <span>Capacity:</span> {group.members_count}/{group.capacity}
        </h3>
        <div className={styles.memberAvatarContainer}>
          <MemberAvatar ids={groupMembers[group.group_id] || []} />
        </div>
        <div className={styles.btnContainer}>
          <Button
            icon={bin}
            backgroundColour='var(--light-purple)'
            className={styles.btn}
            handleClick={() => void handleDelete(group.group_id)}
          />
          <Button
            icon={edit}
            backgroundColour='var(--light-purple)'
            handleClick={() => handleEdit(group)}
            className={styles.btn}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      {userContext?.userType === UserType.Tutor ||
      userContext?.userType === UserType.Coordinator ||
      userContext?.userType === UserType.Admin ? (
        <div>
          {showModal && selectedGroup && (
            <EditGroupModal
              open={showModal}
              handleClose={() => setShowModal(false)}
              groupId={selectedGroup.group_id}
              initialGroupTitle={selectedGroup.name}
            />
          )}
          {
            <AlertSlider
              active={showGroupListError}
              severity='error'
              errorMsg='Error fetching groups!'
              setActive={setGroupsListError}
            />
          }
          {
            <AlertSlider
              active={onRemove}
              severity={removeSuccess ? 'success' : 'error'}
              errorMsg={removeSuccess ? 'Group removed!' : 'Error removing group!'}
              setActive={setOnRemove}
            />
          }
          {groupsList.length > 0 && (
            <div className={styles.groupsList}>{groupsList.map((group, idx) => renderGroupCard(group, idx))}</div>
          )}
        </div>
      ) : (
        <Error />
      )}
    </div>
  );
};

export default PreAllocation;
