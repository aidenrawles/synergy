import React, { useState, useEffect } from 'react';
import styles from './StudentGroups.module.scss';
import { useAuth } from '../../Context';
import CreateGroupModal from './CreateGroupModal';
import MemberAvatar from '../../components/MemberAvatar/MemberAvatar';
import { Group } from '../../types/database-types';
import AlertSlider from '../AlertSlider/AlertSlider';
import Loading from '../../pages/Loading/Loading';
import Button from '../Button/Button';
import { Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import {
  fetchGroupMembers,
  getAllGroups,
  getGroupIdWithUserId,
  getGroupWithId,
  joinGroup,
  leaveGroup,
  removeGroup,
} from '../../utils/helper/groupHelper';
import { notifyGroupMembers } from '../../utils/helper/notificationHelper';
import { getTutorialCodes } from '../../utils/helper/utilityHelper';
import { TutorialCodes } from '../../utils/helperInterface';
import GroupModal from '../../components/GroupModal/GroupModal';
const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroup, setUserGroup] = useState<Set<number>>(new Set());
  const [groupMembers, setGroupMembers] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { userContext } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [alertActive, setAlertActive] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('error');
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [filterTutorial, setFilterTutorial] = useState<string>('');
  const [tutorialOptions, setTutorialOptions] = useState<string[]>([]);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleGroupClick = (group: Group) => {
    setSelectedGroup(group);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedGroup(null);
    setModalOpen(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { group_id } = await getGroupIdWithUserId(userContext.id);
      userGroup.add(group_id);
      setUserGroup(userGroup);
    } catch (error) {
      console.error('No group found:', error);
    }

    try {
      const groups = await getAllGroups();
      const sortedGroups = groups.sort((a, b) => +userGroup.has(b.group_id) - +userGroup.has(a.group_id));
      setGroups(sortedGroups);
      const membersByGroup = await fetchGroupMembers(groups.map((g) => g.group_id));
      setGroupMembers(membersByGroup);
    } catch (error) {
      console.error('Failed to fetch group data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleJoin = async (groupId: number) => {
    setAlertActive(false);
    setAlertMessage('');

    if (userGroup.size > 0) {
      setAlertActive(true);
      setAlertMessage('You are already in a group');
      setAlertSeverity('error');
      return;
    }

    try {
      const group = await getGroupWithId(groupId);
      if (userContext.course !== group.course || userContext.tutorial !== group.tutorial) {
        setAlertMessage('Mismatch in course or tutorial.');
        setAlertSeverity('warning');
      } else {
        setAlertMessage('Joined group successfully!');
        setAlertSeverity('success');
      }

      await joinGroup(userContext.id, groupId);
      setUserGroup(new Set([groupId]));

      const members = groupMembers[groupId].filter((member) => member !== userContext.id);
      await notifyGroupMembers(members, 'A new member has joined your group.');
    } catch (error) {
      console.error(error);
    }

    setAlertActive(true);
    await fetchData();
  };

  const handleLeave = async (groupId: number) => {
    setAlertActive(false);
    setAlertMessage('');

    try {
      await leaveGroup(userContext.id, groupId);
      userGroup.delete(groupId);
      setUserGroup(new Set());
      const members = groupMembers[groupId].filter((member) => member !== userContext.id);

      if (members.length === 0) {
        await removeGroup(groupId);
        setAlertMessage('Left and deleted the group successfully!');
      } else {
        await notifyGroupMembers(members, 'A member has left your group.');
        setAlertMessage('Left group successfully!');
      }

      setAlertSeverity('success');
    } catch (error) {
      console.error(error);
    }

    setAlertActive(true);
    await fetchData(); // the member count of the group is updated in the groups table on the server side
  };

  const handleCourseChange = (event: SelectChangeEvent<string>) => {
    const selectedCourse = event.target.value;
    setFilterCourse(selectedCourse);
    setFilterTutorial('');
    if (selectedCourse) {
      getTutorialCodes()
        .then((tutorialCodes: TutorialCodes) => {
          setTutorialOptions((tutorialCodes[selectedCourse] as string[]) || []);
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      setTutorialOptions([]);
    }
  };

  const filteredGroups = groups.filter(
    (group) =>
      (filterCourse === '' || group.course === filterCourse) &&
      (filterTutorial === '' || group.tutorial === filterTutorial)
  );

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setTitle('');
    setDescription('');
    setOpen(false);
  };

  const renderGroupButtons = (group: Group) => {
    return (
      <div className={styles.joinButtonContainer}>
        {userGroup.has(group.group_id) ? (
          <Button label='Leave' handleClick={() => void handleLeave(group.group_id)} className={styles.leaveButton} />
        ) : group.capacity <= group.members_count ? (
          <Button label='Full' disabled={true} className={styles.fullButton} />
        ) : (
          <Button
            label='Join Group'
            handleClick={() => void handleJoin(group.group_id)}
            className={styles.joinButton}
          />
        )}
      </div>
    );
  };

  const renderGroupTags = (group: Group) => {
    return (
      <div className={styles.tagsContainer}>
        {group.course && (
          <Button
            label={group.course}
            disabled={true}
            className={`${styles.groupCourse} ${group.course === 'CONFLICT' ? styles.groupCourseConflict : ''}`}
          />
        )}
        {group.tutorial && (
          <Button
            label={group.tutorial}
            disabled={true}
            className={`${styles.groupTutorial} ${group.tutorial === 'CONFLICT' ? styles.groupTutorialConflict : ''}`}
          />
        )}
      </div>
    );
  };

  const renderGroupCard = (group: Group, idx: number) => {
    return (
      <div key={idx} className={styles.groupCard} onClick={() => handleGroupClick(group)}>
        <div className={styles.groupHeader}>
          {renderGroupTags(group)}
          {renderGroupButtons(group)}
        </div>
        <h1>{group.name}</h1>
        <div className={styles.groupBody}>
          <div className={styles.groupDescription}>
            <h3>{group.description}</h3>
          </div>
        </div>
        <div className={styles.groupFooter}>
          <div className={styles.memberAvatars}>
            <MemberAvatar ids={groupMembers[group.group_id] || []} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.groupsContainer}>
      <div className={styles.headerContainer}>
        <AlertSlider active={alertActive} severity={alertSeverity} errorMsg={alertMessage} setActive={setAlertActive} />
        <h1>Available Groups</h1>
      </div>
      <CreateGroupModal
        open={open}
        handleClose={handleClose}
        fetchData={fetchData}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
      />
      <GroupModal open={modalOpen} handleClose={handleModalClose} group={selectedGroup} groupMembers={groupMembers} />
      <div className={styles.filterContainer}>
        <div className={styles.filters}>
          <FormControl variant='outlined' className={styles.filter}>
            <InputLabel>Course</InputLabel>
            <Select value={filterCourse} onChange={handleCourseChange} label='Course'>
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='COMP9900'>COMP9900</MenuItem>
              <MenuItem value='COMP3900'>COMP3900</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant='outlined' className={styles.filter} disabled={!filterCourse}>
            <InputLabel>Tutorial</InputLabel>
            <Select value={filterTutorial} onChange={(e) => setFilterTutorial(e.target.value)} label='Tutorial'>
              <MenuItem value=''>All</MenuItem>
              {tutorialOptions.map((tutorial) => (
                <MenuItem key={tutorial} value={tutorial}>
                  {tutorial}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <Button
          label='Create a Group'
          labelColour='var(--primary-purple)'
          backgroundColour='var(--light-purple)'
          handleClick={() => void handleOpen()}
        />
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className={styles.groupsGrid}>
          {filteredGroups.map((group, idx) => (
            <div
              key={group.group_id}
              className={`${styles.groupCardContainer} ${userGroup.has(group.group_id) ? styles.highlightedGroupCard : ''}`}>
              {renderGroupCard(group, idx)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
