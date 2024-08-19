import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import Button from '@mui/material/Button';

import styles from './ProgressBar.module.scss';

interface ProgressBar {
  setListItems: (listItems: ChecklistItem[]) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export default function ProgressBar({ setListItems }: ProgressBar) {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [showTextIdx, setShowTextIdx] = useState<number | null>(null);

  const steps = ['Set-up', 'Group selection', 'Project Allocation'];

  const listItems = [
    [
      { id: 'update_profile', label: 'Update profile', checked: false },
      { id: 'upload_transcript', label: 'Upload transcript', checked: false },
      { id: 'create_join_group', label: 'Create/join a group', checked: false },
    ],
    [
      { id: 'meet_team', label: 'Meet with team', checked: false },
      { id: 'select_preferences', label: 'Select project preferences', checked: false },
    ],
    [
      {
        id: 'reach_out',
        label: 'Reach out to tutor if project allocation issues arise',
        checked: false,
      },
    ],
  ];

  const totalSteps = () => {
    return steps.length;
  };

  const completedSteps = () => {
    return Object.keys(completed).length;
  };

  const handleStep = (step: number) => () => {
    setActiveStep(step);
    setShowTextIdx(step);
  };

  const isLastStep = () => {
    return activeStep === totalSteps() - 1;
  };

  const allStepsCompleted = () => {
    return completedSteps() === totalSteps();
  };

  // handlecomplete should run every single time student joins transcript, joins a group, algo is run, algo is assigned
  // mb chuck into usercontext and local storage - for across saves?
  const handleComplete = () => {
    const newCompleted = completed;
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);
    const newActiveStep =
      isLastStep() && !allStepsCompleted() ? steps.findIndex((i) => !(i in completed)) : activeStep + 1;
    setActiveStep(newActiveStep);
  };

  useEffect(() => {
    if (showTextIdx === activeStep) {
      setListItems(listItems[showTextIdx]);
    }
  }, [showTextIdx, activeStep]);

  return (
    <Box sx={{ width: '100%' }} className={styles.progBar}>
      <Stepper nonLinear activeStep={activeStep} alternativeLabel>
        {steps.map((label, idx) => (
          <Step key={label} completed={completed[idx]} className={styles.step}>
            <StepButton onClick={handleStep(idx)}>{label}</StepButton>
          </Step>
        ))}
      </Stepper>
      {/* Ignore this - ts throws an error if handleComplete isn't called */}
      <Button onClick={handleComplete} className={styles.completeButton}>
        {completedSteps() === totalSteps() - 1 ? 'Finish' : 'Complete Step'}
      </Button>
    </Box>
  );
}
