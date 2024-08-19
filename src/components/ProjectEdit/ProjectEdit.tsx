import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './ProjectEdit.module.scss';
import FormField from '../../components/FormField/FormField';
import IconButton from '@mui/material/IconButton';
import { Edit } from '@mui/icons-material';
import Button from '../../components/Button/Button';
import { Tag, Tags } from '../../types/database-types';
import { colourDict } from '../../utils/projectTag';
import TagSelection from '../TagSelection/TagSelection';
import TagRating from '../TagRating/TagRating';
import AlertSlider from '../AlertSlider/AlertSlider';
import { TextField } from '@mui/material';
import Loading from '../../pages/Loading/Loading';
import { getProjectWithId, upsertProject } from '../../utils/helper/projectHelper';

const ProjectEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [technicalRequirements, setTechnicalRequirements] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [slots, setSlots] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // if given a projectid, fetch existing id, else create a new project
  useEffect(() => {
    const fetchProject = async (projectId: string) => {
      try {
        const project = await getProjectWithId(projectId);
        setTitle(project.title);
        setDescription(project.description);
        setTags(project.tags.tags);
        setRequirements(project.requirements_list);
        setTechnicalRequirements(project.technical_requirements);
        setSlots(project.slots);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        navigate('/project/new');
      }
    };

    if (id) {
      void fetchProject(id);
    } else {
      setLoading(false);
    }
  }, [id, navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await upsertProject(id, title, description, technicalRequirements, requirements, slots, tags);
      setLoading(false);
      navigate('/dashboard');
    } catch (error) {
      setLoading(false);
      setErrorMsg(`${error}`);
      console.error('Failed to submit', error);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const handleTitleDoubleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  const updateTagRating = (tag: string, weight: number) => {
    setTags((prevTags) => prevTags.map((prev) => (prev.tag === tag ? { ...prev, weight: weight } : prev)));
  };

  return loading ? (
    <Loading />
  ) : (
    <>
      <div className={styles.projectForm}>
        <div className={styles.projectHeader}>
          <AlertSlider active={errorMsg.length > 0} severity='error' errorMsg={errorMsg} />
          <div className={styles.title}>
            <h1 onDoubleClick={handleTitleDoubleClick}>
              {isEditingTitle ? (
                <input
                  type='text'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  autoFocus
                />
              ) : (
                title || 'Edit Title'
              )}
            </h1>
            <IconButton onClick={handleTitleDoubleClick} disableRipple>
              <Edit sx={{ color: 'var(--dark-purple)' }} />
            </IconButton>
          </div>
        </div>
        <div>
          <div className={styles.tags}>
            <div className={styles.ratings}>
              <div className={styles.labelField}>
                <label htmlFor='Tags'>Project Tags</label>
              </div>
              <TagSelection tags={Object.keys(colourDict) as Tags[]} selectedTags={tags} setSelectedTags={setTags} />
              <TagRating selectedTags={tags} setSelectedRating={updateTagRating} />
            </div>
            <div className={styles.capacity}>
              <div className={styles.labelField}>
                <label htmlFor='Capacity'>Max Groups</label>
              </div>
              <TextField
                required={true}
                fullWidth
                label={slots > 0 ? '' : 'No. of Groups'}
                type='number'
                value={slots > 0 ? slots : ''}
                InputProps={{ inputProps: { min: 1 } }}
                InputLabelProps={{ shrink: false }}
                onChange={(e) => setSlots(parseInt(e.target.value))}
              />
            </div>
          </div>
          <FormField
            label='Description'
            value={description}
            onSave={(value) => {
              setDescription(value);
            }}
          />
          <FormField
            label='Requirements list'
            value={requirements}
            onSave={(value) => {
              setRequirements(value);
            }}
          />
          <FormField
            label='Technical requirements'
            value={technicalRequirements}
            onSave={(value) => {
              setTechnicalRequirements(value);
            }}
          />
          <div className={styles.formActions}>
            <Button
              label='Cancel'
              labelColour='var(--primary-red)'
              backgroundColour='var(--light-red)'
              handleClick={() => void handleCancel()}
            />
            <Button
              label='Save'
              labelColour='var(--primary-purple)'
              backgroundColour='var(--light-purple)'
              handleClick={() => void handleSubmit()}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectEdit;
