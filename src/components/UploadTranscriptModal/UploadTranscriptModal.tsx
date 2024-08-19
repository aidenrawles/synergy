import React, { useState, useRef } from 'react';
import { Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import supabase from '../../config/supabaseClient';
import { useAuth } from '../../Context';
import styles from './UploadTranscriptModal.module.scss';
import Button from '../Button/Button';

interface UploadTranscriptModalProps {
  isOpen: boolean;
  Close: () => void;
}

const UploadTranscriptModal = ({ isOpen, Close }: UploadTranscriptModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const inputFile = useRef<HTMLInputElement | null>(null);
  const { userContext } = useAuth();

  const handleClose = () => {
    setSelectedFile(undefined);
    Close();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const onUpload = async () => {
    if (selectedFile && userContext.id) {
      const { error } = await supabase.storage.from('user').upload(`${userContext.id}/transcript`, selectedFile, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        console.log(error?.message);
      }

      await supabase.functions.invoke('transcript-parser');
      handleClose();
    }
  };

  return (
    <div>
      <Modal
        open={isOpen}
        onClose={Close}
        aria-labelledby='upload-transcript-modal'
        aria-describedby='transcript-upload'>
        <div className={styles.uploadModal}>
          <IconButton aria-label='close' onClick={handleClose} className={styles.closeButton}>
            <CloseIcon />
          </IconButton>
          <div className={styles.contentsContainer}>
            <div className={styles.header}>
              <h1>Upload Transcript</h1>
            </div>
            <div className={styles.description}>
              <p>Upload your transcript here and allow the app time to process your skill ratings</p>
            </div>
            <div className={styles.uploadFile}>
              <Button
                label='Upload File'
                className={styles.uploadButton}
                handleClick={() => inputFile.current && inputFile.current.click()}
              />
              <input type='file' accept='.pdf' ref={inputFile} onChange={handleFileSelect} hidden />
              <p>{selectedFile?.name}</p>
            </div>
            <Button label='Save' className={styles.saveButton} handleClick={() => void onUpload()} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UploadTranscriptModal;
