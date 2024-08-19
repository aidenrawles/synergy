import { UserType } from '../types/enums';
import { Group } from '../types/database-types';

export const mockClientUserContext = {
  id: '3333333',
  firstName: 'Emily',
  lastName: 'Liu',
  email: 'z3333333@unsw.com',
  zid: 'z3333333',
  userType: UserType.Client,
  course: '',
  tutorial: '',
  img: '',
};

export const mockAdminUserContext = {
  id: '4444444',
  firstName: 'Emily',
  lastName: 'Liu',
  email: 'z4444444@unsw.com',
  zid: 'z4444444',
  userType: UserType.Admin,
  course: '',
  tutorial: '',
  img: '',
};

export const mockCoordinatorUserContext = {
  id: '5555555',
  firstName: 'John',
  lastName: 'Doe',
  email: 'z5555555@unsw.com',
  zid: 'z5555555',
  userType: UserType.Coordinator,
  course: '',
  tutorial: '',
  img: '',
};

export const mockStudentUserContext = {
  id: '00000000-0000-0000-0000-000000000001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'z1111111@unsw.com',
  zid: 'z1111111',
  userType: UserType.Student,
  course: '',
  tutorial: '',
  img: '',
};

export const mockTutorUserContext = {
  id: '5555555',
  firstName: 'John',
  lastName: 'Doe',
  email: 'z5555555@unsw.com',
  zid: 'z5555555',
  userType: UserType.Tutor,
  course: '',
  tutorial: '',
  img: '',
};

export const mockProjects = [
  {
    project_id: '1',
    project_number: '001',
    title: 'Project 1',
    description: 'Desc for project 1',
    tags: {
      tags: [
        { tag: 'DSA', weight: 1 },
        { tag: 'Frontend/UI', weight: 4 },
      ],
    },
  },
  {
    project_id: '2',
    project_number: '002',
    title: 'Project 2',
    description: 'Desc for project 2',
    tags: {
      tags: [
        { tag: 'AI', weight: 1 },
        { tag: 'Cyber security', weight: 3 },
      ],
    },
  },
];

export const mockGroups: Group[] = [
  {
    group_id: 1,
    name: 'Group 1',
    description: 'Description for Group 1',
    capacity: 6,
    members_count: 3,
    project_number: 1,
    tutorial: 'T01A',
    client_id: null,
    course: 'COMP3900',
  },
  {
    group_id: 2,
    name: 'Group 2',
    description: 'Description for Group 2',
    capacity: 6,
    members_count: 2,
    project_number: null,
    tutorial: 'T02A',
    client_id: null,
    course: 'COMP9900',
  },
];

export const currDate = new Date().toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
