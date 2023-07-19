import { Routes, Route } from 'react-router-dom';
import Navigation from './Navigation';
import Conversation from './conversation/Conversation';
import About from './About';
import { useState } from 'react';
import { ActiveState } from './models/misc';
import { inject } from '@vercel/analytics';

inject();

export default function App() {
  //TODO : below media query is disjoint from tailwind. Please wire it together.
  const [navState, setNavState] = useState<ActiveState>(
    window.matchMedia('(min-width: 768px)').matches ? 'ACTIVE' : 'INACTIVE',
  );

  return (
    <div className=" flex min-h-full min-w-full">
      <div  >
      <Navigation navState={navState} setNavState={setNavState} />
      </div>

      <div>
        <Routes>
          <Route path="/" element={<Conversation />} />
          <Route path="/about" element={<About />} />
        </Routes>
        </div>
      </div>
  
  );
}
