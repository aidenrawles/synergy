import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context';
import InviteStatus from '../InviteStatus/InviteStatus';
import styles from './CoordinatorDashboard.module.scss';
import graduationIcon from '../../assets/purple-graduation.svg';
import allocationsIcon from '../../assets/purple-allocation.svg';
import supabase from '../../config/supabaseClient';
import Button from '../../components/Button/Button';
import { useNavigate } from 'react-router-dom';
import AlertSlider from '../AlertSlider/AlertSlider';
import { getAlgorithmLastRun, isAlgorithmLocked, runAllocationAlgorithm } from '../../utils/helper/algorithmHelper';
import { generateAllocationReport } from '../../utils/helper/reportHelper';
import { fetchClassData } from '../../utils/helper/utilityHelper';

const CoordinatorDashboard: React.FC = () => {
  const { userContext } = useAuth();
  const currDate = new Date();
  const navigate = useNavigate();
  const [allocatedGroupsCount, setAllocatedGroupsCount] = useState<number>(0);
  const [totalGroupsCount, settotalGroupsCount] = useState<number>(0);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [allocationRun, setAllocationRun] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isAlgoLocked, setIsAlgoLocked] = useState(true);

  const formattedCurrDate = currDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const fetchGroupCounts = async () => {
    const { count: allocatedCount, error: allocatedError } = await supabase
      .from('allocations')
      .select('*', { count: 'exact' });

    if (allocatedError) {
      console.error('Error fetching allocated groups count:', allocatedError);
      setErrorMsg('Error fetching allocated groups count');
    } else {
      setAllocatedGroupsCount(allocatedCount ?? 0);
      if (allocatedCount && allocatedCount > 0) {
        setAllocationRun(true);
      }
    }

    const { count: totalGroupsCount, error: totalGroupsError } = await supabase
      .from('groups')
      .select('*', { count: 'exact' });

    if (totalGroupsError) {
      console.error('Error fetching totalGroups groups count:', totalGroupsError);
      setErrorMsg('Error fetching totalGroups groups count');
    } else {
      settotalGroupsCount(totalGroupsCount ?? 0);
    }

    return { allocatedCount, totalGroupsCount };
  };

  const fetchLastRun = async () => {
    try {
      const time = await getAlgorithmLastRun();
      setLastRunTime(time);
    } catch (error) {
      setErrorMsg(`${error}`);
    }
  };

  const fetchAlgoStatus = async () => {
    try {
      const locked = await isAlgorithmLocked();
      setIsAlgoLocked(locked);
    } catch (error) {
      setErrorMsg(`${error}`);
    }
  };

  useEffect(() => {
    void fetchGroupCounts();
    void fetchLastRun();
    void fetchAlgoStatus();
  }, []);

  const handleRun = async () => {
    setIsAllocating(true);
    setAllocationRun(true);
    setErrorMsg('');
    setSuccessMsg('');
    setInfoMsg('');
    setSuccessMsg('Starting allocation process...');

    try {
      const lastRun = await runAllocationAlgorithm();
      setLastRunTime(lastRun);
      const { allocatedCount, totalGroupsCount } = await fetchGroupCounts();
      if (allocatedCount === totalGroupsCount) {
        setSuccessMsg('Allocation completed successfully! All groups allocated.');
      } else {
        setInfoMsg('Allocation task ran but not all groups were allocated.');
      }
    } catch (error) {
      console.error('Error calling edge function:', error);
      setErrorMsg(`${error}`);
      setSuccessMsg('');
    } finally {
      setIsAllocating(false);
    }
  };

  const handleViewAllGroups = () => {
    navigate('/allocations');
  };

  const getAllocationStatus = () => {
    if (!allocationRun) return 'Pending';
    const totalGroups = allocatedGroupsCount + totalGroupsCount;
    if (totalGroups === 0) return 'Incomplete';
    return totalGroupsCount === 0 ? 'Complete' : isAlgoLocked ? 'Confirmed' : 'Incomplete';
  };

  const handleRunFetchClass = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const tutorials = await fetchClassData();
      const { error } = await supabase.from('class_data').delete().neq('course_code', 'dummy');
      if (error) {
        throw error;
      }

      const dataToInsert: { course_code: string; tutorial_code: string }[] = Object.entries(tutorials).flatMap(
        ([courseCode, tutorialCodes]: [string, string[]]) =>
          tutorialCodes.map((tutorialCode: string) => ({
            course_code: courseCode,
            tutorial_code: tutorialCode,
          }))
      );

      const { error: insertError } = await supabase.from('class_data').insert(dataToInsert);

      if (insertError) {
        throw insertError;
      }
      setSuccessMsg('Class data fetched and imported successfully!');
    } catch (error) {
      console.error('Error importing tutorial codes:', error);
      setErrorMsg('Error importing tutorial codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await generateAllocationReport('csv');
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'allocation_report.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMsg('Allocation Report Exported!');
    } catch (error) {
      setErrorMsg(`${error as string}`);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <AlertSlider active={errorMsg.length > 0} severity='error' errorMsg={errorMsg} />
      <AlertSlider active={successMsg.length > 0} severity='success' errorMsg={successMsg} />
      <AlertSlider active={infoMsg.length > 0} severity='info' errorMsg={infoMsg} />
      <h2 className={styles.date}>{formattedCurrDate}</h2>
      <h1 className={styles.header}>Welcome back, {userContext?.firstName}</h1>

      <div className={styles.boxesContainer}>
        <div className={styles.largeBox}>
          <h1 className={styles.sectionHeader}>Scheduled run tasks:</h1>
          <hr className={styles.lineBreaker} />
          <div className={styles.tasksContainer}>
            <div className={styles.projAllocation}>
              <div className={styles.taskColumn}>
                <h3 className={styles.taskTitle}>Project Allocation</h3>
                <p className={styles.taskSubheading}>Last Run: {lastRunTime ? lastRunTime : ''}</p>
              </div>
              <div className={styles.primaryButton}>
                <Button
                  label={isAllocating ? 'Allocating...' : isAlgoLocked ? 'Allocation Confirmed' : 'Run Allocation'}
                  handleClick={() => void handleRun()}
                  className={isAlgoLocked ? styles.lockedButton : styles.runButton}
                  backgroundColour='var(--light-green)'
                  labelColour='var(--primary-green)'
                  disabled={isAllocating || isAlgoLocked}
                />
              </div>
            </div>
            <div className={styles.otherTasks}>
              <div className={styles.secondaryButton}>
                <Button
                  label='Fetch Class Data'
                  handleClick={() => {
                    void handleRunFetchClass();
                  }}
                  className={styles.runFetchClassButton}
                />
                <Button
                  label='Generate Report'
                  handleClick={() => void handleGenerateReport()}
                  className={styles.generateReportButton}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.smallBox}>
          <div className={styles.groupIconWrapper}>
            <img src={allocationsIcon} alt='Allocations icon' className={styles.groupIcon} />
          </div>
          <div className={styles.viewAllGroups}>
            <h3>Allocations</h3>
          </div>
          <h2 className={`${styles.boxContent} ${styles[getAllocationStatus().toLowerCase()]}`}>
            {getAllocationStatus()}
            {totalGroupsCount !== 0 ? (
              <p>Note: some groups are unallocated</p>
            ) : !isAlgoLocked ? (
              <p>Awaiting confirmation</p>
            ) : (
              <></>
            )}
          </h2>
        </div>

        <div className={styles.smallBox}>
          <div className={styles.groupIconWrapper}>
            <img src={graduationIcon} alt='Groups icon' className={styles.groupIcon} />
          </div>
          <div className={styles.viewAllGroups} onClick={handleViewAllGroups}>
            <h3>View all groups</h3>
          </div>
          <div>
            <h2>
              {allocatedGroupsCount}/{totalGroupsCount} allocated
            </h2>
          </div>
        </div>
      </div>

      <InviteStatus />
    </div>
  );
};

export default CoordinatorDashboard;
