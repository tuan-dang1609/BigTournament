import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/homepage.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { persistor, store } from '../redux/store.js';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import PrivateRoute from './components/PrivateRoute.jsx';
import Profile from './components/profile.jsx';
import SignIn from './components/signin.jsx';
import SignUp from './components/signup.jsx';
import Rule from './valorant/Rule.jsx';
import AllGame from './components/allgame.jsx';
import './index.css'
import MatchResult from './valorant/match.jsx';
import MatchStat from './valorant/statmatch.jsx';
// Check if the root element exists
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={null}>
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route exact path='/' element={<Home />} />
              <Route path='/signup' element={<SignUp />} />
              <Route path='/signin' element={<SignIn />} />
              <Route path='/valorant/me' element={<Rule />} />
              <Route path='/allgame' element={<AllGame />} />
              <Route path="/valorant/test" element={<MatchResult />} />
              <Route path="/valorant/match" element={<MatchStat />} />
              <Route element={<PrivateRoute />}>
                <Route path='/profile' element={<Profile />} />
              </Route>
            </Routes>
            <Footer />
          </BrowserRouter>
        </PersistGate>
      </Provider>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found. Make sure there is an element with id='root' in your HTML.");
}
