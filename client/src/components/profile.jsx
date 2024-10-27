import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
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
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const navigate = useNavigate();
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
            const res = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/user/update/${currentUser._id}`, {
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
            // Pass success message to the homepage
            navigate('/', { state: { success: true } });
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
            navigate('/valorant');
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
        <div className="max-w-7xl mt-16 mx-auto w-full">
            <div className="max-w-md px-2 sm:px-6 mx-auto mb-5">
                <p className="text-3xl font-bold text-center mb-3">Profile</p>
                <form className="flex flex-col" onSubmit={handleSubmit}>
                    <img src={`https://drive.google.com/thumbnail?id=${currentUser.profilePicture}`} className="h-28 w-28 rounded-full mx-auto mb-2" alt="Profile" />
                    <input type="text" onChange={handleChange} defaultValue={currentUser.profilePicture} id='profilePicture' placeholder="URL Avatar" className="p-3 my-[6px] rounded-lg border-primary border-[1.5px]" />
                    <input type="text" onChange={handleChange} defaultValue={currentUser.riotID} id='riotID' placeholder="Riot ID" className="p-3 my-[6px] rounded-lg border-primary border-[1.5px]" />
                    <input type="text" onChange={handleChange} defaultValue={currentUser.discordID} id='discordID' placeholder="Discord ID" className="p-3 my-[6px] rounded-lg border-primary border-[1.5px]" />
                    <input type="text" onChange={handleChange} defaultValue={currentUser.nickname} id='nickname' placeholder="Nickname" className="p-3 my-[6px] rounded-lg border-primary border-[1.5px]" />
                    <input type="text" onChange={handleChange} defaultValue={currentUser.username} id='username' placeholder="Username" className="p-3 my-[6px] rounded-lg border-primary border-[1.5px]" />
                    <input type="password" onChange={handleChange} id='password' placeholder="Password" className="p-3 my-[6px] rounded-lg border-primary border-[1.5px]" />
                    <button className="btn mt-3 bg-primary hover:bg-neutral text-white"> {loading ? 'Loading...' : 'Update'}</button>
                </form>
                <div className="del-upd">
                    <span onClick={() => setShowDeleteAlert(true)} className="btn w-full mt-3 bg-secondary hover:bg-neutral text-white">Xóa tài khoản</span>
                </div>
                {showDeleteAlert && (
                <div role="alert" className="alert">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="stroke-info h-6 w-6 shrink-0">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Xóa tài khoản?</span>
                    <div>
                        <button onClick={() => setShowDeleteAlert(false)} className="btn btn-sm">Không</button>
                        <button onClick={handleDeleteAccount} className="btn btn-sm btn-primary">Ok</button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
