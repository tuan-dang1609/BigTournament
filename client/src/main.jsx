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
import HomepageAOV from './arenaofvalor/homepage.jsx'
import MatchStat from './valorant/statmatch.jsx';
import Inputmatchid from './valorant/input.jsx';
import SwissStage from './valorant/bracket.jsx';
import PlayoffValo from './valorant/playoff.jsx';
import SwissStageLOL from './leagueoflegend/bracket.jsx'
import TeamRegistrationForm from './components/registerfor.jsx'
import TeamRegistrationFormAOV from './arenaofvalor/registerfor.jsx'
import RuleAOV from './arenaofvalor/rule.jsx';
import PickemChallenge from './arenaofvalor/pickem.jsx';
import LeaderboardComponent from './arenaofvalor/leaderboardpickem.jsx';
import WelcomePage from './arenaofvalor/welcomepickem.jsx';
import PickemChallengeMatch from './arenaofvalor/pickemmatch.jsx';
import TournamentBracketAOV from './arenaofvalor/bracket.jsx'
import PrivacyPolicy from './components/privacypolicy.jsx';
import TermsOfService from './components/termofservice.jsx';
import HallOfFame from './arenaofvalor/halloffame.jsx';
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
              <Route path="/valorant/match/:round/:Match" element={<MatchStat />} />
              <Route path="/valorant/inputmatch" element={<Inputmatchid />} />
              <Route path="/valorant/swissstage" element={<SwissStage />} />
              <Route path="/valorant/playoff" element={<PlayoffValo />} />
              <Route path="/leagueoflegend/soloyasuo" element={<SwissStageLOL />} />
              <Route path="/arenaofvalor" element={<HomepageAOV />} />
              <Route path='/register' element={<TeamRegistrationForm />} />
              <Route path='/arenaofvalor/luatle' element={<RuleAOV />} />
              <Route path='/arenaofvalor/pickem/welcome' element={<WelcomePage />} />
              <Route path='/arenaofvalor/swisstage' element={<TournamentBracketAOV />} />
              <Route path='/privacy' element={<PrivacyPolicy />} />
              <Route path='/tos' element={<TermsOfService />} />
              <Route path='/arenaofvalor/halloffame' element={<HallOfFame />} />
              <Route element={<PrivateRoute />}>
              <Route path='/arenaofvalor/pickem/pickemmatch' element={<PickemChallengeMatch />} />
                <Route path='/arenaofvalor/register' element={<TeamRegistrationFormAOV />} />
                <Route path='/arenaofvalor/pickem/leaderboard' element={<LeaderboardComponent />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/arenaofvalor/pickem/pickemall' element={<PickemChallenge />} />
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
