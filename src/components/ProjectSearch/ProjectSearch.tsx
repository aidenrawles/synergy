// Searchbar component used in projects pages

import React, { useState, useMemo } from 'react';
import TextField from '@mui/material/TextField';
import { Project, User } from '../../types/database-types';
import styles from './ProjectSearch.module.scss';

interface ProjectSearchProps {
  projects: Project[];
  userData: Record<string, User>;
  onFilteredProjectsChange: (filteredProjects: Project[]) => void;
}

const ProjectSearch: React.FC<ProjectSearchProps> = ({ projects, userData, onFilteredProjectsChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;

    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return projects.filter((project) => {
      const client = userData[project.client_id];
      const clientName = client ? `${client.first_name} ${client.last_name}`.toLowerCase() : '';
      // Searches for
      return (
        project.title.toLowerCase().includes(lowercasedSearchTerm) ||
        project.description.toLowerCase().includes(lowercasedSearchTerm) ||
        project.project_number.toString().includes(lowercasedSearchTerm) ||
        `p${project.project_number}`.includes(lowercasedSearchTerm) ||
        project.tags.tags.some((tag) => tag.tag.toLowerCase().includes(lowercasedSearchTerm) && tag.weight > 0) ||
        project.requirements_list.toLowerCase().includes(lowercasedSearchTerm) ||
        project.technical_requirements.toLowerCase().includes(lowercasedSearchTerm) ||
        clientName.includes(lowercasedSearchTerm)
      );
    });
  }, [projects, searchTerm, userData]);

  React.useEffect(() => {
    onFilteredProjectsChange(filteredProjects);
  }, [filteredProjects, onFilteredProjectsChange]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className={styles.searchBarContainer}>
      <TextField
        fullWidth
        variant='outlined'
        value={searchTerm}
        onChange={handleSearch}
        placeholder='Search projects by title, description, number, tags, requirements, or client name...'
        className={styles.searchInput}
      />
    </div>
  );
};

export default ProjectSearch;
