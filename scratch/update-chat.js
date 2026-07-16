const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../components/ChatInterface.tsx');
let content = fs.readFileSync(file, 'utf8');

const overlayIndex = content.indexOf('Name Gate Overlay');
if (overlayIndex !== -1) {
  const returnIndex = content.lastIndexOf('return (', overlayIndex);
  if (returnIndex !== -1) {
    const newRender = `return (
    <div className="h-screen flex bg-bg font-sans text-sm relative overflow-hidden text-text-primary">

      {/* Name Gate Overlay */}
      {!nameSet && !isInitializing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-border shadow-[var(--shadow-card)] rounded-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-2">Who are we cloning?</h2>
            <p className="text-text-muted mb-6">Confirm your name to begin.</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Full name…"
                autoFocus
                className="ssInput"
              />
              <button 
                onClick={saveName} 
                disabled={nameSaving || !nameInput.trim()}
                className="btnPrimary shrink-0"
              >
                {nameSaving ? 'Starting…' : 'Begin →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar (Dark Mode style) */}
      {nameSet && (
        <aside className="hidden lg:flex w-[260px] shrink-0 bg-[var(--color-sidebar-bg)] border-r border-[var(--color-sidebar-border)] text-[var(--color-sidebar-text)] flex-col">
          <div className="p-4 flex items-center justify-between border-b border-[var(--color-sidebar-border)]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center bg-white text-black font-bold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              </span>
              <span className="font-bold tracking-tight">Shadow Shelf</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto sidebar-scroll p-3 flex flex-col gap-6 mt-2">
            
            <div className="flex flex-col gap-1">
              <Link href="/home" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Home
              </Link>
              <Link href="/train" className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors \${mode === 'onboarding' ? 'bg-[var(--color-sidebar-hover)] text-white' : 'text-[var(--color-sidebar-muted)] hover:text-white'}\`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                The Interviewer
              </Link>
              <Link href="/clone" className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors \${mode === 'clone' ? 'bg-[var(--color-sidebar-hover)] text-white' : 'text-[var(--color-sidebar-muted)] hover:text-white'}\`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>
                The Replica
              </Link>
              <Link href="/jarvis" className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors \${mode === 'jarvis' ? 'bg-[var(--color-sidebar-hover)] text-white' : 'text-[var(--color-sidebar-muted)] hover:text-white'}\`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                Jarvis Mode
              </Link>
            </div>

            {userState && (
              <div className="px-3">
                <div className="text-[11px] font-bold tracking-wider text-[var(--color-sidebar-muted)] uppercase mb-3">Trust Depth</div>
                <div className="bg-[var(--color-sidebar-surface)] rounded-xl p-4 border border-[var(--color-sidebar-border)]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-white">Level {userState.depthRung}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div
                        key={level}
                        className={\`h-1.5 flex-1 rounded-full \${level <= userState.depthRung ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-sidebar-border)]'}\`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {personality && (
              <div className="px-3">
                <div className="text-[11px] font-bold tracking-wider text-[var(--color-sidebar-muted)] uppercase mb-3">Clone Profile</div>
                <PersonalityStats personality={personality} completeness={completeness} onDeleteTrait={deleteTrait} />
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[var(--color-sidebar-border)]">
            <UserMenu name={userState?.name} showIdentity={true} />
          </div>
        </aside>
      )}

      {/* Main Chat Area (Light Mode style) */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-bg">
        
        {/* Top Header */}
        <header className="h-[60px] border-b border-border bg-white/80 backdrop-blur-md shrink-0 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span className="font-bold text-[var(--color-accent-text)] text-lg tracking-tight">
              {mode === 'clone' ? 'The Replica' : mode === 'jarvis' ? 'Jarvis' : 'The Interviewer'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isJarvis && (
              <Link href={isClone ? "/train" : "/clone"} className="btnPrimary hidden sm:inline-flex">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {isClone ? 'Train' : 'Talk'}
              </Link>
            )}
            <Link href="/settings" className="btnSecondary hidden sm:inline-flex bg-white border border-border !text-black shadow-sm hover:bg-surface">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Settings
            </Link>
          </div>
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto chat-scroll flex justify-center pb-[180px]">
          <div className="w-full max-w-3xl p-4 sm:p-8 flex flex-col gap-6">
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                role={msg.role}
                content={msg.content}
                mode={mode}
                name={userState?.name || undefined}
                turnGoal={msg.turnGoal}
                messageId={msg.messageId}
                memoriesUsed={msg.memoriesUsed}
                depthRung={(userState?.depthRung as any) || 1}
              />
            ))}
            {loading && <ChatBubble role="assistant" content="" mode={mode} isTyping depthRung={(userState?.depthRung as any) || 1} />}
            <div ref={chatEndRef} className="h-4" />
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
          <div className="w-full max-w-3xl bg-[var(--color-surface)] border border-border shadow-[var(--shadow-input)] rounded-[32px] p-2 pl-6 flex items-center pointer-events-auto">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!loading) sendMessage(input) } }}
              placeholder={isClone ? "Say something…" : isJarvis ? "type your prompt here" : "Share your thoughts…"}
              rows={1}
              className="flex-1 bg-transparent border-none text-text-primary text-[15px] focus:outline-none resize-none max-h-32 leading-[40px] m-0 p-0 placeholder:text-text-faint overflow-y-auto"
            />
            <div className="flex items-center gap-2 pr-1 h-[40px] shrink-0">
              <button
                onClick={() => setVoiceEnabled(v => !v)}
                className={\`w-10 h-10 rounded-full flex items-center justify-center transition-colors \${voiceEnabled ? 'text-[var(--color-accent-text)]' : 'text-text-faint hover:text-text-primary'}\`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {voiceEnabled ? (
                    <path d="M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  ) : (
                    <path d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
                  )}
                </svg>
              </button>
              <VoiceInput onTranscription={sendMessage} mode={mode} disabled={loading} />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className={\`w-10 h-10 rounded-full flex items-center justify-center transition-colors \${input.trim() && !loading ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)] hover:opacity-90' : 'bg-border text-text-faint cursor-not-allowed'}\`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
`;
    content = content.substring(0, returnIndex) + newRender;
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated components/ChatInterface.tsx safely using manual indices");
  } else {
    console.error("return( not found before Name Gate Overlay");
  }
} else {
  console.error("Name Gate Overlay not found");
}
