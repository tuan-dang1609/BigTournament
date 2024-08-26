import React, { useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

export default function SignUp() {
  document.title = "Đăng kí";

  const [formData, setFormData] = useState({});
  const [retypePassword, setRetypePassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [Error, setError1] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{7,}$/;
    return passwordRegex.test(password);
  };
  const validateEmail = (email) => {
    return email.includes('@');
  };
  const handleRetypePasswordChange = (e) => {
    setRetypePassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== retypePassword) {
      setError1('Mật khẩu không khớp');
      return;
    }
    if (!validateEmail(formData.email)) {
      setError1('Email không hợp lệ. Vui lòng nhập lại');
      return;
    }
    if (!validatePassword(formData.password)) {
      setError1('Mật khẩu không đúng với yêu cầu');
      return;
    }
    setError1('')
    try {
      setLoading(true);
      setError(false);

      const res = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log(data);

      setLoading(false);

      if (data.success === false) {
        setError(true);
        return;
      }

      navigate('/');
    } catch (error) {
      setLoading(false);
      setError(true);
    }
  };

  return (
    <>
      <div className='max-w-7xl max-lg:mt-[68px] mt-20  mx-auto'>
        <div className='max-w-md px-2 sm:px-6 mx-auto'>
          <h1 className='text-3xl font-bold text-center mb-3'>Đăng kí</h1>
          <form onSubmit={handleSubmit} className='flex flex-col'>
            <input
              type='text'
              placeholder='RiotID'
              id='riotID'
              className='p-3 my-[6px] rounded-lg border-primary border-[1.5px]'
              onChange={handleChange}
            />
            <input
              type='text'
              placeholder='Username'
              id='username'
              className='p-3 my-[6px] rounded-lg border-primary border-[1.5px]'
              onChange={handleChange}

            />
            <input
              type='text'
              placeholder='Email'
              id='email'
              className='p-3 my-[6px] rounded-lg border-primary border-[1.5px]'
              onChange={handleChange}
              autoComplete="email"
            />
            <input
              type='password'
              placeholder='Mật khẩu'
              id='password'
              className='p-3 my-[6px] rounded-lg border-primary border-[1.5px]'
              onChange={handleChange}
              autoComplete="new-password"
            />
            <p className='text-base'>Lưu ý: Mật khẩu cần có ít nhất 7 kí tự, bao gồm cả chữ in hoa và số</p>
            <input
              type='password'
              placeholder='Nhập lại Mật khẩu'
              id='retypePassword'
              className='p-3 my-[6px] rounded-lg border-primary border-[1.5px]'
              onChange={handleRetypePasswordChange}
              autoComplete="new-password"
            />
            <button disabled={loading} className="btn mt-3 bg-primary hover:bg-neutral text-white">
              {loading ? 'Loading...' : 'Sign Up'}
            </button>
          </form>
          <div className='flex items-center my-1'>
            <div className='border-b-2 border-secondary flex-grow'></div>
            <div className='mx-4'>Hoặc</div>
            <div className='border-b-2 border-secondary flex-grow'></div>
          </div>
          <Link className='btn w-full rounded-btn bg-accent hover:bg-neutral text-white' to='/signin'><span>Đăng nhập</span></Link>
          {Error && <p style={{ color: '#FF7F7F', marginBottom: "0" }}>{Error}</p>}
          {error && <p style={{ color: '#FF7F7F', marginBottom: "0" }}>Something went wrong!</p>}
        </div>
      </div>
    </>
  );
}
