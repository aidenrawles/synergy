import React, { useEffect, useState } from 'react';
import { Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from './ProjectModal.module.scss';
import { Project, Tags } from '../../types/database-types';
import ProjectTag from '../../components/ProjectTag/ProjectTag';
import { TAGS } from '../../utils/projectTag';
import { getProjectWithId } from '../../utils/helper/projectHelper';

interface ProjectModalProps {
  open: boolean;
  handleClose: () => void;
  projectId: string;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ open, handleClose, projectId }) => {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      const fetchedProject = await getProjectWithId(projectId);
      if (!('error' in fetchedProject)) {
        setProject(fetchedProject);
      }
    };

    if (projectId) {
      void fetchProject();
    }
  }, [projectId]);

  const onClose = () => {
    setProject(null);
    handleClose();
  };

  if (!project) {
    return null;
  }

  return (
    <Modal open={open} onClose={onClose} aria-labelledby='project-modal' aria-describedby='project-details'>
      <div className={styles.projectForm}>
        <IconButton aria-label='close' onClick={onClose} className={styles.closeButton}>
          <CloseIcon />
        </IconButton>

        <div className={styles.projectHeader}>
          <div className={styles.title}>
            <h1>
              Project {project.project_number}: {project.title}
            </h1>
          </div>
        </div>

        <div className={styles.tags}>
          <div className={styles.desc}>
            <div className={styles.labelField}>
              <label>Description</label>
            </div>
            <p>{project.description}</p>
          </div>
        </div>

        <div className={styles.tags}>
          <div className={styles.desc}>
            <div className={styles.labelField}>
              <label>Tags</label>
            </div>
            <div className={styles.projectTags}>
              {project.tags.tags.map((tagObj, idx) => {
                if (tagObj.weight > 0 && TAGS.includes(tagObj.tag as Tags)) {
                  return <ProjectTag key={idx} tag={tagObj.tag as Tags} />;
                }
                return null;
              })}
            </div>
          </div>
        </div>

        <div className={styles.tags}>
          <div className={styles.desc}>
            <div className={styles.labelField}>
              <label>Requirements</label>
            </div>
            <p>{project.requirements_list}</p>
          </div>
        </div>

        <div className={styles.tags}>
          <div className={styles.desc}>
            <div className={styles.labelField}>
              <label>Technical Requirements</label>
            </div>
            <p>{project.technical_requirements}</p>
          </div>
        </div>

        <div className={styles.tags}>
          <div className={styles.desc}>
            <div className={styles.labelField}>
              <label>Groups Allowed</label>
            </div>
            <p>{project.slots}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProjectModal;
