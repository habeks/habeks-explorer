import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import CyberpunkLayout from './components/Layout/CyberpunkLayout';
import './styles/cyberpunk.css';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <CyberpunkLayout />
      </div>
    </Router>
  );
}

export default App;