import React from 'react';
import { colourDict } from '../../utils/projectTag';
import { Tag, Tags } from '../../types/database-types';
import { Select, FormControl, Chip, ListItemText, MenuItem, SelectChangeEvent } from '@mui/material';

interface TagSelectionProps {
  tags: Tags[];
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
}

const TagSelection: React.FC<TagSelectionProps> = ({ tags, selectedTags, setSelectedTags }) => {
  const handleChange = (event: SelectChangeEvent<Tags[]>) => {
    const value = event.target.value as Tags[];

    // Ensure we can only pick 5 tags and check if an existing tag exists
    if (value.length <= 5) {
      const updatedSelectedTags = value.map((tag) => {
        const existingTag = selectedTags.find((selected) => selected.tag === tag);
        return existingTag ?? { tag, weight: 0 };
      });
      setSelectedTags(updatedSelectedTags);
    }
  };

  const handleDelete = (tagToDelete: string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTags(selectedTags.filter((tag) => tag.tag !== tagToDelete));
  };

  const MenuProps = {
    PaperProps: {
      style: {
        color: 'var(--dark-purple)',
        backgroundColor: 'var(--light-gray)',
      },
    },
  };

  return (
    <FormControl sx={{ width: '100%' }}>
      <Select
        multiple
        displayEmpty
        value={selectedTags.map((selected) => selected.tag) as Tags[]}
        onChange={handleChange}
        renderValue={(selected) => {
          if (selected.length === 0) {
            return <em>Select up to 5 tags</em>;
          }
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selected.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={handleDelete(tag)}
                  onMouseDown={(event) => event.stopPropagation()}
                  sx={{
                    backgroundColor: `var(--light-${colourDict[tag]})`,
                    color: `var(--primary-${colourDict[tag]})`,
                    '& .MuiChip-deleteIcon': {
                      color: `var(--primary-${colourDict[tag]})`,
                    },
                    '&:hover .MuiChip-deleteIcon': {
                      color: 'var(--light-gray})',
                    },
                  }}
                />
              ))}
            </div>
          );
        }}
        MenuProps={MenuProps}
        sx={{
          color: 'var(--base-black)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--dark-purple)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primary-purple)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primary-purple)',
          },
          '& .MuiSelect-icon': {
            color: 'var(--dark-purple)',
          },
        }}>
        {tags.map((tag) => (
          <MenuItem
            key={tag}
            value={tag}
            disabled={!selectedTags.map((selected) => selected.tag).includes(tag) && selectedTags.length >= 5}
            sx={{
              color: 'var(--dark-purple)',
              backgroundColor: 'var(--light-gray)',
              '&.Mui-selected': {
                backgroundColor: 'var(--light-purple)',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'var(--secondary-purple)',
              },
              '&:hover': {
                backgroundColor: 'var(--secondary-purple)',
              },
            }}>
            <ListItemText primary={tag} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TagSelection;
