import { useState } from 'react';
import { UserType } from '../../types/enums';
import { useAuth } from '../../Context';
import { inviteUser, isUnswEmail } from '../../utils/auth';
import Button from '../../components/Button/Button';
import InviteMember from '../../components/InviteMember/InviteMember';
import AlertSlider from '../../components/AlertSlider/AlertSlider';
import Error from '../Error/Error';
import add from '../../assets/add.svg';
import styles from './Invite.module.scss';

const Invite = () => {
  const { userContext } = useAuth();
  const initialMember = { email: '', role: UserType.Student };
  const [members, setMembers] = useState([initialMember]);
  const [showInviteAlert, setShowInviteAlert] = useState(false);
  const [showEmailAlert, setShowEmailAlert] = useState(false);
  const [invitesSuccess, setInvitesSuccess] = useState(false);
  const [inviteError, setInviteError] = useState<Member[]>([]);
  const [inviteInProgress, setInviteInProgress] = useState(false);

  interface Member {
    email: string;
    role: UserType;
  }

  const successResults: Member[] = [];

  const renderMemberRows = () => {
    return members.map((member, idx) => (
      <InviteMember key={idx} member={member} idx={idx} handleMemberChange={handleMemberChange} />
    ));
  };

  const addMemberRow = () => {
    if (members.length < 5) {
      setMembers([...members, initialMember]);
      setShowInviteAlert(false);
    } else setShowInviteAlert(true);
  };

  // Just in case user goes back and edits previous fields
  const handleMemberChange = (index: number, field: string, value: UserType) => {
    const updatedMembers = members.map((member, idx) => {
      if (idx === index) return { ...member, [field]: value };
      return member;
    });
    setMembers(updatedMembers);
  };

  // Sending the invites
  const handleInvites = async () => {
    // Check if the invite is a unsw email
    const validEmails = members.every((member) => isUnswEmail(member.email));
    if (validEmails) {
      setShowEmailAlert(false);
      setInviteInProgress(true);
      for (const member of members) {
        try {
          await inviteUser(userContext.id, member.email, member.role);
          successResults.push(member);
        } catch (error) {
          setInviteInProgress(false);
          setInviteError((prevState) => [...prevState, member]);
        }
      }
      setInviteInProgress(false);
      if (successResults.length === members.length) setInvitesSuccess(true);
    } else setShowEmailAlert(true);
  };

  return (
    <>
      {userContext?.userType !== UserType.Client ? (
        <div className={styles.sectionWrapper}>
          <AlertSlider
            active={showInviteAlert}
            severity='error'
            errorMsg='Can only invite up to 5 members at a time.'
            setActive={setShowInviteAlert}
          />
          <AlertSlider
            active={showEmailAlert}
            severity='error'
            errorMsg='All emails must be a valid UNSW email'
            setActive={setShowEmailAlert}
          />
          <AlertSlider
            active={inviteInProgress}
            severity='info'
            errorMsg='Sending invites...'
            setActive={setInviteInProgress}
          />
          <AlertSlider
            active={invitesSuccess}
            severity='success'
            errorMsg='All invites sent!'
            setActive={setInvitesSuccess}
          />
          <AlertSlider
            active={inviteError.length > 0}
            severity='error'
            errorMsg={`Invites not sent to ${inviteError.map((member) => member.email).join(', ')}`}
          />
          <h1 className={styles.header}>Invite new members</h1>
          <h2 className={styles.subHeader}>Invite new members by email to join your organisation.</h2>
          {renderMemberRows()}
          <div className={styles.buttons}>
            <Button label='Add member' icon={add} handleClick={() => addMemberRow()} />
            <div className={styles.sendAndCancelButtons}>
              <Button label='Cancel' handleClick={() => setMembers([{ email: '', role: UserType.Student }])} />
              <Button
                label={members.length > 1 ? 'Send invites' : 'Send invite'}
                backgroundColour='var(--primary-purple)'
                labelColour='var(--base-white)'
                disabled={inviteInProgress}
                handleClick={() => void handleInvites()}
              />
            </div>
          </div>
        </div>
      ) : (
        <Error />
      )}
    </>
  );
};

export default Invite;
