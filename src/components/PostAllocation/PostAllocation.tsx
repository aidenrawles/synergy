import { useState, useEffect } from 'react';
import Button from '../../components/Button/Button';
import EditGroupModalPost from '../../components/EditGroupModal/EditGroupModalPost';
import MemberAvatar from '../../components/MemberAvatar/MemberAvatar';
import styles from './PostAllocation.module.scss';
import AlertSlider from '../AlertSlider/AlertSlider';
import { lockAllocationAlgorithm, isAlgorithmLocked } from '../../utils/helper/algorithmHelper';
import { getProjectAllocations, getUnallocated, fetchGroupMembers } from '../../utils/helper/groupHelper';
import { FormattedAllocation, FormattedUnallocated } from '../../utils/helperInterface';

type GroupType = FormattedAllocation | FormattedUnallocated;

const PostAllocation = () => {
  const [allocations, setAllocations] = useState<FormattedAllocation[]>([]);
  const [unallocated, setUnallocated] = useState<FormattedUnallocated[]>([]);
  const [groupedByProject, setGroupedByProject] = useState<Record<string, FormattedAllocation[]>>({});
  const [selectedGroup, setSelectedGroup] = useState<GroupType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<Record<number, string[]>>({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [algoLocked, setAlgoLocked] = useState(true);

  const handleConfirmAllocation = async () => {
    try {
      await lockAllocationAlgorithm();
      setSuccessMsg('Allocation confirmed, students and clients notified');
      setAlgoLocked(true);
    } catch (error) {
      setErrorMsg(`${error}`);
    }
  };

  useEffect(() => {
    const fetchAllocationStatus = async () => {
      try {
        const status = await isAlgorithmLocked();
        setAlgoLocked(status);
      } catch (error) {
        setErrorMsg(`${error}`);
      }
    };

    void fetchAllocationStatus();
  }, []);

  useEffect(() => {
    const fetchAllocations = async () => {
      const allocations = await getProjectAllocations();
      if (!('error' in allocations)) {
        setAllocations(allocations ? allocations : []);
      }
    };
    void fetchAllocations();
  }, []);

  useEffect(() => {
    const fetchUnallocated = async () => {
      const unallocated = await getUnallocated();
      if (!('error' in unallocated)) {
        setUnallocated(unallocated ? unallocated : []);
      }
    };
    void fetchUnallocated();
  }, []);

  useEffect(() => {
    const grouped = allocations.reduce(
      (acc, allocation) => {
        const key = allocation?.project_number;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(allocation);
        return acc;
      },
      {} as Record<string, FormattedAllocation[]>
    );
    setGroupedByProject(grouped);
  }, [allocations]);

  const handleGroupClick = (group: GroupType) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
  };
  // fetch from database and store group members
  useEffect(() => {
    const fetchAllGroupMembers = async () => {
      const allGroups = [...allocations, ...unallocated];
      const groupIds = allGroups.map((group) => group.group_id);
      try {
        const members = await fetchGroupMembers(groupIds);
        setGroupMembers(members);
      } catch (error) {
        console.error('Error fetching group members:', error);
      }
    };
    void fetchAllGroupMembers();
  }, [allocations, unallocated]);

  return (
    <div className={styles.allocations}>
      <AlertSlider active={errorMsg.length > 0} severity='error' errorMsg={errorMsg} />
      <AlertSlider active={successMsg.length > 0} severity='success' errorMsg={successMsg} />
      {Object.entries(groupedByProject).map(([projectNumber, allocations]) => (
        <div key={projectNumber}>
          <h1 className={styles.projectHeader}>
            Project {projectNumber} (P{projectNumber})
          </h1>
          <div className={styles.allocationSection}>
            {allocations.map((allocation) => (
              <div key={allocation.group_id} className={styles.groupCard} onClick={() => handleGroupClick(allocation)}>
                {/* This is currently hardcoded, need another one for this */}
                <Button
                  label='COMP3900'
                  backgroundColour='var(--light-purple)'
                  labelColour='var(--primary-purple)'
                  className={styles.courseTag}
                  disabled
                />
                <h2 key={allocation.group_id}>{allocation.group_name}</h2>
                <MemberAvatar ids={groupMembers[allocation.group_id] || []} />
              </div>
            ))}
            {selectedGroup && (
              <EditGroupModalPost
                open={isModalOpen}
                handleClose={handleCloseModal}
                groupId={selectedGroup.group_id}
                initialGroupTitle={selectedGroup.group_name}
              />
            )}
          </div>
        </div>
      ))}
      <div>
        <h1 className={styles.projectHeader}>Unassigned groups:</h1>
        <div className={styles.allocationSection}>
          {unallocated.map((unallocated) => (
            <div key={unallocated.group_id} className={styles.groupCard} onClick={() => handleGroupClick(unallocated)}>
              {/* This is currently hardcoded */}
              <Button
                label='COMP3900'
                backgroundColour='var(--light-purple)'
                labelColour='var(--primary-purple)'
                className={styles.courseTag}
                disabled
              />
              <h2 key={unallocated.group_id}>{unallocated.group_name}</h2>
              <MemberAvatar ids={groupMembers[unallocated.group_id] || []} />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.confirmAllocation}>
        <Button
          label={algoLocked ? 'Manual Allocation Only' : 'Confirm Allocation'}
          className={algoLocked ? styles.lockedButton : styles.confirmButton}
          disabled={algoLocked}
          handleClick={() => void handleConfirmAllocation()}
        />
        {!algoLocked && <p className={styles.warning}>WARNING: once confirmed, algorithm cannot be re-run</p>}
      </div>
    </div>
  );
};

export default PostAllocation;
