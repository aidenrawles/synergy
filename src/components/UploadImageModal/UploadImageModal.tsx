import React, { useState, useRef } from 'react';
import supabase from '../../config/supabaseClient';
import { useAuth } from '../../Context';
import { Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from './UploadImageModal.module.scss';
import Button from '../Button/Button';
import { updateUserImg } from '../../utils/helper/userHelper';

interface UploadImageModalProps {
  isOpen: boolean;
  Close: () => void;
}

const UploadImageModal = ({ isOpen, Close }: UploadImageModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const inputFile = useRef<HTMLInputElement | null>(null);
  const { userContext } = useAuth();

  // This is for uploading files.
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const onUploadInsert = async () => {
    if (selectedFile && userContext.id) {
      const { error } = await supabase.storage.from('user').upload(`${userContext.id}/displayPic`, selectedFile, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        console.log(error?.message);
      } else {
        await updateUserImg(userContext.id);
      }
    }
  };

  const onUploadReplace = async () => {
    if (selectedFile && userContext.id) {
      const { error } = await supabase.storage.from('user').update(`${userContext.id}/displayPic`, selectedFile, {
        cacheControl: '3600',
        upsert: true,
      });
      if (error) {
        console.log(error?.message);
      } else {
        await updateUserImg(userContext.id);
      }
    }
  };

  const onUpload = async () => {
    if (!userContext.img || userContext.img.length === 0) {
      await onUploadInsert();
    } else {
      await onUploadReplace();
    }
    window.location.reload();
  };

  const handleClose = () => {
    Close();
  };

  return (
    <div>
      <Modal open={isOpen} onClose={Close} aria-labelledby='upload-image-modal' aria-describedby='image-upload'>
        <div className={styles.uploadModal}>
          <IconButton aria-label='close' onClick={handleClose} className={styles.closeButton}>
            <CloseIcon />
          </IconButton>
          <div className={styles.contentsContainer}>
            <div className={styles.header}>
              <h1>Upload Profile Image</h1>
            </div>
            <div className={styles.description}>
              <p>Upload your profile image which will be displayed for others</p>
            </div>
            <div className={styles.uploadFile}>
              <Button
                label='Upload Photo'
                className={styles.uploadButton}
                handleClick={() => inputFile.current && inputFile.current.click()}
              />
              <input type='file' accept='image/*' ref={inputFile} onChange={handleFileSelect} hidden />
              <p>{selectedFile?.name}</p>
            </div>
            <Button label='Save' className={styles.saveButton} handleClick={() => void onUpload()} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UploadImageModal;
