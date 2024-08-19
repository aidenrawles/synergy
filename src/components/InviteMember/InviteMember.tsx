import { useAuth } from '../../Context';
import { UserType } from '../../types/enums';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import styles from './InviteMember.module.scss';

interface InviteMember {
  idx: number;
  member: { email: string; role: string };
  handleMemberChange: (index: number, field: string, value: UserType | string) => void;
}

const InviteMember = ({ idx, member, handleMemberChange }: InviteMember) => {
  const { userContext } = useAuth();

  const inviteRestrictions = () => {
    switch (userContext?.userType) {
      case UserType.Tutor:
        return ['Tutor', 'Client', 'Student'];
      case UserType.Client:
        return [];
      case UserType.Student:
        return ['Student'];
      default: // For admins and coordinators
        return ['Coordinator', 'Tutor', 'Client', 'Student'];
    }
  };

  return (
    <div className={styles.memberInviteRow}>
      <div className={styles.emailField}>
        <TextField
          required
          id={`email-field-${idx}`}
          value={member.email}
          label='Email address'
          fullWidth
          onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
        />
      </div>
      <div className={styles.roleSelect}>
        <FormControl fullWidth>
          <InputLabel id={`role-select-${idx}`}>Role</InputLabel>
          <Select
            labelId={`role-select-${idx}`}
            id={`role-select-${idx}`}
            value={member.role}
            label='Role'
            onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
            required>
            {inviteRestrictions().map((role, idx) => (
              <MenuItem key={idx} value={UserType[role] as string}>
                {role}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    </div>
  );
};

export default InviteMember;
