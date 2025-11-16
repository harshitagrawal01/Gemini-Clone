import React, { useState, useEffect } from "react";
import "./Main.css";
import { assets } from "../../assets/assets";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";

const Main = ({ savedChats = [], setSavedChats, }) => {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]); // chat currently displayed
    const [loading, setLoading] = useState(false);
    const [showCards, setShowCards] = useState(true);
    const [typingText, setTypingText] = useState("");

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 512,
        },
    });

    // --- Load last current chat from localStorage on mount ---
    useEffect(() => {
        const raw = localStorage.getItem("currentChat");
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setMessages(parsed);
                    setShowCards(parsed.length === 0);
                }
            } catch (e) {
                // ignore parse errors
            }
        }
    }, []);

    // --- Persist current chat whenever messages change ---
    useEffect(() => {
        localStorage.setItem("currentChat", JSON.stringify(messages));
    }, [messages]);

    // --- Listen for sidebar loadSavedChat events ---
    useEffect(() => {
        const handler = (e) => {
            const item = e.detail;
            if (!item) return;
            // load the saved chat (no API call)
            setShowCards(false);
            if (item.chat && Array.isArray(item.chat)) {
                setMessages(item.chat);
            } else {
                // fallback: show prompt/response as two messages
                const arr = [];
                if (item.prompt) arr.push({ role: "user", text: item.prompt });
                if (item.response) arr.push({ role: "gemini", text: item.response });
                setMessages(arr);
            }
        };
        window.addEventListener("loadSavedChat", handler);
        return () => window.removeEventListener("loadSavedChat", handler);
    }, []);

    // helper: save a completed chat entry into savedChats (auto-save)
    // ---------------------------------------------------------
    // AUTO SAVE CHAT – FINAL WORKING VERSION (NO DUPLICATION)
    // ---------------------------------------------------------
    const autoSaveChat = (prompt, response) => {
        const saved = JSON.parse(localStorage.getItem("savedChats")) || [];

        // Check if exact prompt already saved
        const exists = saved.some(
            (chat) => chat.prompt.trim().toLowerCase() === prompt.trim().toLowerCase()
        );

        if (exists) return; // prevent duplicates

        const newChat = {
            id: Date.now(),
            prompt,
            response,
            chat: [
                { role: "user", text: prompt },
                { role: "gemini", text: response }
            ],
            timestamp: new Date().toISOString()
        };

        const updated = [newChat, ...saved];

        // UPDATE ONLY LOCAL STORAGE — DO NOT UPDATE setSavedChats() here
        localStorage.setItem("savedChats", JSON.stringify(updated));

        // tell App.jsx that a new chat was saved
        window.dispatchEvent(
            new CustomEvent("savedChatsUpdated", { detail: updated })
        );
    };



    const handleSend = async () => {
        if (!input.trim()) return;

        setShowCards(false);
        const userPromptText = input; // capture before clearing
        const userMessage = { role: "user", text: userPromptText };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);
        setTypingText("");

        try {
            const chat = model.startChat({
                history: messages.map((msg) => ({
                    role: msg.role === "gemini" ? "model" : "user",
                    parts: [{ text: msg.text }],
                })),
            });


            const result = await chat.sendMessage(userPromptText);
            const text = result.response.text();

            // Typing animation effect
            let index = 0;
            setTypingText("");
            const interval = setInterval(() => {
                setTypingText(text.slice(0, index));
                index++;
                if (index > text.length) {
                    clearInterval(interval);
                    // add final AI message
                    const aiMessage = { role: "gemini", text };
                    setMessages((prev) => {
                        const newMessages = [...prev, aiMessage];
                        // auto-save this completed chat
                        autoSaveChat(userPromptText, text, newMessages);
                        return newMessages;
                    });
                    setTypingText("");
                }
            }, 20); // typing speed
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                { role: "gemini", text: "⚠️ Something went wrong. Please try again." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main">
            {/* Navbar */}
            <div className="nav">
                <p>Gemini</p>
                <img src={assets.user_icon} alt="" />
            </div>

            <div className="main-container">
                {showCards && (
                    <>
                        <div className="greet">
                            <p>
                                <span>Hello, Harshit.</span>
                            </p>
                            <p>How can I help you today?</p>
                        </div>

                        <div className="cards">
                            <div className="card" onClick={() => setInput("Suggest beautiful places to see on an upcoming road trip")}>
                                <p>Suggest beautiful places to see on an upcoming road trip</p>
                                <img src={assets.compass_icon} alt="" />
                            </div>

                            <div className="card" onClick={() => setInput("Briefly summarise this concept: urban planning ")}>
                                <p>Briefly summarise this concept: urban planning</p>
                                <img src={assets.bulb_icon} alt="" />
                            </div>

                            <div className="card" onClick={() => setInput("Brainstorm team bonding activities for our work retreat")}>
                                <p>Brainstorm team bonding activities for our work retreat</p>
                                <img src={assets.message_icon} alt="" />
                            </div>

                            <div className="card" onClick={() => setInput("Improve the readability of the following code")}>
                                <p>Improve the readability of the following code</p>
                                <img src={assets.code_icon} alt="" />
                            </div>

                        </div>
                    </>
                )}

                {/* Chat area */}
                <div className="chat-area">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`chat-message ${msg.role === "user" ? "user-message" : "ai-message"
                                }`}
                        >
                            <img
                                src={
                                    msg.role === "user"
                                        ? assets.user_icon
                                        : assets.gemini_icon || assets.bulb_icon
                                }
                                alt=""
                                className="chat-icon"
                            />
                            <div className="chat-text">
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                        </div>
                    ))}

                    {/* Loader while waiting */}
                    {loading && !typingText && (
                        <div className="ai-message">
                            <img
                                src={assets.gemini_icon || assets.bulb_icon}
                                alt=""
                                className="chat-icon"
                            />
                            <div className="loader">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
                        </div>
                    )}

                    {/* Typing effect while generating response */}
                    {typingText && (
                        <div className="ai-message">
                            <img
                                src={assets.gemini_icon || assets.bulb_icon}
                                alt=""
                                className="chat-icon"
                            />
                            <div className="chat-text typing">
                                <ReactMarkdown>{typingText}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input area */}
                <div className="main-bottom">
                    <div className="search-box">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            type="text"
                            placeholder="Enter a prompt here"
                        />
                        <div>
                            <img src={assets.gallery_icon} alt="" />
                            <img src={assets.mic_icon} alt="" />
                            <img
                                onClick={handleSend}
                                style={{ cursor: "pointer" }}
                                src={assets.send_icon}
                                alt="send"
                            />
                        </div>
                    </div>

                    <p className="bottom-info">
                        Gemini may display inaccurate info, including about people, so double
                        check its responses. Your privacy and Gemini Apps.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Main;




