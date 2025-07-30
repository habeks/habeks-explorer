import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import './styles/cyberpunk.css';

function App() {
  return (
    <Router>
      <div className="App">
        <AppLayout />
      </div>
    </Router>
  );
}

export default App;