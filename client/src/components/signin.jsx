import React, { useState } from 'react';

import { Link, useNavigate } from 'react-router-dom'
import { signInStart, signInFailure, signInSuccess } from '../../redux/user/userSlice';
import { useDispatch, useSelector } from 'react-redux';

export default function SignIn() {
  const [loading1, setLoading] = useState(true);

  document.title = "Đăng nhập"
  const [formData, setFormData] = useState({});
  const { loading, error } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch()
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(signInStart());
      const res = await fetch('https://valosplit2-backend.vercel.app/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success === false) {
        dispatch(signInFailure(data));
        return;
      }
      dispatch(signInSuccess(data));
      navigate('/')
    } catch (error) {
      dispatch(signInFailure(error))
    }
  };
  return (
    <>
      <div className='max-w-7xl mt-40 mx-auto '>
        <div className='max-w-md px-2 sm:px-6 mx-auto mb-[28.85vh]'>
          <h1 className='text-3xl font-bold text-center mb-3'>Đăng Nhập</h1>
          <form onSubmit={handleSubmit} className='flex flex-col'>
            <input
              type='text'
              placeholder='Username'
              id='username'
              className='p-3 my-[6px] rounded-lg border-primary border-[1.5px] '
              onChange={handleChange}
            />
            <input
              type='password'
              placeholder='Password'
              id='password'
              className='p-3 my-[6px] rounded-lg border-primary border-[1.5px] '
              onChange={handleChange}
            />
            <button disabled={loading} className="btn rounded-btn mt-3 bg-primary hover:bg-neutral text-white">
              {loading ? 'Loading...' : 'Đăng nhập'}
            </button>
          </form>
          <div className='flex items-center my-1'>
            <div className='border-b-2 border-secondary flex-grow'></div>
            <div className='mx-4'>Hoặc</div>
            <div className='border-b-2 border-secondary flex-grow'></div>
          </div>
          <Link className='btn rounded-btn w-full bg-accent hover:bg-neutral text-white' to='/signup'><span>Đăng kí</span></Link>
          <p style={{ color: 'red' }}>{error ? error.message || 'Something went wrong!' : ''}</p>
        </div>

      </div>
    </>
  )
}