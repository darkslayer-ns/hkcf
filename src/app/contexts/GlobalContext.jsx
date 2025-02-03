'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';

const GlobalContext = createContext();

const DEFAULT_TITLE = 'Global Hell Raisers';
const DEFAULT_SUBTITLE = 'See who else from your box is a Global Hell Raiser!';

export function GlobalProvider({ children }) {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);

  // Hell Raiser details (starts null, will be set later)
  const [boxHandlerStep, setBoxHandlerStep] = useState(null);

  // Hell Raiser details (starts null, will be set later)
  const [hellRaiser, setHellRaiser] = useState(null);

  // Selected Box (starts null, set when user selects a box)
  const [selectedBox, setSelectedBox] = useState(null);

  // Refs to prevent unnecessary updates
  const hasSetTitle = useRef(false);
  const hasSetSubtitle = useRef(false);

  useEffect(() => {
    if (!title && !hasSetTitle.current) {
      hasSetTitle.current = true;
      setTitle(DEFAULT_TITLE);
    }
  }, [title]);

  useEffect(() => {
    if (!subtitle && !hasSetSubtitle.current) {
      hasSetSubtitle.current = true;
      setSubtitle(DEFAULT_SUBTITLE);
    }
  }, [subtitle]);

  return (
    <GlobalContext.Provider value={{ 
      title, setTitle, 
      subtitle, setSubtitle, 
      boxHandlerStep, setBoxHandlerStep,
      hellRaiser, setHellRaiser, 
      selectedBox, setSelectedBox
    }}>
      {children}
    </GlobalContext.Provider>
  );
}

export const useGlobal = () => useContext(GlobalContext);
