import { useEffect, useState } from 'react';
import styles from './StudentProfile.module.scss';
import { UserType } from '../../types/enums';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Avatar } from '@mui/material';
import profile from '../../assets/profile.svg';
import mail from '../../assets/mail.svg';
import graduation from '../../assets/graduation.png';
import hat from '../../assets/hat.svg';
import { useAuth } from '../../Context';
import Button from '../Button/Button';
import link from '../../assets/link.svg';
import download from '../../assets/download.svg';
import AlertSlider from '../AlertSlider/AlertSlider';
import { Tag } from '../../types/database-types';
import { useNavigate } from 'react-router-dom';
import Loading from '../../pages/Loading/Loading';
import { StudentProfileAllocation } from '../../utils/helperInterface';
import { generateIndividualReport, generateIndividualGroupReport } from '../../utils/helper/reportHelper';
import { getUserDataById } from '../../utils/helper/userHelper';
import { convertRatingsToTags, updateRole, convertRoleToUserType } from '../../utils/helper/utilityHelper';
import {
  getIndividualRatings,
  getGroupRatingsWithUserId,
  getAllocationWithUserId,
} from '../../utils/helper/algorithmHelper';

interface StudentProfileProps {
  id: string;
}

interface CardInfo {
  label: string;
  icon?: string;
  value?: string;
}

const StudentProfile = ({ id }: StudentProfileProps) => {
  const navigate = useNavigate();
  const { userContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');
  const [reportErrorMsg, setReportErrorMsg] = useState('');
  const [rating, setRating] = useState<Tag[]>(convertRatingsToTags({}));
  const [userInfo, setUserInfo] = useState({
    nameFirst: '',
    nameLast: '',
    zId: '',
    role: UserType.Student,
    email: '',
    img: '',
    tutorial: '',
    course: '',
  });
  const [selectedRole, setSelectedRole] = useState<UserType>(UserType.Student);
  const [allocation, setAllocation] = useState<StudentProfileAllocation>({
    groupName: '',
    allocatedProject: '',
    teamScore: convertRatingsToTags({}),
  });

  const handleCopyLink = async () => {
    setCopySuccess(false);
    await navigator.clipboard.writeText(location.href);
    setCopySuccess(true);
  };

  const downloadReport = (data: string) => {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userInfo.zId}_report.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleIndividualReport = async (data: Tag[]) => {
    setReportSuccessMsg('');
    setReportErrorMsg('');
    try {
      const res = await generateIndividualReport('csv', userInfo.zId, data);
      downloadReport(res);
      setReportSuccessMsg('Individual Report Exported!');
    } catch (error) {
      setReportErrorMsg(`${error as string}`);
    }
  };

  const handleGroupReport = async (data: StudentProfileAllocation) => {
    setReportSuccessMsg('');
    setReportErrorMsg('');
    try {
      const res = await generateIndividualGroupReport('csv', userInfo.zId, data);
      downloadReport(res);
      setReportSuccessMsg('Allocation Report Exported!');
    } catch (error) {
      setReportErrorMsg(`${error as string}`);
    }
  };

  const handleRoleChange = async (event: SelectChangeEvent<UserType>): Promise<void> => {
    const newRole = event.target.value as UserType;
    setSelectedRole(newRole);
    try {
      await updateRole(userInfo.email, userInfo.role, newRole);
      setUserInfo((prevState) => ({ ...prevState, role: newRole }));
      window.location.reload();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const renderAboutCard = (cardTitle: string, cardInfo: CardInfo[]) => {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>{cardTitle}</h1>
        </div>
        <hr className={styles.lineBreaker} />
        {cardInfo
          .filter((info) => info.label.length > 0)
          .map((info, idx) => {
            return (
              <div key={idx} className={styles.entry}>
                <div className={styles.icon}>
                  {info.icon && <img src={info.icon} alt={info.icon + ' icon'} />}
                  <div>{info.label}</div>
                </div>
              </div>
            );
          })}
      </div>
    );
  };

  const renderTags = (tags: Tag[]) => {
    const result = tags.map(({ tag, weight }, idx) => {
      return (
        <div key={idx} className={styles.ratings}>
          <div className={styles.ratingNumber}>
            <span className={styles.index}>
              <span>{idx + 1}</span>
            </span>
            <div className={styles.tag}>
              <p>{tag}:</p>
            </div>
            <span className={styles.ratingValue}>{weight}</span>
            <span>/5</span>
          </div>
        </div>
      );
    });
    return result ? result : <></>;
  };

  const renderIndividualScoresCard = (cardTitle: string, individual: Tag[]) => {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>{cardTitle}</h1>
          <Button
            backgroundColour='var(--light-purple)'
            icon={download}
            className={styles.downloadButton}
            handleClick={() => void handleIndividualReport(individual)}
          />
        </div>

        <hr className={styles.lineBreaker} />
        <div className={styles.scores}>{renderTags(individual)}</div>
      </div>
    );
  };

  const renderAllocationResultCard = (cardTitle: string, allocation: StudentProfileAllocation) => {
    const cardInfo = [
      { title: 'Group name:', value: allocation.groupName },
      { title: 'Allocated Project:', value: allocation.allocatedProject },
    ];
    return allocation.groupName.length === 0 ? (
      <></>
    ) : (
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>{cardTitle}</h1>
          <Button
            backgroundColour='var(--light-purple)'
            icon={download}
            className={styles.downloadButton}
            handleClick={() => void handleGroupReport(allocation)}
          />
        </div>
        <hr className={styles.lineBreaker} />
        {cardInfo.map((info, idx) => {
          return (
            <div key={idx} className={styles.entry}>
              <p>{info.title}</p>
              <p className={styles.entryValue}>{info.value}</p>
            </div>
          );
        })}
        <div className={styles.scores}>{renderTags(allocation.teamScore)}</div>
      </div>
    );
  };

  useEffect(() => {
    setLoading(true);
    const fetchUserData = async (id: string) => {
      try {
        const userData = await getUserDataById(id);
        const currentRole = convertRoleToUserType(userData.role);
        setUserInfo({
          nameFirst: userData.first_name,
          nameLast: userData.last_name,
          zId: userData.zid,
          role: convertRoleToUserType(userData.role),
          email: userData.email,
          img: userData.img,
          tutorial: userData.tutorial,
          course: userData.class,
        });
        setSelectedRole(currentRole);
      } catch (error) {
        console.error(error);
        navigate('/404');
      }

      try {
        const individualRatings = await getIndividualRatings(id);
        const groupRatings = await getGroupRatingsWithUserId(id);
        const groupAllocation = await getAllocationWithUserId(id);
        setRating(individualRatings);
        setAllocation({ ...groupAllocation, teamScore: groupRatings });
      } catch (error) {
        setRating([]);
        setAllocation({ groupName: 'Unallocated', allocatedProject: 'Unallocated', teamScore: [] });
      }
    };

    void fetchUserData(id);
    setLoading(false);
  }, [id, navigate]);

  return loading ? (
    <Loading />
  ) : (
    <>
      <div className={styles.userProfileContainer}>
        <div className={styles.userDisplay}>
          <Avatar src={userInfo.img} sx={{ width: 216, height: 216 }} />
          <div className={styles.userDisplayContent}>
            <div className={styles.userName}>
              <h1>{userInfo.nameFirst + ' ' + userInfo.nameLast}</h1>
              <Button
                backgroundColour='var(--light-purple)'
                icon={link}
                className={styles.linkButton}
                handleClick={() => void handleCopyLink()}
              />
            </div>
            {userContext.userType === UserType.Admin ? (
              <FormControl fullWidth sx={{ maxWidth: 135 }}>
                <InputLabel id='role-select-label'>Role</InputLabel>
                <Select
                  labelId='role-select-label'
                  id='role-select'
                  value={selectedRole}
                  label='Role'
                  onChange={(event) => {
                    void handleRoleChange(event);
                  }}
                  required>
                  {Object.keys(UserType)
                    .filter((role) => role !== 'Admin')
                    .map((role, idx) => (
                      <MenuItem key={idx} value={UserType[role as keyof typeof UserType]}>
                        {role}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            ) : (
              <h3>{userInfo.role}</h3>
            )}
          </div>
          <AlertSlider active={reportErrorMsg.length > 0} severity='error' errorMsg={reportErrorMsg} />
          <AlertSlider active={reportSuccessMsg.length > 0} severity='success' errorMsg={reportSuccessMsg} />
          <AlertSlider active={copySuccess} severity='success' errorMsg='Profile URL Copied' />
        </div>
        <div className={styles.userCardDisplay}>
          {renderAboutCard('About', [
            { label: userInfo.zId, icon: profile },
            { label: userInfo.email, icon: mail },
            { label: userInfo.course, icon: graduation },
            { label: userInfo.tutorial, icon: hat },
          ])}
          {[UserType.Coordinator, UserType.Tutor, UserType.Admin].includes(userContext.userType) &&
            userInfo.role === UserType.Student && (
              <>
                {rating.length > 0 ? renderIndividualScoresCard('Individual', rating) : <></>}
                {renderAllocationResultCard('Allocation', allocation)}
              </>
            )}
        </div>
      </div>
    </>
  );
};

export default StudentProfile;
