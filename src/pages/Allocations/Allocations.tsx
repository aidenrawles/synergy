import { useState, useEffect } from 'react';
import { Allocation } from '../../types/database-types';
import PreAllocation from '../../components/PreAllocation/PreAllocation';
import PostAllocation from '../../components/PostAllocation/PostAllocation';

import styles from './Allocations.module.scss';
import Loading from '../Loading/Loading';
import { getProjectAllocations } from '../../utils/helper/groupHelper';

const Allocations = () => {
  const [allocationsList, setAllocationsList] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllocations = async () => {
      const allocations = await getProjectAllocations();
      if (!('error' in allocations)) {
        setAllocationsList(allocations ? allocations : []);
      }
      setLoading(false);
    };
    void fetchAllocations();
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <div className={styles.sectionWrapper}>
      <h1 className={styles.header}>Allocations</h1>
      {allocationsList.length > 0 ? <PostAllocation /> : <PreAllocation />}
    </div>
  );
};

export default Allocations;
