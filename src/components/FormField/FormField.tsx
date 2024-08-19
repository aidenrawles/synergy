import React, { useEffect, useState } from 'react';
import styles from './FormField.module.scss';

interface FormFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
}

const FormField: React.FC<FormFieldProps> = ({ label, value, onSave }) => {
  const [fieldValue, setFieldValue] = useState<string>(value);

  useEffect(() => {
    setFieldValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setFieldValue(newValue);
    onSave(newValue);
  };

  return (
    <div className={styles.formField}>
      <div className={styles.labelField}>
        <label htmlFor={label}>{label}</label>
      </div>
      <div className={styles.inputField}>
        <textarea id={label} value={fieldValue} onChange={handleChange} />
      </div>
    </div>
  );
};

export default FormField;
