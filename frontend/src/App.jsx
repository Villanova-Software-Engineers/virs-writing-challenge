import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import AdminNavBar from "./components/AdminNavBar";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import MessageBoard from "./components/MessageBoard";
import Leaderboard from "./components/Leaderboard";
import Admin from "./components/Admin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin layout — own navbar */}
        <Route
          path="/admin/*"
          element={
            <div className="flex min-h-screen">
              <AdminNavBar />
              <main className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Admin />} />
                </Routes>
              </main>
            </div>
          }
        />

        {/* Main app layout */}
        <Route
          path="/*"
          element={
            <div className="flex min-h-screen">
              <NavBar />
              <main className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/messages" element={<MessageBoard />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
