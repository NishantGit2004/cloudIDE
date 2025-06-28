import React, { useEffect, useState } from 'react';
import axios from '../utils/axiosInstance';
import '../styles/Dashboard.css';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [projects, setProjects] = useState([])
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [projectName, setProjectName] = useState('')
  const [showProfile, setShowProfile] = useState(false) 
  const [user, setUser] = useState(null)
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects()
    getUser()
  }, []);

  const getUser = () => {
    const retrievedUser = localStorage.getItem('user')
    if (retrievedUser) {
      try {
        const parsedUser = JSON.parse(retrievedUser)
        setUser(parsedUser)
      } catch (err) {
        console.error("Error parsing user from localStorage:", err)
      }
    } else {
      console.log("No user found in localStorage.")
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/project', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      setProjects(res.data.projects);
    } catch (err) {
      toast.error('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    setCreating(true)
    try {
      const res = await axios.post('/project/create', { projectName }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      toast.success('Project created!')
      setProjectName('')
      fetchProjects()
    } catch (err) {
      toast.error('Error creating project');
      console.error(err);
    } finally {
      setCreating(false)
    }
  }

  const deleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await axios.delete(`/project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      toast.success('Project deleted successfully');
      fetchProjects()
    } catch (err) {
      toast.error('Failed to delete project');
      console.error(err);
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post('/user/logout', {}, { withCredentials: true });

      localStorage.removeItem('accessToken');
      
      localStorage.removeItem('user');

      toast.success('Logged out successfully');
      navigate('/')
    } catch (err) {
      toast.error('Logout failed')
      console.error(err);
    }
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="logo">🧠 cloud IDE</div>
        <div className="nav-right">
          <div className='avatar' onClick={() => setShowProfile(!showProfile)}> { user?.name?.split(' ')[0][0]?.toUpperCase() + user?.name?.split(' ')[1][0]?.toUpperCase() } </div>
          {showProfile && (
            <div className="profile-popup">
              <h4>User Profile</h4>
              <p><strong>Name:</strong> { user?.name } </p>
              <p><strong>Email:</strong> { user?.email } </p>
              <div className="profile-actions">
                <button onClick={() => setShowProfile(false)}>Close</button>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="project-section">
        <h2>Your Projects</h2>
        <div className="project-input">
          <input
            type="text"
            placeholder="Enter new project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={creating}
          />
          <button onClick={createProject} disabled={creating}>
            {creating ? 'Creating...' : 'Create Project'}
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="project-list">
            {projects.map((project) => (
              <div className="project-card" key={project._id}>
                <div>
                  <h3>{project.projectName}</h3>
                  <p className="path">{project.path}</p>
                  <p className="created">Created: {new Date(project.createdAt).toLocaleString()}</p>
                </div>
                <div className="card-actions">
                  <button
                    className="open-btn"
                    onClick={() => navigate(`/ide/${project._id}`)}
                  >
                    Open
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteProject(project._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
