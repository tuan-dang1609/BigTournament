import React, { useState } from 'react';
import { useEffect } from 'react';
function App_RSO() {
    const [tokens, setTokens] = useState(null);
    const [error, setError] = useState(null);

    const handleLogin = () => {
        // Redirect user to backend route for Riot Sign-On
        window.location.href = 'https://dongchuyennghiep-backend.vercel.app/rso-login';
    };
    const clearCodeFromURL = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        window.history.replaceState(null, '', url.toString());
    };
    
    useEffect(() => {
        // Xóa code sau khi lấy xong
        clearCodeFromURL();
    }, []);
    const fetchTokens = async () => {
        try {
            // Lấy mã code từ URL (khi Riot chuyển hướng về frontend với ?code=<authorization_code>)
            const queryParams = new URLSearchParams(window.location.search);
            
    
            if (!queryParams) {
                throw new Error('Authorization code is missing in the URL');
            }else{
                console.log(queryParams)
            }
    
            // Gửi mã code tới backend qua POST
            const response = await fetch('https://dongchuyennghiep-backend.vercel.app/oauth2-callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }), // Gửi mã code trong body
            });
    
            if (!response.ok) {
                throw new Error('Failed to fetch tokens');
            }
    
            const data = await response.json();
            setTokens(data.tokens); // Lưu token trả về từ backend
        } catch (err) {
            setError(err.message); // Hiển thị lỗi nếu có
        }
    };
    

    return (
        <div className="mt-40" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Riot Sign-On Demo</h1>
            <button
                onClick={handleLogin}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                }}
            >
                Login with Riot
            </button>
            <button
                onClick={fetchTokens}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    marginLeft: '10px',
                    cursor: 'pointer',
                }}
            >
                Fetch Tokens
            </button>
            {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
            {tokens && (
                <pre
                    style={{
                        background: '#f4f4f4',
                        padding: '10px',
                        marginTop: '20px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        overflowX: 'auto',
                    }}
                >
                    {JSON.stringify(tokens, null, 2)}
                </pre>
            )}
        </div>
    );
}

export default App_RSO;