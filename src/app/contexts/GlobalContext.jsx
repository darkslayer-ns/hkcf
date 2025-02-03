'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const GlobalContext = createContext();

const DEFAULT_TITLE = 'Global Hell Raisers';
const DEFAULT_SUBTITLE = 'See who else from your box is a Global Hell Raiser!';

export function GlobalProvider({ children }) {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);

  useEffect(() => {
    if (!title) setTitle(DEFAULT_TITLE);
  }, [title]);

  useEffect(() => {
    if (!subtitle) setSubtitle(DEFAULT_SUBTITLE);
  }, [subtitle]);

  return (
    <GlobalContext.Provider value={{
      title,
      setTitle,
      subtitle,
      setSubtitle
    }}>
      {children}
    </GlobalContext.Provider>
  );
}

export const useGlobal = () => useContext(GlobalContext);