import { colourDict } from '../../utils/projectTag';
import { Tags } from '../../types/database-types';
import styles from './ProjectTag.module.scss';

interface ProjectTag {
  tag: Tags;
}

const ProjectTag = ({ tag }: ProjectTag) => {
  const tagColour = colourDict[tag];

  return (
    <div
      className={styles.tagStyles}
      style={{ backgroundColor: `var(--light-${tagColour})`, color: `var(--primary-${tagColour})` }}>
      {tag}
    </div>
  );
};

export default ProjectTag;
