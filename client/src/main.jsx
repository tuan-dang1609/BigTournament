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
import './index.css';
import HomepageAOV from './arenaofvalor/homepage.jsx';
import MatchStat from './valorant/statmatch.jsx';
import Inputmatchid from './valorant/input.jsx';
import SwissStage from './valorant/bracket.jsx';
import PlayoffValo from './valorant/playoff.jsx';
import SwissStageLOL from './leagueoflegend/bracket.jsx';
import TeamRegistrationForm from './components/registerfor.jsx';
import TeamRegistrationFormAOV from './arenaofvalor/registerfor.jsx';
import RuleAOV from './arenaofvalor/rule.jsx';
import PickemChallenge from './arenaofvalor/pickem.jsx';
import LeaderboardComponent from './arenaofvalor/leaderboardpickem.jsx';
import WelcomePage from './arenaofvalor/welcomepickem.jsx';
import PickemChallengeMatch from './arenaofvalor/pickemmatch.jsx';
import TournamentBracketAOV from './arenaofvalor/bracket.jsx';
import PrivacyPolicy from './components/privacypolicy.jsx';
import TermsOfService from './components/termofservice.jsx';
import HallOfFameAOV from './arenaofvalor/halloffame.jsx';
import HallOfFameValo from './valorant/halloffame.jsx';
import MatchStatAOV from './arenaofvalor/statmatch.jsx';
import TFTRegister from './tft/registerfor.jsx';
import TFThompage from './tft/homepage.jsx';
import LiveGameDataLOL from './leagueoflegend/hudgame.jsx';
import TournamentBracketLOL from './leagueoflegend/bracket.jsx';
import TournamentBracketAOV16 from './arenaofvalor/bracket_16team.jsx';
import PlayinAOV from './arenaofvalor/bracket.jsx';
import RSO_Authorization from './components/rso.jsx';
import PowerRankingAOV from './arenaofvalor/ranking.jsx';
import Calendar from './components/calendar.jsx';
import TeamRegistrationTFTDoubleForm from './tft/registerfordouble.jsx';
import CompetitionPageDoubleUp from './tft/homepagedouble.jsx';
import PowerRankingTFTDouble from './tft/ranking.jsx';
import MatchStatLOL from './leagueoflegend/match.jsx';
import TeamRegistrationValorantForm from './valorant/registerfor_1.jsx';
import CompetitionPage from './valorant/homepage.jsx';
import TournamentBracketAOV16_1 from './arenaofvalor/bracket_16team_1.jsx';
import MatchInterface from './valorant/test2.jsx';
import CreateMatch from './valorant/test.jsx';
import TFTMatch from './tft/day1.jsx';
import CombinedLeaderboard from './tft/test.jsx';
import GrandFinalTFT from './tft/day2.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import MemberPage from './tft/allplayer.jsx';
import RulebookAll from './components/rule.jsx';
import Leaderboard from './tft/leaderboard.jsx';
import BracketPage from './components/bracket.jsx';
// Check if the root element exists
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={null}>
        <BrowserRouter>
          <Routes>
            {/* Route KHÔNG có Navbar */}
            <Route path="/:game/:league_id" element={<TFThompage />} />
            <Route path="/:game/:league_id/players" element={<MemberPage />} />
            <Route path="/:game/:league_id/rule" element={<RulebookAll />} />
            <Route path="/:game/:league_id/leaderboard" element={<Leaderboard />} />
            <Route path="/:game/:league_id/bracket" element={<BracketPage />} />
            {/* Routes CÓ Navbar + Footer */}
            <Route
              path="*"
              element={
                <>
                  <Navbar />
                  <Routes>
                    <Route exact path="/rsotest" element={<RSO_Authorization />} />
                    <Route exact path="/" element={<Home />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/valorant" element={<CompetitionPage />} />
                    <Route path="/valorant/rule" element={<Rule />} />
                    <Route path="/valorant/test/createbanpick" element={<CreateMatch />} />
                    <Route path="/match/:matchId/:role" element={<MatchInterface />} />
                    <Route path="/valorant/test/special" element={<TournamentBracketLOL />} />
                    <Route path="/valorant/match/:round/:Match" element={<MatchStat />} />
                    <Route path="/valorant/inputmatch" element={<Inputmatchid />} />
                    <Route path="/valorant/swissstage" element={<SwissStage />} />
                    <Route path="/valorant/doubleup" element={<PlayoffValo />} />
                    <Route path="/leagueoflegend/soloyasuo" element={<SwissStageLOL />} />
                    <Route path="/leagueoflegend/match" element={<MatchStatLOL />} />
                    <Route path="/arenaofvalor" element={<HomepageAOV />} />
                    <Route path="/tft/grandfinal" element={<GrandFinalTFT />} />
                    <Route path="/tft/ranking/total/:day" element={<CombinedLeaderboard />} />
                    <Route path="/tft/ranking/:day" element={<TFTMatch />} />
                    <Route path="/tftdouble" element={<CompetitionPageDoubleUp />} />
                    <Route path="/tftdouble/ranking" element={<PowerRankingTFTDouble />} />
                    <Route path="/register" element={<TeamRegistrationForm />} />
                    <Route path="/arenaofvalor/luatle" element={<RuleAOV />} />
                    <Route path="/arenaofvalor/ranking" element={<PowerRankingAOV />} />
                    <Route path="/arenaofvalor/pickem/welcome" element={<WelcomePage />} />
                    <Route path="/arenaofvalor/playin" element={<PlayinAOV />} />
                    <Route path="/arenaofvalor/playoff" element={<TournamentBracketAOV />} />
                    <Route path="/arenaofvalor/match/:round/:Match" element={<MatchStatAOV />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/tos" element={<TermsOfService />} />
                    <Route path="/arenaofvalor/halloffame" element={<HallOfFameAOV />} />
                    <Route path="/valorant/halloffame" element={<HallOfFameValo />} />
                    <Route path="/lol/hudgame" element={<LiveGameDataLOL />} />
                    <Route path="/arenaofvalor/vong1" element={<TournamentBracketAOV16_1 />} />
                    <Route path="/arenaofvalor/vong2" element={<TournamentBracketAOV16 />} />
                    <Route element={<PrivateRoute />}>
                      <Route
                        path="/arenaofvalor/pickem/pickemmatch"
                        element={<PickemChallengeMatch />}
                      />
                      <Route
                        path="/valwdadw/:league_id/register"
                        element={<TeamRegistrationValorantForm />}
                      />
                      <Route path="/arenaofvalor/register" element={<TeamRegistrationFormAOV />} />
                      <Route path="/:game/:league_id/register" element={<TFTRegister />} />
                      <Route
                        path="/tft/registerdouble"
                        element={<TeamRegistrationTFTDoubleForm />}
                      />
                      <Route
                        path="/arenaofvalor/pickem/leaderboard"
                        element={<LeaderboardComponent />}
                      />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/arenaofvalor/pickem/pickemall" element={<PickemChallenge />} />
                    </Route>
                  </Routes>
                  <Footer />
                </>
              }
            />
          </Routes>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
} else {
  console.error(
    "Root element not found. Make sure there is an element with id='root' in your HTML."
  );
}
