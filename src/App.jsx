import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import Main from './components/Main/Main'

const App = () => {
  const [savedChats, setSavedChats] = useState(() => {
    const raw = localStorage.getItem("savedChats");
    return raw ? JSON.parse(raw) : [];
  });
  
  // persist savedChats
  useEffect(() => {
    localStorage.setItem("savedChats", JSON.stringify(savedChats));
  }, [savedChats]);

  useEffect(() => {
    const handleUpdate = (e) => {
      setSavedChats(e.detail);
    };

    window.addEventListener("savedChatsUpdated", handleUpdate);
    return () => window.removeEventListener("savedChatsUpdated", handleUpdate);
  }, []);

  

  return (
    <>
      <Sidebar savedChats={savedChats} onLoadChat={(chat) => {
        // emit a custom event so Main (which is sibling) can load it
        window.dispatchEvent(new CustomEvent("loadSavedChat", { detail: chat }));
      }} />
      <Main savedChats={savedChats} setSavedChats={setSavedChats} />
    </>
  )
}

export default App


