import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import Main from './components/Main/Main'

const App = () => {

  // sidebar toggle state for mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const [savedChats, setSavedChats] = useState(() => {
    const raw = localStorage.getItem("savedChats");
    return raw ? JSON.parse(raw) : [];
  });

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
      <Sidebar 
        savedChats={savedChats}
        onLoadChat={(chat) => {
          window.dispatchEvent(new CustomEvent("loadSavedChat", { detail: chat }));
        }}
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <Main 
        savedChats={savedChats} 
        setSavedChats={setSavedChats}
        toggleSidebar={toggleSidebar}
      />
    </>
  )
}

export default App



