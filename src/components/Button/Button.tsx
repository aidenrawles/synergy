import styles from './Button.module.scss';
import classnames from 'classnames';

interface Button {
  label?: string;
  labelColour?: string;
  backgroundColour?: string;
  handleClick?: () => void;
  icon?: string;
  className?: string;
  disabled?: boolean;
}

const Button = ({ label, labelColour, backgroundColour, handleClick, icon, disabled, className }: Button) => {
  return (
    <button
      style={{ backgroundColor: backgroundColour, color: labelColour }}
      className={classnames(styles.buttonStyles, className, { [styles.hoverStyles]: !disabled })}
      onClick={handleClick}
      disabled={disabled}>
      {icon && <img src={icon} alt='icon' />}
      {label}
    </button>
  );
};

export default Button;
