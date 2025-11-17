import React, { useState, useEffect } from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'

const Sidebar = ({ savedChats = [], onLoadChat }) => {
    const [extended, setExtended] = useState(false)
    const [localSaved, setLocalSaved] = useState([]);

    useEffect(() => {
        setLocalSaved(savedChats);
    }, [savedChats]);

    return (
        <div className='sidebar'>
            <div className="top">
                <img onClick={() => setExtended(prev => !prev)} className='menu' src={assets.menu_icon} alt="" />
                <div className="new-chat">
                    <img src={assets.plus_icon} alt="" />
                    {extended ? <p>New Chat</p> : null}
                </div>

                {extended ? (
                    <div className="recent">
                        <p className="recent-title">Recent</p>

                        {localSaved.length === 0 ? (
                            <div className="recent-entry">
                                <img src={assets.message_icon} alt="" />
                                <p>No saved chats</p>
                            </div>
                        ) : (
                            localSaved.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="recent-entry"
                                    onClick={() => onLoadChat(item)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <img src={assets.message_icon} alt="" />
                                    <p>{(item.prompt || "").slice(0, 30)}{(item.prompt && item.prompt.length > 30) ? "..." : ""}</p>
                                </div>

                            ))

                        )}
                        <button
                            className="delete-btn"
                            onClick={() => {
                                localStorage.removeItem("savedChats");
                                window.dispatchEvent(new CustomEvent("savedChatsUpdated", { detail: [] }));
                            }}
                        >
                            Clear History
                        </button>

                    </div>
                ) : null}
            </div>

            <div className="bottom">
                <div className="bottom-item recent-entry">
                    <img src={assets.question_icon} alt="" />
                    {extended ? <p>Help</p> : null}
                </div>
                <div className="bottom-item recent-entry">
                    <img src={assets.history_icon} alt="" />
                    {extended ? <p>Activity</p> : null}
                </div>
                <div className="bottom-item recent-entry">
                    <img src={assets.setting_icon} alt="" />
                    {extended ? <p>Settings</p> : null}
                </div>
            </div>
        </div>
    )
}

export default Sidebar

