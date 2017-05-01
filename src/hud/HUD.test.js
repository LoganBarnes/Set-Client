import React from 'react';
import ReactDOM from 'react-dom';
import HUD from './HUD.js';

it('HUD renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<HUD />, div);
});
