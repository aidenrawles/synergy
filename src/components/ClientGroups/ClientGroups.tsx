import { useState, useEffect, useRef } from 'react';
import supabase from '../../config/supabaseClient';
import { useAuth } from '../../Context';
import MemberAvatar from '../../components/MemberAvatar/MemberAvatar';

import styles from './ClientGroups.module.scss';
import { Group, GroupMembers } from '../../types/database-types';
import Button from '../Button/Button';

import download from '../../assets/download.svg';
import AlertSlider from '../AlertSlider/AlertSlider';
import { generateIndividualProjectReport, generateClientProjectsReport } from '../../utils/helper/reportHelper';

const ClientGroups = () => {
  const { userContext } = useAuth();
  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');
  const [reportErrorMsg, setReportErrorMsg] = useState('');
  const [groupMembers, setGroupMembers] = useState<Record<number, string[]>>({});
  const [groupedByProject, setGroupedByProject] = useState<Record<string, Group[]>>({});
  const isInitialMount = useRef(true);

  const generateReport = (data: string) => {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleGenerateSingleReport = async (projectNumber: string) => {
    setReportSuccessMsg('');
    setReportErrorMsg('');
    try {
      const data = await generateIndividualProjectReport('csv', projectNumber);
      generateReport(data);
      setReportSuccessMsg(`P${projectNumber} Report Exported!`);
    } catch (error) {
      setReportErrorMsg(`${error as string}`);
    }
  };

  const handleGenerateAllReports = async (clientId: string) => {
    setReportSuccessMsg('');
    setReportErrorMsg('');
    try {
      const data = await generateClientProjectsReport('csv', clientId);
      generateReport(data);
      setReportSuccessMsg('All Projects Report Exported!');
    } catch (error) {
      setReportErrorMsg(`${error as string}`);
    }
  };

  useEffect(() => {
    if (isInitialMount.current) isInitialMount.current = false;
    else {
      const fetchGroups = async () => {
        const { data: groups } = await supabase.from('groups').select().eq('client_id', userContext.id);

        if (groups) {
          setGroupsList(groups);

          // Added: Fetch group members
          const { data: membersData } = await supabase
            .from('group_members')
            .select('group_id, user_id')
            .in(
              'group_id',
              groups.map((g) => g.group_id)
            );

          const membersByGroup: Record<number, string[]> = {};
          membersData?.forEach((member: GroupMembers) => {
            if (!membersByGroup[member.group_id]) {
              membersByGroup[member.group_id] = [];
            }
            membersByGroup[member.group_id].push(member.user_id);
          });

          setGroupMembers(membersByGroup);
        }
      };
      void fetchGroups();
    }
  }, [userContext?.id]);

  useEffect(() => {
    const grouped = groupsList.reduce(
      (acc, group) => {
        const key = group.project_number!;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(group);
        return acc;
      },
      {} as Record<string, Group[]>
    );

    setGroupedByProject(grouped);
  }, [groupsList]);

  return (
    <div>
      <AlertSlider active={reportErrorMsg.length > 0} severity='error' errorMsg={reportErrorMsg} />
      <AlertSlider active={reportSuccessMsg.length > 0} severity='success' errorMsg={reportSuccessMsg} />
      <div className={styles.headerContainer}>
        <h1 className={styles.header}>Allocated groups</h1>
        <Button
          icon={download}
          className={styles.allReportButton}
          handleClick={() => void handleGenerateAllReports(userContext.id)}
        />
      </div>
      <div className={styles.groups}>
        {Object.entries(groupedByProject).map(([projectNumber, groups]) => (
          <div key={projectNumber}>
            <div className={styles.projectHeaderContainer}>
              <h1 className={styles.projectHeader}>
                Project {projectNumber} (P{projectNumber})
              </h1>
              <Button
                icon={download}
                className={styles.singleReportButton}
                handleClick={() => void handleGenerateSingleReport(projectNumber)}
              />
            </div>
            <div className={styles.groupSection}>
              {groups.map((group) => (
                <div key={group.group_id} className={styles.groupCard}>
                  {/*Style Changes made to add Members section*/}
                  <h3 className={styles.groupName}>{group.name}</h3>
                  <div className={styles.groupDescription}>
                    <p>{group.description}</p>
                  </div>
                  <div className={styles.memberSection}>
                    <h4>Members:</h4>
                    {/*Added Memberavatar */}
                    <div className={styles.memberAvatars}>
                      <MemberAvatar ids={groupMembers[group.group_id] || []} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientGroups;
