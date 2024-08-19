import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import PageLayout from './components/PageLayout/PageLayout';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Project from './pages/Project/Project';
import Projects from './pages/Projects/Projects';
import Invite from './pages/Invite/Invite';
import Groups from './pages/Groups/Groups';
import Allocations from './pages/Allocations/Allocations';
import Error from './pages/Error/Error';
import { AuthProvider } from './Context';
import { CssBaseline } from '@mui/material';

import UserProfile from './components/User/UserProfile';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EditUserProfile from './components/User/EditUserProfile';
import Profile from './pages/Profile/Profile';

function App() {
  return (
    <AuthProvider>
      <CssBaseline />
      <BrowserRouter>
        <PageLayout data-theme='light'>
          <Routes>
            <Route path='/login' element={<PublicRoute element={<Login />} />} />
            <Route path='/register' element={<PublicRoute element={<Register />} />} />
            <Route path='/register/:token' element={<PublicRoute element={<Register />} />} />
            <Route path='/' element={<PrivateRoute element={<Dashboard />} />} />
            <Route path='/dashboard' element={<PrivateRoute element={<Dashboard />} />} />
            <Route path='/invite' element={<PrivateRoute element={<Invite />} />} />
            <Route path='/projects' element={<PrivateRoute element={<Projects />} />} />
            <Route path='/groups' element={<PrivateRoute element={<Groups />} />} />
            <Route path='/profile' element={<PrivateRoute element={<UserProfile />} />} />
            <Route path='/profile/edit' element={<PrivateRoute element={<EditUserProfile />} />} />
            <Route path='/profile/:id' element={<PrivateRoute element={<Profile />} />} />
            <Route path='/project/new' element={<PrivateRoute element={<Project />} />} />
            <Route path='/project/:id' element={<PrivateRoute element={<Project />} />} />
            <Route path='/allocations' element={<PrivateRoute element={<Allocations />} />} />
            <Route path='/404' element={<PrivateRoute element={<Error />} />} />
          </Routes>
        </PageLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
