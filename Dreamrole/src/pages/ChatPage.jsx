import { useState, useEffect, useRef } from 'react'
import { authFetch } from '../lib/api'
import { useLocation } from 'react-router-dom'
import {
    Send, MessageSquare, RefreshCw, User, Shield, GraduationCap,
    Search, AlertCircle, Smile, ArrowLeft, Clock
} from 'lucide-react'

// ── Design tokens (Dark Glassmorphism) ─────────────────────────────────────────
const CARD = 'rgba(255,255,255,0.03)'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#f1f5f9'
const MUTED = 'rgba(255,255,255,0.45)'
const ACCENT = '#6366f1'
const GREEN = '#22c55e'
const RED = '#ef4444'
const PURPLE = '#a855f7'

export default function ChatPage() {
    const location = useLocation()
    const messagesEndRef = useRef(null)

    // State Variables
    const [conversations, setConversations] = useState([])
    const [messages, setMessages] = useState([])
    const [selectedPartner, setSelectedPartner] = useState(null)
    
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [inputText, setInputText] = useState('')
    const [sending, setSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSyncing, setIsSyncing] = useState(false)

    // Query parameters holder (if user clicked "Connect & Chat")
    const [queryPartner, setQueryPartner] = useState(null)

    // Parse query params on load/redirect
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const recipientId = params.get('recipientId')
        const name = params.get('name')
        if (recipientId && name) {
            setQueryPartner({
                uid: recipientId,
                name: decodeURIComponent(name),
                role: 'mentor', // Fallback assumption, will be verified
                lastMessage: '',
                lastMessageAt: null
            })
        }
    }, [location.search])

    // Fetch conversations list
    const fetchConversations = async (autoSelectId = null) => {
        try {
            const res = await authFetch('/api/chat/conversations')
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    let list = data.conversations || []
                    
                    // If we have a queryPartner from URL, check if they are already in the conversations list
                    if (queryPartner) {
                        const exists = list.some(c => c.uid === queryPartner.uid)
                        if (!exists) {
                            // Insert queryPartner at the top of the conversations list
                            list = [queryPartner, ...list]
                        }
                    }

                    setConversations(list)

                    // Auto-select logic
                    const currentSelectionId = autoSelectId || selectedPartner?.uid || queryPartner?.uid
                    if (currentSelectionId) {
                        const partner = list.find(c => c.uid === currentSelectionId)
                        if (partner) {
                            setSelectedPartner(partner)
                        } else if (queryPartner && currentSelectionId === queryPartner.uid) {
                            setSelectedPartner(queryPartner)
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch conversations:', err)
        } finally {
            setLoadingConversations(false)
        }
    }

    // Fetch conversation messages
    const fetchMessages = async (partnerId) => {
        if (!partnerId) return
        try {
            const res = await authFetch(`/api/chat/messages?recipientId=${partnerId}`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setMessages(data.messages || [])
                }
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err)
        }
    }

    // Load conversations on mount
    useEffect(() => {
        fetchConversations()
    }, [queryPartner])

    // Load message history when partner selection changes
    useEffect(() => {
        if (!selectedPartner?.uid) {
            setMessages([])
            return
        }
        setLoadingMessages(true)
        fetchMessages(selectedPartner.uid).finally(() => setLoadingMessages(false))
    }, [selectedPartner?.uid])

    // Polling message sync loop every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (selectedPartner?.uid) {
                fetchMessages(selectedPartner.uid)
            }
            // Silent refresh conversations list to update snippets/unreads
            authFetch('/api/chat/conversations')
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        let list = data.conversations || []
                        if (queryPartner && !list.some(c => c.uid === queryPartner.uid)) {
                            list = [queryPartner, ...list]
                        }
                        setConversations(list)
                    }
                })
                .catch(console.error)
        }, 5000)

        return () => clearInterval(interval)
    }, [selectedPartner?.uid, queryPartner])

    // Auto-scroll messages to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Manual Refresh/Sync
    const handleSync = async () => {
        setIsSyncing(true)
        if (selectedPartner?.uid) {
            await fetchMessages(selectedPartner.uid)
        }
        await fetchConversations()
        setTimeout(() => setIsSyncing(false), 800)
    }

    // Send a message
    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!inputText.trim() || !selectedPartner?.uid) return
        
        setSending(true)
        const textToSend = inputText.trim()
        setInputText('')

        try {
            const res = await authFetch('/api/chat/message', {
                method: 'POST',
                body: JSON.stringify({
                    receiverId: selectedPartner.uid,
                    text: textToSend
                })
            })
            const data = await res.json()
            if (data.success) {
                // Instantly append sent message to message list
                setMessages(prev => [...prev, data.message])
                
                // Clear queryPartner state if it matched since they are now a real contact
                if (queryPartner && selectedPartner.uid === queryPartner.uid) {
                    setQueryPartner(null)
                }

                // Update conversations list snippet immediately
                setConversations(prev => prev.map(c => 
                    c.uid === selectedPartner.uid 
                        ? { ...c, lastMessage: textToSend, lastMessageAt: new Date().toISOString() } 
                        : c
                ))
            } else {
                alert(data.error || 'Failed to send message')
            }
        } catch (err) {
            console.error('Error sending message:', err)
        } finally {
            setSending(false)
        }
    }

    // Filter conversations list locally by search input
    const filteredConversations = conversations.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Formatted time helper
    const formatTime = (isoString) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const formatDateHeader = (isoString) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 16,
            height: 'calc(100vh - 120px)', color: TEXT, position: 'relative'
        }}>
            
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="section-heading flex items-center gap-2">
                        <MessageSquare size={22} className="text-indigo-400" /> Messaging Platform
                    </h1>
                    <p className="section-sub">Direct secure communication channel between linked Students and Industry Mentors.</p>
                </div>
                
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    style={{
                        padding: '8px 14px', borderRadius: 10, background: CARD,
                        border: `1px solid ${BORDER}`, color: TEXT, fontSize: 12,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                    }}
                >
                    <RefreshCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                    Sync Messages
                </button>
            </div>

            {/* Main Split Interface */}
            <div style={{
                display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16,
                flex: 1, minHeight: 0, height: '100%', alignItems: 'stretch'
            }}>
                
                {/* ── LEFT: Active Contacts list ── */}
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: 14,
                    background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 16,
                    height: '100%', boxSizing: 'border-box'
                }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} color={MUTED} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 12px 8px 30px', background: 'rgba(0,0,0,0.15)',
                                border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 12, outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{
                        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4
                    }}>
                        {loadingConversations ? (
                            <div style={{ textAlign: 'center', padding: 40, color: MUTED }}>
                                <RefreshCw size={18} className="animate-spin" />
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const active = selectedPartner?.uid === conv.uid
                                const initials = conv.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'
                                return (
                                    <div
                                        key={conv.uid}
                                        onClick={() => setSelectedPartner(conv)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 14,
                                            background: active ? 'rgba(99,102,241,0.08)' : 'transparent',
                                            border: `1px solid ${active ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                            if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.015)'
                                        }}
                                        onMouseLeave={e => {
                                            if (!active) e.currentTarget.style.background = 'transparent'
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div style={{
                                            width: 38, height: 38, borderRadius: '50%',
                                            background: conv.role === 'mentor' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'rgba(99,102,241,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 13, fontWeight: 700, color: conv.role === 'mentor' ? '#fff' : '#a5b4fc',
                                            border: conv.role === 'mentor' ? 'none' : '1px solid rgba(99,102,241,0.25)',
                                            flexShrink: 0
                                        }}>
                                            {initials}
                                        </div>

                                        {/* Body */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: TEXT, truncate: true }}>{conv.name}</p>
                                                {conv.lastMessageAt && (
                                                    <span style={{ fontSize: 9, color: MUTED }}>{formatTime(conv.lastMessageAt)}</span>
                                                )}
                                            </div>
                                            <p style={{
                                                margin: 0, fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                            }}>
                                                {conv.lastMessage || 'Start conversation...'}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        )}

                        {filteredConversations.length === 0 && !loadingConversations && (
                            <div style={{ textAlign: 'center', padding: '40px 10px', color: MUTED, fontSize: 12 }}>
                                <MessageSquare size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                                No active discussions.
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Chat Screen ── */}
                <div style={{
                    background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20,
                    display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%'
                }}>
                    
                    {selectedPartner ? (
                        <>
                            {/* Selected Partner Header */}
                            <div style={{
                                padding: '14px 20px', borderBottom: `1px solid ${BORDER}`,
                                display: 'flex', justifyItems: 'center', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        background: selectedPartner.role === 'mentor' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0
                                    }}>
                                        {selectedPartner.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT }}>{selectedPartner.name}</p>
                                        <p style={{ margin: 0, fontSize: 10, color: MUTED }}>{selectedPartner.email}</p>
                                    </div>
                                </div>

                                {/* Role Chip */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{
                                        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                                        background: selectedPartner.role === 'mentor' ? `${PURPLE}18` : `${ACCENT}18`,
                                        color: selectedPartner.role === 'mentor' ? '#c084fc' : '#818cf8',
                                        border: `1px solid ${selectedPartner.role === 'mentor' ? PURPLE + '30' : ACCENT + '30'}`,
                                        textTransform: 'uppercase', letterSpacing: '0.04em'
                                    }}>
                                        {selectedPartner.role}
                                    </span>
                                </div>
                            </div>

                            {/* Messaging history viewport */}
                            <div style={{
                                flex: 1, overflowY: 'auto', padding: 20,
                                display: 'flex', flexDirection: 'column', gap: 12,
                                background: 'rgba(0,0,0,0.1)'
                            }}>
                                {loadingMessages ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: ACCENT }}>
                                        <RefreshCw size={24} className="animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((msg, index) => {
                                            const isMe = msg.senderId !== selectedPartner.uid
                                            const showDateHeader = index === 0 || 
                                                new Date(messages[index - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString()
                                            
                                            return (
                                                <div key={msg._id || index} style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {showDateHeader && (
                                                        <div style={{
                                                            alignSelf: 'center', margin: '14px 0 10px',
                                                            fontSize: 10, fontWeight: 700, color: MUTED,
                                                            background: 'rgba(255,255,255,0.02)', padding: '3px 10px',
                                                            borderRadius: 20, border: `1px solid ${BORDER}`
                                                        }}>
                                                            {formatDateHeader(msg.createdAt)}
                                                        </div>
                                                    )}
                                                    <div style={{
                                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                        maxWidth: '70%', display: 'flex', flexDirection: 'column',
                                                        alignItems: isMe ? 'flex-end' : 'flex-start'
                                                    }}>
                                                        <div style={{
                                                            padding: '10px 14px', borderRadius: 16,
                                                            borderBottomRightRadius: isMe ? 4 : 16,
                                                            borderBottomLeftRadius: isMe ? 16 : 4,
                                                            background: isMe ? ACCENT : 'rgba(255,255,255,0.04)',
                                                            border: isMe ? 'none' : `1px solid ${BORDER}`,
                                                            color: TEXT, fontSize: 13, lineHeight: 1.5,
                                                            wordBreak: 'break-word'
                                                        }}>
                                                            {msg.text}
                                                        </div>
                                                        <span style={{ fontSize: 9, color: MUTED, marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                            <Clock size={9} /> {formatTime(msg.createdAt || new Date().toISOString())}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            {/* Message input footer */}
                            <form onSubmit={handleSendMessage} style={{
                                padding: 16, borderTop: `1px solid ${BORDER}`,
                                display: 'flex', gap: 10, background: 'rgba(255,255,255,0.01)'
                            }}>
                                <input
                                    type="text"
                                    placeholder={`Send message to ${selectedPartner.name}...`}
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    style={{
                                        flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.25)',
                                        border: `1px solid ${BORDER}`, borderRadius: 12,
                                        color: TEXT, fontSize: 13, outline: 'none'
                                    }}
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !inputText.trim()}
                                    style={{
                                        width: 38, height: 38, borderRadius: 12,
                                        background: inputText.trim() ? ACCENT : 'rgba(255,255,255,0.02)',
                                        border: 'none', color: '#fff', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s', flexShrink: 0
                                    }}
                                >
                                    <Send size={15} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            flex: 1, padding: 40, textAlign: 'center', color: MUTED
                        }}>
                            <MessageSquare size={44} style={{ opacity: 0.2, marginBottom: 14 }} color={ACCENT} />
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>No Chat Session Selected</h3>
                            <p style={{ fontSize: 12, maxWidth: 320, margin: 0, lineHeight: 1.6 }}>
                                Select a mentor or student from your active contacts sidebar on the left, or initiate a connection from the Discover page.
                            </p>
                        </div>
                    )}
                </div>

            </div>
            
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}
