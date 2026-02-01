// chat.js - Polished Chat functionality for NapoliGames

const ably = new Ably.Realtime('pAtgVw.EXDaZQ:wd-xVxcDaSS_l_u-Y8fRZsPsxcpWzH8PvsZPKzRkbDY');

// Global variables
let currentChat = 'public';
let currentChatType = 'public';
let publicChannel = null;
let privateChannels = {};
let onlineUsers = new Set();
let allRegisteredUsers = new Set();
let userDirectory = new Map();
let typingTimeout = null;
let isTyping = false;
let userRegistrationChannel = null;
let unreadMessages = new Map();
let notificationPermission = 'default';

// DOM elements - initialized when DOM is ready
let userDisplay, loginPrompt, chatDiv, input, sendBtn, fileBtn, audioBtn;
let imageInput, chatList, userSearch, chatTitle, typingIndicator;
let userInfoSection, usernameDisplay, imagePreview, privateNotificationBadge;

// Audio recording variables
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// Track recently displayed messages to prevent duplicates
let displayedMessages = new Set();

// Initialize DOM elements
function initDOMElements() {
  userDisplay = document.getElementById('user-display');
  loginPrompt = document.getElementById('login-prompt');
  chatDiv = document.getElementById('chat');
  input = document.getElementById('msg');
  sendBtn = document.getElementById('send');
  fileBtn = document.getElementById('fileBtn');
  audioBtn = document.getElementById('audioBtn');
  imageInput = document.getElementById('imageInput');
  chatList = document.getElementById('chatList');
  userSearch = document.getElementById('userSearch');
  chatTitle = document.getElementById('chatTitle');
  typingIndicator = document.getElementById('typingIndicator');
  userInfoSection = document.getElementById('userInfoSection');
  usernameDisplay = document.getElementById('usernameDisplay');
  imagePreview = document.getElementById('imagePreview');
  privateNotificationBadge = document.getElementById('privateNotificationBadge');
}

// Update private tab notification badge
function updatePrivateTabBadge() {
  let totalUnread = 0;
  unreadMessages.forEach(count => {
    totalUnread += count;
  });
  
  if (totalUnread > 0 && privateNotificationBadge) {
    privateNotificationBadge.textContent = totalUnread;
    privateNotificationBadge.style.display = 'inline-flex';
  } else if (privateNotificationBadge) {
    privateNotificationBadge.style.display = 'none';
  }
}

// Show preview of selected file before sending
function setupImagePreview() {
  if (imageInput) {
    imageInput.addEventListener('change', function() {
      if (imageInput.files && imageInput.files[0]) {
        const file = imageInput.files[0];
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert('File too large. Maximum size is 10MB.');
          imageInput.value = '';
          return;
        }
        
        // Show file preview based on type
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = function(e) {
            if (imagePreview) {
              imagePreview.src = e.target.result;
              imagePreview.style.display = 'block';
            }
          };
          reader.readAsDataURL(file);
        } else {
          // For non-image files, show file info
          if (imagePreview) {
            imagePreview.style.display = 'none';
          }
        }
      } else if (imagePreview) {
        imagePreview.src = '';
        imagePreview.style.display = 'none';
      }
    });
  }
}

// Audio recording functions
async function startAudioRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Try to use mp4 format for better compatibility, fallback to webm
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    }
    
    mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      const base64Audio = await convertBlobToBase64(audioBlob);
      
      // Send audio message
      const name = getUserName();
      if (!name) return;
      
      const messageData = {
        type: 'audio',
        url: base64Audio,
        duration: Math.round(audioChunks.length * 0.1), // Approximate duration
        mimeType: mimeType
      };
      
      try {
        if (currentChatType === 'public') {
          await publicChannel.publish(name, messageData);
          displayMessage(name, messageData, new Date());
        } else {
          const channel = privateChannels[currentChat];
          if (channel) {
            const privateMessageData = {
              content: messageData,
              chatId: currentChat,
              isPrivate: true
            };
            await channel.publish(name, privateMessageData);
            displayMessage(name, messageData, new Date());
          }
        }
      } catch (error) {
        alert('Failed to send audio message.');
      }
      
      // Cleanup
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.start();
    isRecording = true;
    if (audioBtn) {
      audioBtn.classList.add('recording');
      audioBtn.title = 'Stop recording';
    }
  } catch (error) {
    alert('Microphone access denied. Please allow microphone access to send voice messages.');
  }
}

function stopAudioRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    if (audioBtn) {
      audioBtn.classList.remove('recording');
      audioBtn.title = 'Record voice message';
    }
  }
}

function convertBlobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Save chat message to localStorage
function saveChatMessage(chatId, username, messageData, timestamp) {
  const storageKey = `napoligames_chat_${chatId}`;
  let chatHistory = [];
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      chatHistory = JSON.parse(stored);
    }
  } catch (e) {
    chatHistory = [];
  }
  
  // Check if this exact message already exists (prevent duplicates)
  const messageExists = chatHistory.some(msg => 
    msg.username === username && 
    msg.timestamp === timestamp &&
    JSON.stringify(msg.messageData) === JSON.stringify(messageData)
  );
  
  if (messageExists) {
    return; // Don't save duplicate
  }
  
  chatHistory.push({
    username: username,
    messageData: messageData,
    timestamp: timestamp
  });
  
  // Keep only last 100 messages per chat
  if (chatHistory.length > 100) {
    chatHistory = chatHistory.slice(-100);
  }
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(chatHistory));
  } catch (e) {
    // Storage full, remove oldest messages
    if (chatHistory.length > 50) {
      chatHistory = chatHistory.slice(-50);
      localStorage.setItem(storageKey, JSON.stringify(chatHistory));
    }
  }
}

// Load chat history from localStorage
function loadLocalChatHistory(chatId) {
  const storageKey = `napoligames_chat_${chatId}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const chatHistory = JSON.parse(stored);
      chatHistory.forEach(msg => {
        displayMessage(msg.username, msg.messageData, msg.timestamp, false); // false = don't save again
      });
    }
  } catch (e) {
    console.error('Error loading chat history:', e);
  }
}

// Save contact to localStorage
function saveContact(username) {
  if (!username || username === getUserName()) return;
  
  const storageKey = 'napoligames_contacts';
  let contacts = [];
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      contacts = JSON.parse(stored);
    }
  } catch (e) {
    contacts = [];
  }
  
  // Add contact if not already there
  if (!contacts.includes(username)) {
    contacts.push(username);
    localStorage.setItem(storageKey, JSON.stringify(contacts));
  }
}

// Load contacts from localStorage
function loadSavedContacts() {
  const storageKey = 'napoligames_contacts';
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const contacts = JSON.parse(stored);
      contacts.forEach(username => {
        allRegisteredUsers.add(username);
      });
      updateChatList();
    }
  } catch (e) {
    console.error('Error loading contacts:', e);
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(fileType) {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  return '📎';
}

// Initialize channels
function initializeChannels() {
  publicChannel = ably.channels.get('napoligames-public-chat');
  userRegistrationChannel = ably.channels.get('napoligames-user-directory');
  
  publicChannel.subscribe(handlePublicMessage);
  userRegistrationChannel.subscribe(handleUserRegistration);
  
  loadChatHistory('public');
  
  const username = getUserName();
  if (username) {
    publicChannel.presence.enter(username);
  }
  publicChannel.presence.subscribe(handlePresenceUpdate);
  
  registerUser();
  loadUserDirectory();
  
  // Load saved contacts from localStorage
  loadSavedContacts();
}

function getUserName() {
  const user = window.netlifyIdentity.currentUser();
  if (!user) return null;

  if (user.user_metadata && user.user_metadata.full_name && user.user_metadata.full_name.trim() !== '') {
    return user.user_metadata.full_name.trim();
  }

  if (user.email) {
    return user.email;
  }

  return null;
}

function getUserId() {
  const user = window.netlifyIdentity.currentUser();
  return user ? user.id : null;
}

function requestNotificationPermission() {
  if ('Notification' in window && notificationPermission === 'default') {
    Notification.requestPermission().then(permission => {
      notificationPermission = permission;
    });
  }
}

function updateChatUserDisplay() {
  const username = getUserName();
  
  if (username && userDisplay) {
    userDisplay.innerHTML = `
      <div class="logged-in-name">
        Welcome, ${escapeHtml(username)}
        <button class="logout-button" onclick="logoutChat()">Logout</button>
      </div>
    `;
    if (loginPrompt) loginPrompt.style.display = 'none';
    if (usernameDisplay) usernameDisplay.textContent = username;
    
    if (input) {
      input.disabled = false;
      input.placeholder = 'Type a message...';
    }
    if (sendBtn) sendBtn.disabled = false;
    if (fileBtn) fileBtn.disabled = false;
    if (audioBtn) audioBtn.disabled = false;
    
    requestNotificationPermission();
    initializeChannels();
    updateChatList();
    
    // Show offline notifications after a short delay
    setTimeout(() => {
      showOfflineNotifications();
    }, 2000);
  } else {
    if (userDisplay) userDisplay.innerHTML = '';
    if (loginPrompt) loginPrompt.style.display = 'block';
    if (usernameDisplay) usernameDisplay.textContent = '';
    
    if (input) {
      input.disabled = true;
      input.placeholder = 'Please log in to chat...';
    }
    if (sendBtn) sendBtn.disabled = true;
    if (fileBtn) fileBtn.disabled = true;
    if (audioBtn) audioBtn.disabled = true;
    
    if (chatDiv) chatDiv.innerHTML = '';
    if (chatList) chatList.innerHTML = '';
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function handlePresenceUpdate(presenceMsg) {
  const username = presenceMsg.data || presenceMsg.clientId;
  if (presenceMsg.action === 'enter' || presenceMsg.action === 'present') {
    onlineUsers.add(username);
  } else if (presenceMsg.action === 'leave') {
    onlineUsers.delete(username);
  }
  updateChatList();
}

function registerUser() {
  const currentUser = getUserName();
  const userId = getUserId();
  if (!currentUser || !userId) return;
  
  const userInfo = {
    username: currentUser,
    userId: userId,
    lastSeen: new Date().toISOString(),
    joinDate: new Date().toISOString()
  };
  
  userDirectory.set(currentUser, userInfo);
  allRegisteredUsers.add(currentUser);
  
  if (userRegistrationChannel) {
    userRegistrationChannel.publish('user-register', userInfo);
  }
}

function handleUserRegistration(msg) {
  if (msg.name === 'user-register') {
    const userInfo = msg.data;
    userDirectory.set(userInfo.username, userInfo);
    allRegisteredUsers.add(userInfo.username);
    saveContact(userInfo.username); // Save to localStorage
    updateChatList();
  } else if (msg.name === 'user-directory-request') {
    registerUser();
  }
}

function loadUserDirectory() {
  if (!userRegistrationChannel) return;
  
  userRegistrationChannel.history({ limit: 100 }, (err, resultPage) => {
    if (err) return;
    
    resultPage.items.forEach(msg => {
      if (msg.name === 'user-register') {
        const userInfo = msg.data;
        userDirectory.set(userInfo.username, userInfo);
        allRegisteredUsers.add(userInfo.username);
        saveContact(userInfo.username); // Save to localStorage
      }
    });
    
    updateChatList();
    subscribeToAllPrivateChannels();
    userRegistrationChannel.publish('user-directory-request', { requester: getUserName() });
  });
}

function subscribeToAllPrivateChannels() {
  const currentUser = getUserName();
  if (!currentUser) return;
  
  allRegisteredUsers.forEach(otherUser => {
    if (otherUser !== currentUser) {
      const chatId = getPrivateChatId(currentUser, otherUser);
      if (!privateChannels[chatId]) {
        privateChannels[chatId] = ably.channels.get(`private-${chatId}`);
        privateChannels[chatId].subscribe(handlePrivateMessage);
      }
    }
  });
}

function updateChatList() {
  const currentUser = getUserName();
  if (!currentUser || !chatList) return;

  if (currentChatType === 'public') {
    chatList.innerHTML = `
      <div class="chat-item active" data-chat="public">
        <div class="avatar">📢</div>
        <div class="info">
          <div class="name">Public Chat</div>
          <div class="preview">Everyone can see messages</div>
        </div>
      </div>
    `;
  } else {
    let html = '';
    const searchTerm = userSearch ? userSearch.value.toLowerCase() : '';
    const filteredUsers = Array.from(allRegisteredUsers).filter(user => 
      user !== currentUser && user.toLowerCase().includes(searchTerm)
    );

    if (filteredUsers.length === 0 && searchTerm) {
      html = `<div style="padding: 1rem; text-align: center; color: #999;">No users found matching "${escapeHtml(searchTerm)}"</div>`;
    } else if (filteredUsers.length === 0) {
      html = `<div style="padding: 1rem; text-align: center; color: #999;">
        <p>No contacts yet.</p>
        <p>Start chatting in public to find people!</p>
      </div>`;
    } else {
      filteredUsers.forEach(user => {
        const chatId = getPrivateChatId(currentUser, user);
        const isActive = currentChat === chatId;
        const isOnline = onlineUsers.has(user);
        const userInfo = userDirectory.get(user);
        const unreadCount = unreadMessages.get(chatId) || 0;
        
        // Check if there's chat history with this user
        const hasHistory = localStorage.getItem(`napoligames_chat_${chatId}`) !== null;
        
        html += `
          <div class="chat-item ${isActive ? 'active' : ''}" data-chat="${chatId}" data-user="${escapeHtml(user)}">
            <div class="avatar" style="position: relative;">
              ${escapeHtml(user.charAt(0).toUpperCase())}
              ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
            </div>
            <div class="info">
              <div class="name">${escapeHtml(user)} ${isOnline ? '🟢' : '⚫'} ${unreadCount > 0 ? `<span class="unread-indicator">●</span>` : ''}</div>
              <div class="preview">${unreadCount > 0 ? `${unreadCount} unread` : (isOnline ? 'Online' : hasHistory ? 'Tap to chat' : 'Offline')}</div>
            </div>
          </div>
        `;
      });
    }

    chatList.innerHTML = html;
  }
}

function formatLastSeen(lastSeenISO) {
  const lastSeen = new Date(lastSeenISO);
  const now = new Date();
  const diffMs = now - lastSeen;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 5) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return lastSeen.toLocaleDateString();
}

function getPrivateChatId(user1, user2) {
  return [user1, user2].sort().join('_private_');
}

function handlePublicMessage(msg) {
  // Validate message has data
  if (!msg.data) return;
  
  // Register user if we see them in public chat
  if (msg.name && msg.name !== getUserName() && !allRegisteredUsers.has(msg.name)) {
    allRegisteredUsers.add(msg.name);
    saveContact(msg.name); // Save to localStorage
    updateChatList();
  }
  
  // Display all messages in public chat (including your own)
  if (currentChatType === 'public' && currentChat === 'public') {
    displayMessage(msg.name, msg.data, msg.timestamp);
  }
}

function handlePrivateMessage(msg) {
  if (msg.data && msg.data.isPrivate && msg.data.chatId) {
    // For messages in current chat, display them
    if (currentChat === msg.data.chatId) {
      displayMessage(msg.name, msg.data.content, msg.timestamp);
    } 
    // For messages in other chats, show notification (but not your own)
    else if (msg.name !== getUserName()) {
      const currentCount = unreadMessages.get(msg.data.chatId) || 0;
      unreadMessages.set(msg.data.chatId, currentCount + 1);
      updateChatList();
      updatePrivateTabBadge();
      
      // Save notification for offline viewing
      saveOfflineNotification(msg.name, msg.data.content, msg.timestamp, msg.data.chatId);
      
      showChatNotification(`New message from ${msg.name}`, msg.data.content);
    }
  }
}

function displayMessage(username, messageData, timestamp, shouldSave = true) {
  if (!chatDiv) return;
  
  // Validate message data - don't display empty messages
  if (!messageData || 
      (typeof messageData === 'string' && !messageData.trim()) ||
      (typeof messageData === 'object' && !messageData.type)) {
    return; // Skip invalid/empty messages
  }
  
  // Create a unique ID for this message to prevent duplicates
  const messageId = `${username}_${timestamp}_${JSON.stringify(messageData).substring(0, 50)}`;
  
  if (displayedMessages.has(messageId)) {
    return; // Already displayed this message
  }
  
  displayedMessages.add(messageId);
  
  // Clean up old message IDs (keep only last 200)
  if (displayedMessages.size > 200) {
    const idsArray = Array.from(displayedMessages);
    displayedMessages = new Set(idsArray.slice(-200));
  }
  
  const currentUserName = getUserName();
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${username === currentUserName ? 'self' : ''}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  if (typeof messageData === 'string') {
    // Text message
    contentDiv.textContent = `${username}: ${messageData}`;
    messageDiv.appendChild(contentDiv);
  } else if (messageData && messageData.type === 'image') {
    // Image message
    contentDiv.textContent = `${username}:`;
    messageDiv.appendChild(contentDiv);
    
    const img = document.createElement('img');
    img.src = messageData.url;
    img.alt = 'Shared image';
    img.className = 'message-image';
    img.onclick = () => showImageModal(messageData.url);
    messageDiv.appendChild(img);
  } else if (messageData && messageData.type === 'audio') {
    // Audio message
    contentDiv.textContent = `${username}:`;
    messageDiv.appendChild(contentDiv);
    
    // Create a simple audio player
    const audioPlayer = document.createElement('audio');
    audioPlayer.controls = true;
    audioPlayer.style.width = '100%';
    audioPlayer.style.marginTop = '0.5rem';
    audioPlayer.style.borderRadius = '20px';
    audioPlayer.src = messageData.url;
    
    messageDiv.appendChild(audioPlayer);
  } else if (messageData && messageData.type === 'file') {
    // File message
    contentDiv.textContent = `${username}:`;
    messageDiv.appendChild(contentDiv);
    
    const fileContainer = document.createElement('div');
    fileContainer.className = 'message-file';
    fileContainer.onclick = () => downloadFile(messageData.url, messageData.filename);
    
    const fileIcon = document.createElement('div');
    fileIcon.className = 'message-file-icon';
    fileIcon.textContent = getFileIcon(messageData.fileType);
    
    const fileInfo = document.createElement('div');
    fileInfo.className = 'message-file-info';
    
    const fileName = document.createElement('div');
    fileName.className = 'message-file-name';
    fileName.textContent = messageData.filename;
    
    const fileSize = document.createElement('div');
    fileSize.className = 'message-file-size';
    fileSize.textContent = messageData.fileSize;
    
    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileSize);
    
    fileContainer.appendChild(fileIcon);
    fileContainer.appendChild(fileInfo);
    messageDiv.appendChild(fileContainer);
  }
  
  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'message-timestamp';
  timestampDiv.textContent = new Date(timestamp).toLocaleTimeString();
  messageDiv.appendChild(timestampDiv);
  
  chatDiv.appendChild(messageDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
  
  // Save to localStorage if this is a new message
  if (shouldSave) {
    saveChatMessage(currentChat, username, messageData, timestamp);
  }
  
  // Save contact to localStorage (for persistent contact list)
  if (username !== getUserName()) {
    saveContact(username);
    // Add to registered users if not already there
    if (!allRegisteredUsers.has(username)) {
      allRegisteredUsers.add(username);
      updateChatList();
    }
  }
}

function downloadFile(fileUrl, filename) {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = filename;
  link.click();
}

function showImageModal(imageUrl) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  if (modal && modalImg) {
    modal.style.display = 'block';
    modalImg.src = imageUrl;
  }
}

function showChatNotification(title, content) {
  let displayContent = content;
  if (typeof content === 'object' && content.type === 'image') {
    displayContent = '📷 Image';
  } else if (typeof content === 'object' && content.type === 'audio') {
    displayContent = '🎤 Voice message';
  } else if (typeof content === 'object' && content.type === 'file') {
    displayContent = '📎 File';
  } else if (typeof content === 'string' && content.length > 50) {
    displayContent = content.substring(0, 50) + '...';
  }
  
  // Play notification sound
  playNotificationSound();
  
  // Update page title if tab is not visible
  showTitleNotification('New message!');
  
  // Desktop notification
  if ('Notification' in window && notificationPermission === 'granted') {
    try {
      const systemNotification = new Notification(title, {
        body: displayContent,
        icon: 'Images/Icon.png',
        tag: 'napoligames-chat',
        badge: 'Images/Icon.png',
        requireInteraction: false,
        silent: false
      });
      
      setTimeout(() => systemNotification.close(), 5000);
      systemNotification.onclick = () => { 
        window.focus(); 
        systemNotification.close(); 
      };
    } catch (e) {
      // Fail silently if notification fails
    }
  }
  
  // In-app notification banner
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `
    <div class="notification-title">${escapeHtml(title)}</div>
    <div class="notification-content">${escapeHtml(displayContent)}</div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.add('notification-fade-out');
      setTimeout(() => {
        if (notification.parentNode) notification.parentNode.removeChild(notification);
      }, 300);
    }
  }, 4000);
  
  // Click to dismiss
  notification.addEventListener('click', () => {
    if (notification.parentNode) {
      notification.classList.add('notification-fade-out');
      setTimeout(() => {
        if (notification.parentNode) notification.parentNode.removeChild(notification);
      }, 300);
    }
  });
}

// Play notification sound
function playNotificationSound() {
  try {
    // Create a simple notification beep using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    // Fail silently if sound fails
  }
}

// Update page title with notification
let originalTitle = document.title;
let titleInterval = null;

function showTitleNotification(message) {
  if (document.hidden) {
    clearInterval(titleInterval);
    let showOriginal = false;
    
    titleInterval = setInterval(() => {
      document.title = showOriginal ? originalTitle : `🔔 ${message}`;
      showOriginal = !showOriginal;
    }, 1000);
  }
}

// Clear title notification when page becomes visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    clearInterval(titleInterval);
    document.title = originalTitle;
  }
});

// Update last seen when user leaves the page
window.addEventListener('beforeunload', () => {
  updateLastSeen();
});

// Track last seen timestamp
function updateLastSeen() {
  const currentUser = getUserName();
  if (!currentUser) return;
  
  const timestamp = new Date().toISOString();
  localStorage.setItem(`napoligames_lastseen_${currentUser}`, timestamp);
}

// Get messages received while offline
function getOfflineMessages() {
  const currentUser = getUserName();
  if (!currentUser) return [];
  
  const lastSeen = localStorage.getItem(`napoligames_lastseen_${currentUser}`);
  if (!lastSeen) {
    updateLastSeen();
    return [];
  }
  
  const lastSeenTime = new Date(lastSeen).getTime();
  const offlineMessages = [];
  
  // Check all saved chats for new messages
  const contacts = JSON.parse(localStorage.getItem('napoligames_contacts') || '[]');
  
  contacts.forEach(contact => {
    const chatId = getPrivateChatId(currentUser, contact);
    const chatHistory = localStorage.getItem(`napoligames_chat_${chatId}`);
    
    if (chatHistory) {
      try {
        const messages = JSON.parse(chatHistory);
        messages.forEach(msg => {
          const msgTime = new Date(msg.timestamp).getTime();
          if (msgTime > lastSeenTime && msg.username !== currentUser) {
            offlineMessages.push({
              from: msg.username,
              chatId: chatId,
              timestamp: msg.timestamp,
              content: msg.messageData
            });
          }
        });
      } catch (e) {
        // Skip invalid chat history
      }
    }
  });
  
  // Check public chat too
  const publicHistory = localStorage.getItem('napoligames_chat_public');
  if (publicHistory) {
    try {
      const messages = JSON.parse(publicHistory);
      messages.forEach(msg => {
        const msgTime = new Date(msg.timestamp).getTime();
        if (msgTime > lastSeenTime && msg.username !== currentUser) {
          offlineMessages.push({
            from: msg.username,
            chatId: 'public',
            timestamp: msg.timestamp,
            content: msg.messageData
          });
        }
      });
    } catch (e) {
      // Skip invalid chat history
    }
  }
  
  // Sort by timestamp
  offlineMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  return offlineMessages;
}

// Show offline notifications summary
function showOfflineNotifications() {
  const offlineMessages = getOfflineMessages();
  
  if (offlineMessages.length === 0) {
    updateLastSeen();
    return;
  }
  
  // Count messages per person
  const messageCounts = {};
  offlineMessages.forEach(msg => {
    messageCounts[msg.from] = (messageCounts[msg.from] || 0) + 1;
  });
  
  // Create summary notification
  const senders = Object.keys(messageCounts);
  let summaryText = '';
  
  if (senders.length === 1) {
    const sender = senders[0];
    const count = messageCounts[sender];
    summaryText = `${count} new message${count > 1 ? 's' : ''} from ${sender}`;
  } else {
    const totalCount = offlineMessages.length;
    summaryText = `${totalCount} new messages from ${senders.length} people`;
  }
  
  // Show notification
  const notification = document.createElement('div');
  notification.className = 'notification offline-notification';
  notification.innerHTML = `
    <div class="notification-title">💬 While you were away</div>
    <div class="notification-content">${escapeHtml(summaryText)}</div>
    <div class="notification-details">
      ${senders.map(sender => 
        `<div class="sender-badge">${escapeHtml(sender)} (${messageCounts[sender]})</div>`
      ).join('')}
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Play sound
  playNotificationSound();
  
  // Auto-dismiss after 8 seconds (longer for offline notifications)
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.add('notification-fade-out');
      setTimeout(() => {
        if (notification.parentNode) notification.parentNode.removeChild(notification);
      }, 300);
    }
  }, 8000);
  
  // Click to dismiss
  notification.addEventListener('click', () => {
    if (notification.parentNode) {
      notification.classList.add('notification-fade-out');
      setTimeout(() => {
        if (notification.parentNode) notification.parentNode.removeChild(notification);
      }, 300);
    }
  });
  
  // Update last seen after showing notifications
  updateLastSeen();
}

// Save notification to localStorage for offline users
function saveOfflineNotification(username, messageData, timestamp, chatId) {
  const storageKey = 'napoligames_offline_notifications';
  let notifications = [];
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      notifications = JSON.parse(stored);
    }
  } catch (e) {
    notifications = [];
  }
  
  // Add new notification
  notifications.push({
    username: username,
    messageData: messageData,
    timestamp: timestamp,
    chatId: chatId,
    read: false
  });
  
  // Keep only last 50 notifications
  if (notifications.length > 50) {
    notifications = notifications.slice(-50);
  }
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(notifications));
  } catch (e) {
    // Storage full, keep only last 25
    if (notifications.length > 25) {
      notifications = notifications.slice(-25);
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    }
  }
}

// Load and show offline notifications
function loadOfflineNotifications() {
  const storageKey = 'napoligames_offline_notifications';
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;
    
    const notifications = JSON.parse(stored);
    const unreadNotifications = notifications.filter(n => !n.read);
    
    if (unreadNotifications.length === 0) return;
    
    // Group notifications by sender
    const groupedNotifications = {};
    unreadNotifications.forEach(notif => {
      if (!groupedNotifications[notif.username]) {
        groupedNotifications[notif.username] = [];
      }
      groupedNotifications[notif.username].push(notif);
    });
    
    // Show summary notification
    const senderCount = Object.keys(groupedNotifications).length;
    const totalCount = unreadNotifications.length;
    
    if (senderCount === 1) {
      const sender = Object.keys(groupedNotifications)[0];
      const messages = groupedNotifications[sender];
      showChatNotification(
        `${messages.length} new message${messages.length > 1 ? 's' : ''} from ${sender}`,
        messages.length === 1 ? getMessagePreview(messages[0].messageData) : `${messages.length} messages`
      );
    } else {
      showChatNotification(
        `${totalCount} new messages`,
        `From ${senderCount} contacts`
      );
    }
    
    // Mark all as read
    notifications.forEach(n => n.read = true);
    localStorage.setItem(storageKey, JSON.stringify(notifications));
    
    // Clear old notifications after 24 hours
    setTimeout(() => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentNotifications = notifications.filter(n => 
        new Date(n.timestamp).getTime() > oneDayAgo
      );
      localStorage.setItem(storageKey, JSON.stringify(recentNotifications));
    }, 1000);
    
  } catch (e) {
    console.error('Error loading offline notifications:', e);
  }
}

// Get message preview for notification
function getMessagePreview(messageData) {
  if (typeof messageData === 'string') {
    return messageData.substring(0, 50) + (messageData.length > 50 ? '...' : '');
  } else if (messageData && messageData.type === 'image') {
    return '📷 Image';
  } else if (messageData && messageData.type === 'audio') {
    return '🎤 Voice message';
  } else if (messageData && messageData.type === 'file') {
    return '📎 File';
  }
  return 'New message';
}

function loadChatHistory(chatType, chatId = null) {
  if (!chatDiv) return;
  chatDiv.innerHTML = '';
  
  const loadId = chatType === 'public' ? 'public' : chatId;
  
  // First load from localStorage for instant display
  loadLocalChatHistory(loadId);
  
  // Then load from Ably to get any new messages
  if (chatType === 'public' && publicChannel) {
    publicChannel.history({ limit: 50 }, (err, resultPage) => {
      if (err) return;
      
      resultPage.items.reverse().forEach(msg => {
        // Register users we see in history
        if (msg.name && msg.name !== getUserName() && !allRegisteredUsers.has(msg.name)) {
          allRegisteredUsers.add(msg.name);
          saveContact(msg.name); // Save to localStorage
        }
        
        if (msg.data && msg.data.isPrivate && msg.data.content !== undefined) {
          displayMessage(msg.name, msg.data.content, msg.timestamp);
        } else if (!msg.data || !msg.data.isPrivate) {
          displayMessage(msg.name, msg.data, msg.timestamp);
        }
      });
      
      // Update chat list after loading history
      updateChatList();
    });
  } else if (chatType === 'private' && chatId) {
    const channel = privateChannels[chatId];
    if (channel) {
      channel.history({ limit: 50 }, (err, resultPage) => {
        if (err) return;
        
        resultPage.items.reverse().forEach(msg => {
          if (msg.data && msg.data.isPrivate && msg.data.content !== undefined) {
            displayMessage(msg.name, msg.data.content, msg.timestamp);
          } else {
            displayMessage(msg.name, msg.data, msg.timestamp);
          }
        });
      });
    }
  }
}

function switchChat(chatType, chatId = 'public', otherUser = null) {
  currentChatType = chatType;
  currentChat = chatId;
  
  // Clear displayed messages tracker when switching chats
  displayedMessages.clear();
  
  if (chatType === 'public') {
    if (chatTitle) chatTitle.textContent = 'Public Chat';
    loadChatHistory('public');
  } else {
    if (chatTitle) chatTitle.textContent = `Chat with ${otherUser}`;
    unreadMessages.delete(chatId);
    
    if (!privateChannels[chatId]) {
      privateChannels[chatId] = ably.channels.get(`private-${chatId}`);
      privateChannels[chatId].subscribe(handlePrivateMessage);
    }
    
    loadChatHistory('private', chatId);
  }
  
  updateChatList();
  updatePrivateTabBadge();
  
  // Focus input
  if (input && !input.disabled) {
    setTimeout(() => input.focus(), 100);
  }
}

function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function sendChatMessage() {
  const text = input ? input.value.trim() : '';
  const file = imageInput ? imageInput.files[0] : null;
  
  if (!text && !file) return;

  const name = getUserName();
  if (!name) {
    alert('Please log in to send messages');
    return;
  }

  // Disable send button while sending
  const originalSendText = sendBtn ? sendBtn.textContent : 'Send';
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
  }

  let messageData;
  
  if (file) {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.');
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = originalSendText;
      }
      return;
    }
    
    try {
      const base64File = await convertImageToBase64(file);
      
      // Determine file type and create appropriate message data
      if (file.type.startsWith('image/')) {
        messageData = {
          type: 'image',
          url: base64File,
          filename: file.name
        };
      } else if (file.type.startsWith('audio/')) {
        messageData = {
          type: 'audio',
          url: base64File,
          filename: file.name,
          duration: 0 // Will be set by audio player
        };
      } else {
        messageData = {
          type: 'file',
          url: base64File,
          filename: file.name,
          fileType: file.type,
          fileSize: formatFileSize(file.size)
        };
      }
    } catch (error) {
      alert('Error uploading file. Please try again.');
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = originalSendText;
      }
      return;
    }
  } else {
    messageData = text;
  }

  try {
    if (currentChatType === 'public') {
      await publicChannel.publish(name, messageData);
      // Don't display here - will be displayed when message comes back from Ably
    } else {
      const channel = privateChannels[currentChat];
      if (channel) {
        const privateMessageData = {
          content: messageData,
          chatId: currentChat,
          isPrivate: true
        };
        await channel.publish(name, privateMessageData);
        // Don't display here - will be displayed when message comes back from Ably
      }
    }

    // Clear inputs on success
    if (input) input.value = '';
    if (imageInput) imageInput.value = '';
    if (imagePreview) {
      imagePreview.src = '';
      imagePreview.style.display = 'none';
    }
    
    clearTimeout(typingTimeout);
    if (isTyping) sendTypingIndicator(false);
  } catch (error) {
    alert('Failed to send message. Please try again.');
  } finally {
    // Re-enable send button
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = originalSendText;
    }
  }
}

function sendTypingIndicator(typing) {
  isTyping = typing;
  const channel = currentChatType === 'public' ? publicChannel : privateChannels[currentChat];
  if (channel) {
    channel.publish('typing', { user: getUserName(), typing: typing });
  }
}

function showWelcomeNotification() {
  if (!sessionStorage.getItem('welcomeShown')) {
    showChatNotification(
      'Welcome to NapoliGames Chat!',
      'Start chatting in the public channel or send private messages.'
    );
    sessionStorage.setItem('welcomeShown', 'true');
  }
}

function logoutChat() {
  updateLastSeen(); // Save when user was last online
  if (window.netlifyIdentity) {
    window.netlifyIdentity.logout();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all DOM elements
  initDOMElements();
  
  // Setup image preview
  setupImagePreview();
  
  // File button handler for iPad/iOS compatibility
  if (fileBtn) {
    fileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (imageInput) imageInput.click();
    });
    
    fileBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (imageInput) imageInput.click();
    }, { passive: false });
  }
  
  // Audio button handler
  if (audioBtn) {
    audioBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isRecording) {
        stopAudioRecording();
      } else {
        startAudioRecording();
      }
    });
    
    audioBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isRecording) {
        stopAudioRecording();
      } else {
        startAudioRecording();
      }
    }, { passive: false });
  }
  
  // Send button
  if (sendBtn) {
    sendBtn.addEventListener('click', sendChatMessage);
  }

  // Enter key to send (Shift+Enter for new line in future)
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });

    // Typing indicator
    input.addEventListener('input', () => {
      if (!isTyping) sendTypingIndicator(true);
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => sendTypingIndicator(false), 2000);
    });
  }

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const activeBtn = document.querySelector('.tab-btn.active');
      if (activeBtn) activeBtn.classList.remove('active');
      btn.classList.add('active');
      
      const tab = btn.dataset.tab;
      if (tab === 'public') {
        currentChatType = 'public';
        if (userSearch) userSearch.style.display = 'none';
        if (userInfoSection) userInfoSection.style.display = 'none';
        switchChat('public');
      } else {
        currentChatType = 'private';
        if (userSearch) userSearch.style.display = 'block';
        if (userInfoSection) userInfoSection.style.display = 'block';
      }
      
      updateChatList();
    });
  });

  // User search
  if (userSearch) {
    userSearch.addEventListener('input', updateChatList);
  }

  // Chat item clicks
  if (chatList) {
    chatList.addEventListener('click', (e) => {
      const chatItem = e.target.closest('.chat-item');
      if (!chatItem) return;
      
      document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
      chatItem.classList.add('active');
      
      const chatId = chatItem.dataset.chat;
      const otherUser = chatItem.dataset.user;
      
      if (chatId === 'public') {
        switchChat('public');
      } else {
        switchChat('private', chatId, otherUser);
      }
    });
  }

  // Image modal handlers
  const modalClose = document.querySelector('.image-modal-close');
  const imageModal = document.getElementById('imageModal');
  
  if (modalClose) {
    modalClose.onclick = () => {
      if (imageModal) imageModal.style.display = 'none';
    };
  }

  if (imageModal) {
    imageModal.onclick = (event) => {
      if (event.target === imageModal) {
        imageModal.style.display = 'none';
      }
    };
  }

  // Netlify Identity
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on('init', user => {
      updateChatUserDisplay();
      if (user) showWelcomeNotification();
    });
    
    window.netlifyIdentity.on('login', () => {
      updateChatUserDisplay();
      window.netlifyIdentity.close();
    });

    window.netlifyIdentity.on('logout', () => {
      updateChatUserDisplay();
      onlineUsers.clear();
      allRegisteredUsers.clear();
      userDirectory.clear();
      privateChannels = {};
      currentChat = 'public';
      currentChatType = 'public';
    });
    
    window.netlifyIdentity.init();
    
    // Check if user is already logged in
    setTimeout(() => {
      const currentUser = window.netlifyIdentity.currentUser();
      if (currentUser) {
        updateChatUserDisplay();
      }
    }, 500);
  }

  // Header login button
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.netlifyIdentity) {
        const user = window.netlifyIdentity.currentUser();
        if (user) {
          logoutChat();
        } else {
          window.netlifyIdentity.open();
        }
      }
    });
  }
});