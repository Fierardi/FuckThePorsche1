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
let userDisplay, loginPrompt, chatDiv, input, sendBtn, fileBtn;
let imageInput, chatList, userSearch, chatTitle, typingIndicator;
let userInfoSection, usernameDisplay, imagePreview, privateNotificationBadge;

// Initialize DOM elements
function initDOMElements() {
  userDisplay = document.getElementById('user-display');
  loginPrompt = document.getElementById('login-prompt');
  chatDiv = document.getElementById('chat');
  input = document.getElementById('msg');
  sendBtn = document.getElementById('send');
  fileBtn = document.getElementById('fileBtn');
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

// Show preview of selected image before sending
function setupImagePreview() {
  if (imageInput) {
    imageInput.addEventListener('change', function() {
      if (imageInput.files && imageInput.files[0]) {
        const file = imageInput.files[0];
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image too large. Maximum size is 5MB.');
          imageInput.value = '';
          return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
          if (imagePreview) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      } else if (imagePreview) {
        imagePreview.src = '';
        imagePreview.style.display = 'none';
      }
    });
  }
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
    
    requestNotificationPermission();
    initializeChannels();
    updateChatList();
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
        <p>No other users have joined yet.</p>
        <p><strong>Share your username:</strong> ${escapeHtml(currentUser)}</p>
      </div>`;
    } else {
      filteredUsers.forEach(user => {
        const chatId = getPrivateChatId(currentUser, user);
        const isActive = currentChat === chatId;
        const isOnline = onlineUsers.has(user);
        const userInfo = userDirectory.get(user);
        const unreadCount = unreadMessages.get(chatId) || 0;
        
        html += `
          <div class="chat-item ${isActive ? 'active' : ''}" data-chat="${chatId}" data-user="${escapeHtml(user)}">
            <div class="avatar" style="position: relative;">
              ${escapeHtml(user.charAt(0).toUpperCase())}
              ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
            </div>
            <div class="info">
              <div class="name">${escapeHtml(user)} ${isOnline ? '🟢' : '⚫'} ${unreadCount > 0 ? `<span class="unread-indicator">●</span>` : ''}</div>
              <div class="preview">${unreadCount > 0 ? `${unreadCount} unread` : (isOnline ? 'Online' : userInfo ? formatLastSeen(userInfo.lastSeen) : 'Click to chat')}</div>
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
  if (currentChatType === 'public' && currentChat === 'public' && msg.name !== getUserName()) {
    displayMessage(msg.name, msg.data, msg.timestamp);
  }
}

function handlePrivateMessage(msg) {
  if (msg.data && msg.data.isPrivate && msg.data.chatId) {
    if (msg.name === getUserName()) return;
    
    if (currentChat === msg.data.chatId) {
      displayMessage(msg.name, msg.data.content, msg.timestamp);
    } else {
      const currentCount = unreadMessages.get(msg.data.chatId) || 0;
      unreadMessages.set(msg.data.chatId, currentCount + 1);
      updateChatList();
      updatePrivateTabBadge();
      showChatNotification(`New message from ${msg.name}`, msg.data.content);
    }
  }
}

function displayMessage(username, messageData, timestamp) {
  if (!chatDiv) return;
  
  const currentUserName = getUserName();
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${username === currentUserName ? 'self' : ''}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  if (typeof messageData === 'string') {
    // Safely display username and message
    contentDiv.textContent = `${username}: ${messageData}`;
    messageDiv.appendChild(contentDiv);
  } else if (messageData && messageData.type === 'image') {
    contentDiv.textContent = `${username}:`;
    messageDiv.appendChild(contentDiv);
    
    const img = document.createElement('img');
    img.src = messageData.url;
    img.alt = 'Shared image';
    img.className = 'message-image';
    img.onclick = () => showImageModal(messageData.url);
    messageDiv.appendChild(img);
  }
  
  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'message-timestamp';
  timestampDiv.textContent = new Date(timestamp).toLocaleTimeString();
  messageDiv.appendChild(timestampDiv);
  
  chatDiv.appendChild(messageDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
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
  } else if (typeof content === 'string' && content.length > 50) {
    displayContent = content.substring(0, 50) + '...';
  }
  
  // System notification
  if ('Notification' in window && notificationPermission === 'granted') {
    try {
      const systemNotification = new Notification(title, {
        body: displayContent,
        icon: 'Images/Icon.png',
        tag: 'napoligames-chat',
      });
      
      setTimeout(() => systemNotification.close(), 5000);
      systemNotification.onclick = () => { window.focus(); systemNotification.close(); };
    } catch (e) {
      // Fail silently if notification fails
    }
  }
  
  // In-app notification
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `
    <div class="notification-title">${escapeHtml(title)}</div>
    <div class="notification-content">${escapeHtml(displayContent)}</div>
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => {
    if (notification.parentNode) notification.parentNode.removeChild(notification);
  }, 4000);
  
  notification.addEventListener('click', () => {
    if (notification.parentNode) notification.parentNode.removeChild(notification);
  });
}

function loadChatHistory(chatType, chatId = null) {
  if (!chatDiv) return;
  chatDiv.innerHTML = '';
  
  if (chatType === 'public' && publicChannel) {
    publicChannel.history({ limit: 50 }, (err, resultPage) => {
      if (err) return;
      
      resultPage.items.reverse().forEach(msg => {
        if (msg.data && msg.data.isPrivate && msg.data.content !== undefined) {
          displayMessage(msg.name, msg.data.content, msg.timestamp);
        } else if (!msg.data || !msg.data.isPrivate) {
          displayMessage(msg.name, msg.data, msg.timestamp);
        }
      });
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
  const imageFile = imageInput ? imageInput.files[0] : null;
  
  if (!text && !imageFile) return;

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
  
  if (imageFile) {
    // Check file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      alert('Image too large. Maximum size is 5MB.');
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = originalSendText;
      }
      return;
    }
    
    try {
      const base64Image = await convertImageToBase64(imageFile);
      messageData = {
        type: 'image',
        url: base64Image,
        filename: imageFile.name
      };
    } catch (error) {
      alert('Error uploading image. Please try again.');
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