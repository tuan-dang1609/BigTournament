import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from 'react-router-dom';
import {
    updateUserStart,
    updateUserSuccess,
    updateUserFailure,
    deleteUserStart,
    deleteUserSuccess,
    deleteUserFailure,
    signOut,
} from '../../redux/user/userSlice.js';

export default function Profile() {
    const [loading1, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({});
    const { currentUser, loading, error } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
            setLoading(false);
        };
        document.title = "Cập nhật Profile";
        setTimeout(scrollToTop, 0);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            dispatch(updateUserStart());
            const res = await fetch(`https://valosplit2-backend.vercel.app/api/user/update/${currentUser._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success === false) {
                dispatch(updateUserFailure(data));
                return;
            }
            dispatch(updateUserSuccess(data));
            navigate('/valorant')
        } catch (error) {
            dispatch(updateUserFailure(error));
        }
    };

    const handleDeleteAccount = async () => {
        try {
            dispatch(deleteUserStart());
            const res = await fetch(`https://valosplit2-backend.vercel.app/api/user/delete/${currentUser._id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success === false) {
                dispatch(deleteUserFailure(data));
                return;
            }
            dispatch(deleteUserSuccess(data));
            navigate('/valorant')
        } catch (error) {
            dispatch(deleteUserFailure(error));
        }
    };

    const handleSignOut = async () => {
        try {
            await fetch('https://valosplit2-backend.vercel.app/api/auth/signout');
            dispatch(signOut());
            
            navigate("/valorant");
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="profile">
            <h1>Profile</h1>
            <form className="profile-user" onSubmit={handleSubmit}>
                <img src={`https://drive.google.com/thumbnail?id=${currentUser.profilePicture}`} className="prof-img" alt="Profile" />
                <input type="text" onChange={handleChange} defaultValue={currentUser.profilePicture} id='profilePicture' placeholder="URL Avatar" className="input-info" />
                <input type="text" onChange={handleChange} defaultValue={currentUser.riotID} id='riotID' placeholder="Riot ID" className="input-info" />
                <input type="text" onChange={handleChange} defaultValue={currentUser.username} id='username' placeholder="Username" className="input-info" />
                <input type="text" onChange={handleChange} defaultValue={currentUser.email} id='email' placeholder="Email" className="input-info" />
                <input type="password" onChange={handleChange} id='password' placeholder="Password" className="input-info" />
                <button className="update-btn"> {loading ? 'Loading...' : 'Update'}</button>
            </form>
            <div className="del-upd">
                <span onClick={handleDeleteAccount} className="delete-acc">Xóa tài khoản</span>
                <span onClick={handleSignOut} className="sign-out">Đăng xuất</span>
            </div>
        </div>
    );
}
