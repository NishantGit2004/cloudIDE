import React, { useState } from 'react'
import axios from '../utils/axiosInstance'
import '../styles/Register.css'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validatePasswordStrength = (password) => {
    // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/
    return regex.test(password)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validatePasswordStrength(formData.password)) {
      return toast.error('Password must be at least 6 chars long, include uppercase, lowercase, and a number.')
    }

    try {
      const res = await axios.post('/user/register', formData)
      toast.success('Registration successful! Please login.')
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      toast.error(msg)
    }
  }

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>

        <label htmlFor="name">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <span onClick={() => setShowPassword(prev => !prev)}>
            {showPassword ? 'Hide' : 'Show'}
          </span>
        </div>

        <button type="submit">Register</button>

        <p className="redirect">
          Already have an account? <span className='back-login' onClick={() => navigate('/')}>Login</span>
        </p>
      </form>
    </div>
  )
}

export default Register