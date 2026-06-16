// Global App State
let state = {
    updates: [],
    selectedNoteId: null,
    activeFilter: 'all',
    searchQuery: '',
    isLoading: false
};

// DOM Elements
const elements = {
    btnRefresh: document.getElementById('btnRefresh'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    searchInput: document.getElementById('searchInput'),
    filterPills: document.querySelectorAll('.filter-pill'),
    notesGrid: document.getElementById('notesGrid'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    actionPanel: document.getElementById('actionPanel'),
    selectedCount: document.getElementById('selectedCount'),
    btnActionTweet: document.getElementById('btnActionTweet'),
    btnActionClear: document.getElementById('btnActionClear'),
    tweetDrawer: document.getElementById('tweetDrawer'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    btnCloseDrawer: document.getElementById('btnCloseDrawer'),
    tweetTextarea: document.getElementById('tweetTextarea'),
    charCounter: document.getElementById('charCounter'),
    btnTweetNow: document.getElementById('btnTweetNow'),
    toastNotification: document.getElementById('toastNotification'),
    toastMessage: document.getElementById('toastMessage')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchReleaseNotes();
});

// Event Listeners Setup
function setupEventListeners() {
    // Refresh button
    elements.btnRefresh.addEventListener('click', fetchReleaseNotes);

    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderUpdates();
    });

    // Filter pills
    elements.filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            elements.filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.activeFilter = pill.getAttribute('data-filter');
            renderUpdates();
        });
    });

    // Action Panel: Clear
    elements.btnActionClear.addEventListener('click', clearSelection);

    // Action Panel: Open Draft
    elements.btnActionTweet.addEventListener('click', () => {
        if (state.selectedNoteId) {
            const note = state.updates.find(n => n.id === state.selectedNoteId);
            if (note) openTweetDrawer(note);
        }
    });

    // Drawer close buttons
    elements.btnCloseDrawer.addEventListener('click', closeTweetDrawer);
    elements.drawerBackdrop.addEventListener('click', closeTweetDrawer);

    // Textarea input for character counting
    elements.tweetTextarea.addEventListener('input', (e) => {
        updateCharCount(e.target.value);
    });

    // Tweet Now button (Twitter Web Intent)
    elements.btnTweetNow.addEventListener('click', handleTweetSubmit);
}

// Fetch Release Notes from API
async function fetchReleaseNotes() {
    if (state.isLoading) return;
    
    setLoading(true);
    
    try {
        const response = await fetch('/api/notes');
        const data = await response.json();
        
        if (data.success) {
            state.updates = data.updates;
            clearSelection();
            renderUpdates();
            showToast('Release notes successfully updated!', 'success');
            
            // Update last updated status
            const now = new Date();
            elements.statusText.innerText = `Updated at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            elements.statusDot.className = 'status-dot';
        } else {
            throw new Error(data.error || 'Failed to fetch release notes');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        showToast(`Error: ${error.message}`, 'error');
        elements.statusText.innerText = 'Sync failed';
        elements.statusDot.className = 'status-dot';
    } finally {
        setLoading(false);
    }
}

// Loading UI Controller
function setLoading(loading) {
    state.isLoading = loading;
    if (loading) {
        elements.btnRefresh.classList.add('loading');
        elements.btnRefresh.disabled = true;
        elements.statusDot.className = 'status-dot loading';
        elements.statusText.innerText = 'Syncing...';
        elements.loadingState.style.display = 'flex';
        elements.notesGrid.style.display = 'none';
        elements.emptyState.style.display = 'none';
    } else {
        elements.btnRefresh.classList.remove('loading');
        elements.btnRefresh.disabled = false;
        elements.loadingState.style.display = 'none';
        elements.notesGrid.style.display = 'grid';
    }
}

// Strip HTML for clean tweet text representation
function stripHtml(html) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// Generate the initial draft tweet based on the selected update
function generateTweetDraft(note) {
    const rawContent = stripHtml(note.content);
    // Trim and remove extra whitespace/newlines
    const cleanContent = rawContent.replace(/\s+/g, ' ').trim();
    
    const intro = `New BigQuery ${note.type} (${note.date}): `;
    const link = `\n\nLink: ${note.link}`;
    
    // Calculate remaining characters for the summary
    // Character limit is 280
    const reservedLength = intro.length + link.length;
    const availableLength = 280 - reservedLength;
    
    let summary = cleanContent;
    if (summary.length > availableLength) {
        summary = summary.substring(0, availableLength - 3) + '...';
    }
    
    return `${intro}${summary}${link}`;
}

// Render the updates in the grid
function renderUpdates() {
    // Filter updates
    const filtered = state.updates.filter(note => {
        // Filter by badge type
        if (state.activeFilter !== 'all') {
            if (note.type.toLowerCase() !== state.activeFilter) {
                return false;
            }
        }
        
        // Filter by search query
        if (state.searchQuery) {
            const dateMatch = note.date.toLowerCase().includes(state.searchQuery);
            const typeMatch = note.type.toLowerCase().includes(state.searchQuery);
            const contentMatch = note.content.toLowerCase().includes(state.searchQuery);
            return dateMatch || typeMatch || contentMatch;
        }
        
        return true;
    });

    // Check empty state
    if (filtered.length === 0) {
        elements.notesGrid.innerHTML = '';
        elements.emptyState.style.display = 'flex';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    
    // Populate Grid
    elements.notesGrid.innerHTML = filtered.map(note => {
        const isSelected = note.id === state.selectedNoteId;
        const badgeClass = getBadgeClass(note.type);
        
        return `
            <div class="note-card ${isSelected ? 'selected' : ''}" data-id="${note.id}">
                <div class="note-header">
                    <div class="note-meta">
                        <span class="note-badge ${badgeClass}">${note.type}</span>
                        <span class="note-date">${note.date}</span>
                    </div>
                    <div class="selection-indicator">
                        <svg width="12" height="12" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </div>
                
                <div class="note-content">
                    ${note.content}
                </div>
                
                <div class="note-footer">
                    <a href="${note.link}" target="_blank" class="note-source-link" onclick="event.stopPropagation()">
                        Source Docs
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                    <button class="btn-card-action btn-tweet-card" onclick="event.stopPropagation(); triggerCardTweet('${note.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Tweet
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Attach click events to cards
    document.querySelectorAll('.note-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.getAttribute('data-id');
            toggleNoteSelection(id);
        });
    });
}

// Helper to determine badge class
function getBadgeClass(type) {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('feature')) return 'badge-feature';
    if (lowerType.includes('issue')) return 'badge-issue';
    if (lowerType.includes('change')) return 'badge-change';
    if (lowerType.includes('deprecat')) return 'badge-deprecation';
    return 'badge-other';
}

// Toggle release note selection
function toggleNoteSelection(id) {
    if (state.selectedNoteId === id) {
        state.selectedNoteId = null;
    } else {
        state.selectedNoteId = id;
    }
    
    // Refresh Grid to show selected class changes
    renderUpdates();
    
    // Update Action Panel
    updateActionPanel();
}

// Directly compose a tweet for a specific card without multi-select toggling
function triggerCardTweet(id) {
    state.selectedNoteId = id;
    renderUpdates();
    updateActionPanel();
    
    const note = state.updates.find(n => n.id === id);
    if (note) {
        openTweetDrawer(note);
    }
}

// Clear currently selected note
function clearSelection() {
    state.selectedNoteId = null;
    renderUpdates();
    updateActionPanel();
}

// Update bottom action panel visibility
function updateActionPanel() {
    if (state.selectedNoteId !== null) {
        elements.selectedCount.innerText = '1';
        elements.actionPanel.classList.add('show');
    } else {
        elements.actionPanel.classList.remove('show');
    }
}

// Open the Tweet compose drawer
function openTweetDrawer(note) {
    const initialText = generateTweetDraft(note);
    elements.tweetTextarea.value = initialText;
    updateCharCount(initialText);
    
    elements.tweetDrawer.classList.add('open');
    elements.drawerBackdrop.classList.add('show');
    elements.tweetTextarea.focus();
}

// Close the Tweet compose drawer
function closeTweetDrawer() {
    elements.tweetDrawer.classList.remove('open');
    elements.drawerBackdrop.classList.remove('show');
}

// Update Tweet composer character count and validations
function updateCharCount(text) {
    const length = text.length;
    elements.charCounter.innerText = `${length} / 280`;
    
    // Twitter character count status colors
    if (length > 280) {
        elements.charCounter.className = 'char-counter danger';
        elements.btnTweetNow.disabled = true;
    } else if (length >= 250) {
        elements.charCounter.className = 'char-counter warning';
        elements.btnTweetNow.disabled = false;
    } else {
        elements.charCounter.className = 'char-counter';
        elements.btnTweetNow.disabled = false;
    }
}

// Open Tweet link in new window
function handleTweetSubmit() {
    const text = elements.tweetTextarea.value;
    if (text.length > 280) return;
    
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
    
    showToast('Redirected to share on X / Twitter!', 'success');
    closeTweetDrawer();
    clearSelection();
}

// Toast Notification Controller
function showToast(message, type = 'success') {
    elements.toastMessage.innerText = message;
    elements.toastNotification.className = `toast show toast-${type}`;
    
    setTimeout(() => {
        elements.toastNotification.classList.remove('show');
    }, 4000);
}
