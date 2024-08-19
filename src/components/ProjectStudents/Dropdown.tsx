import React from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

interface DropdownProps {
  selectedRank: number | null;
  onSelect: (rank: number) => void;
}

const ranks = [1, 2, 3, 4, 5, 6, 7];

const Dropdown: React.FC<DropdownProps> = ({ selectedRank, onSelect }) => {
  return (
    <FormControl size='small' sx={{ width: '120px' }}>
      <InputLabel
        style={{ color: 'var(--primary-purple)', fontWeight: 600 }}
        sx={{
          '&.Mui-focused': {
            color: 'var(--primary-purple)',
            fontWeight: 600,
          },
        }}>
        Rank
      </InputLabel>
      <Select
        label='Rank'
        value={selectedRank ?? ''}
        onChange={(e) => onSelect(Number(e.target.value))}
        required
        size='small'
        sx={{
          color: 'var(--base-black)',
          backgroundColor: 'var(--light-purple)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--secondary-purple)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primary-purple)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primary-purple)',
          },
          '& .MuiSelect-icon': {
            color: 'var(--secondary-purple)',
          },
        }}>
        {ranks.map((rank) => (
          <MenuItem key={rank} value={rank}>
            {rank}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default Dropdown;
