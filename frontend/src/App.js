// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CustomerSearch from './components/ParticularSearch';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <h1>AML Detection System</h1>
            <div className="user-info">
              <span className="user-name">Admin User</span>
              <button className="logout-button">Logout</button>
            </div>
          </div>
        </header>
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze-customer" element={<CustomerSearch />} />
            {/* Redirect any unknown paths to the dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <p>Anti-Money Laundering Detection System &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;