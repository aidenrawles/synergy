import styles from './Error.module.scss';

const Error = () => {
  return (
    <div className={styles.errorWrapper}>
      <h1>Oops!</h1>
      <h2>
        <span>404 Error: </span>Page not found.
      </h2>
    </div>
  );
};

export default Error;
