import { useEffect, useState } from 'react';
import styles from './UserProfile.module.scss';
import UploadTranscriptModal from '../UploadTranscriptModal/UploadTranscriptModal';
import UploadImageModal from '../UploadImageModal/UploadImageModal';
import { useAuth } from '../../Context';
import { UserType } from '../../types/enums';
import { Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import profile from '../../assets/profile.svg';
import mail from '../../assets/mail.svg';
import graduation from '../../assets/graduation.png';
import hat from '../../assets/hat.svg';
import cloud from '../../assets/cloud-upload.svg';
import upload from '../../assets/upload-image.svg';
import link from '../../assets/link.svg';
import edit from '../../assets/edit.svg';
import Button from '../Button/Button';
import AlertSlider from '../AlertSlider/AlertSlider';

const UserProfile = () => {
  const navigate = useNavigate();
  const { userContext } = useAuth();
  const [copySuccess, setCopySuccess] = useState(false);
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

  const [isTranscriptUploadOpen, setTranscriptUploadOpen] = useState(false);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

  useEffect(() => {
    setUserInfo({
      nameFirst: userContext.firstName,
      nameLast: userContext.lastName,
      zId: userContext.zid,
      role: userContext.userType,
      email: userContext.email,
      img: userContext.img,
      tutorial: userContext.tutorial,
      course: userContext.course,
    });
  }, [userContext]);

  const openImageUpload = () => setIsImageUploadOpen(true);
  const closeImageUpload = () => setIsImageUploadOpen(false);

  const openTranscriptUpload = () => setTranscriptUploadOpen(true);
  const closeTranscriptUpload = () => setTranscriptUploadOpen(false);

  const handleCopyLink = async () => {
    setCopySuccess(false);
    await navigator.clipboard.writeText(`${location.href}/${userContext.id}`);
    setCopySuccess(true);
  };

  const renderAboutCard = (cardTitle: string, cardInfo: { icon: string; label: string }[]) => {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>{cardTitle}</h1>
          <Button
            backgroundColour='var(--light-purple)'
            icon={edit}
            className={styles.edit}
            handleClick={() => navigate('/profile/edit')}
          />
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

  const renderUploadCard = (cardTitle: string, cardInfo: { icon: string; label: string; onClick: () => void }[]) => {
    const inputArr = cardInfo.filter((info) => {
      return !(userInfo.role !== UserType.Student && info.label === 'Upload Transcript');
    });

    return (
      <div className={styles.card}>
        <h1>{cardTitle}</h1>
        <hr className={styles.lineBreaker} />
        {inputArr.map((info, idx) => {
          return (
            <div key={idx} className={styles.uploadButton}>
              <Button
                label={info.label}
                backgroundColour='var(--light-purple)'
                icon={info.icon}
                className={styles.upload}
                handleClick={info.onClick}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
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
            <h3>{userInfo.role}</h3>
          </div>
          <AlertSlider active={copySuccess} severity='success' errorMsg='Profile URL Copied' />
        </div>
        <UploadImageModal isOpen={isImageUploadOpen} Close={closeImageUpload} />
        <UploadTranscriptModal isOpen={isTranscriptUploadOpen} Close={closeTranscriptUpload} />
        <div className={styles.userCardDisplay}>
          {renderAboutCard('About', [
            { label: userInfo.zId, icon: profile },
            { label: userInfo.email, icon: mail },
            { label: userInfo.course, icon: graduation },
            { label: userInfo.tutorial, icon: hat },
          ])}
          {renderUploadCard('Upload Files', [
            { label: 'Upload Transcript', icon: cloud, onClick: () => openTranscriptUpload() },
            { label: 'Upload Photo', icon: upload, onClick: () => openImageUpload() },
          ])}
        </div>
      </div>
    </>
  );
};

export default UserProfile;
