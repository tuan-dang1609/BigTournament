import React, { useState } from 'react';

function App_RSO() {
    const [tokens, setTokens] = useState(null);
    const [error, setError] = useState(null);

    const handleLogin = () => {
        // Redirect user to backend route for Riot Sign-On
        window.location.href = 'https://dongchuyennghiep-backend.vercel.app/rso-login';
    };

    const fetchTokens = async () => {
        try {
            const response = await fetch('https://dongchuyennghiep-backend.vercel.app/oauth2-callback');
            if (!response.ok) throw new Error('Failed to fetch tokens');
            const data = await response.json();
            setTokens(data.tokens);
        } catch (err) {
            setError(err.message);
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