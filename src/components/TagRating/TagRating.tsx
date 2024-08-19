import React from 'react';
import styles from './TagRating.module.scss';
import { Tag } from '../../types/database-types';
import { Box, Chip, Rating } from '@mui/material';
import { colourDict } from '../../utils/projectTag';

interface TagRatingProps {
  selectedTags: Tag[];
  setSelectedRating: (tag: string, weight: number) => void;
}

const TagRating: React.FC<TagRatingProps> = ({ selectedTags, setSelectedRating }) => {
  const handleChange = (tag: string) => (_event: React.ChangeEvent, newValue: number | null) => {
    if (newValue !== null) {
      setSelectedRating(tag, newValue);
    }
  };

  return (
    <div className={styles.container}>
      {selectedTags.map((tag, index) => (
        <div key={tag.tag} className={styles.tagContainer}>
          <div className={styles.tags}>
            <span className={styles.index}>
              <span>{index + 1}</span>
            </span>
            <div className={styles.tag}>
              <Chip
                key={tag.tag}
                label={tag.tag}
                style={{
                  backgroundColor: `var(--light-${colourDict[tag.tag]})`,
                  color: `var(--primary-${colourDict[tag.tag]})`,
                }}
              />
            </div>
          </div>
          <div className={styles.ratings}>
            <Box className={styles.ratingNumber}>
              <span className={styles.ratingValue}>{tag.weight}</span>
              <span>/5</span>
            </Box>
            <Rating
              name={tag.tag}
              value={tag.weight}
              size='large'
              precision={0.5}
              onChange={handleChange(tag.tag)}
              sx={{
                '& .MuiRating-iconFilled': {
                  color: 'var(--primary-purple)',
                },
                '& .MuiRating-iconHover': {
                  color: 'var(--primary-purple)',
                },
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TagRating;
