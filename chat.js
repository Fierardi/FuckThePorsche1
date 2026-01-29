// chat.js - Chat functionality for NapoliGames

console.log('Chat.js loaded');

const ably = new Ably.Realtime('pAtgVw.EXDaZQ:wd-xVxcDaSS_l_u-Y8fRZsPsxcpWzH8PvsZPKzRkbDY');

console.log('Ably initialized');

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

// DOM elements - will be initialized when DOM is ready
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
  
  console.log('DOM elements initialized');
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
        const reader = new FileReader();
        reader.onload = function(e) {
          if (imagePreview) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
          }
        };
        reader.readAsDataURL(imageInput.files[0]);
      } else if (imagePreview) {
        imagePreview.src = '';
        imagePreview.style.display = 'none';
      }
    });
  }
}

// Initialize channels
function initializeChannels() {
  console.log('Initializing channels...');
  publicChannel = ably.channels.get('napoligames-public-chat');
  userRegistrationChannel = ably.channels.get('napoligames-user-directory');
  
  publicChannel.subscribe(handlePublicMessage);
  userRegistrationChannel.subscribe(handleUserRegistration);
  
  loadChatHistory('public');
  
  publicChannel.presence.enter(getUserName());
  publicChannel.presence.subscribe(handlePresenceUpdate);
  
  registerUser();
  loadUserDirectory();
  console.log('Channels initialized');
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
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      notificationPermission = permission;
      console.log('Notification permission:', permission);
    });
  }
}

function updateChatUserDisplay() {
  console.log('updateChatUserDisplay called');
  const username = getUserName();
  console.log('Username:', username);
  
  if (username && userDisplay) {
    console.log('User is logged in, initializing chat');
    userDisplay.innerHTML = `
      <div class="logged-in-name">
        Welcome, ${username}
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
    
    console.log('Chat inputs enabled');
    
    requestNotificationPermission();
    initializeChannels();
    updateChatList();
  } else {
    console.log('User not logged in');
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

function handlePresenceUpdate(presenceMsg) {
  const username = presenceMsg.data || presenceMsg.clientId;
  if (presenceMsg.action === 'enter') {
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
  
  userRegistrationChannel.publish('user-register', userInfo);
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
  userRegistrationChannel.history({ limit: 100 }, (err, resultPage) => {
    if (err) {
      console.error('Error loading user directory:', err);
      return;
    }
    
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
      html = `<div style="padding: 1rem; text-align: center; color: #999;">No users found matching "${searchTerm}"</div>`;
    } else if (filteredUsers.length === 0) {
      html = `<div style="padding: 1rem; text-align: center; color: #999;">
        <p>No other users have joined yet.</p>
        <p><strong>Share your username:</strong> ${currentUser}</p>
      </div>`;
    } else {
      filteredUsers.forEach(user => {
        const chatId = getPrivateChatId(currentUser, user);
        const isActive = currentChat === chatId;
        const isOnline = onlineUsers.has(user);
        const userInfo = userDirectory.get(user);
        const unreadCount = unreadMessages.get(chatId) || 0;
        
        html += `
          <div class="chat-item ${isActive ? 'active' : ''}" data-chat="${chatId}" data-user="${user}">
            <div class="avatar" style="position: relative;">
              ${user.charAt(0).toUpperCase()}
              ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
            </div>
            <div class="info">
              <div class="name">${user} ${isOnline ? '🟢' : '⚫'} ${unreadCount > 0 ? `<span class="unread-indicator">●</span>` : ''}</div>
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
  if (currentChatType === 'public' && msg.name !== getUserName()) {
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
  
  let content = '';
  
  if (typeof messageData === 'string') {
    content = `
      <div class="message-content">${username}: ${messageData}</div>
      <div class="message-timestamp">${new Date(timestamp).toLocaleTimeString()}</div>
    `;
  } else if (messageData.type === 'image') {
    content = `
      <div class="message-content">${username}:</div>
      <img src="${messageData.url}" alt="Shared image" class="message-image" onclick="showImageModal('${messageData.url}')">
      <div class="message-timestamp">${new Date(timestamp).toLocaleTimeString()}</div>
    `;
  }
  
  messageDiv.innerHTML = content;
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
  
  if ('Notification' in window && notificationPermission === 'granted') {
    const systemNotification = new Notification(title, {
      body: displayContent,
      icon: 'Images/Icon.png',
      tag: 'napoligames-chat',
    });
    
    setTimeout(() => systemNotification.close(), 5000);
    systemNotification.onclick = () => { window.focus(); systemNotification.close(); };
  }
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `
    <div class="notification-title">${title}</div>
    <div class="notification-content">${displayContent}</div>
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
  
  if (chatType === 'public') {
    publicChannel.history((err, resultPage) => {
      if (err) {
        console.error('Error loading public history:', err);
        return;
      }
      resultPage.items.reverse().forEach(msg => {
        if (msg.data && msg.data.isPrivate && msg.data.content !== undefined) {
          displayMessage(msg.name, msg.data.content, msg.timestamp);
        } else {
          displayMessage(msg.name, msg.data, msg.timestamp);
        }
      });
    });
  } else if (chatType === 'private' && chatId) {
    const channel = privateChannels[chatId];
    if (channel) {
      channel.history((err, resultPage) => {
        if (err) {
          console.error('Error loading private history:', err);
          return;
        }
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

  let messageData;
  
  if (imageFile) {
    try {
      const base64Image = await convertImageToBase64(imageFile);
      messageData = {
        type: 'image',
        url: base64Image,
        filename: imageFile.name
      };
    } catch (error) {
      alert('Error uploading image');
      return;
    }
  } else {
    messageData = text;
  }

  if (currentChatType === 'public') {
    publicChannel.publish(name, messageData);
    displayMessage(name, messageData, new Date());
  } else {
    const channel = privateChannels[currentChat];
    if (channel) {
      const privateMessageData = {
        content: messageData,
        chatId: currentChat,
        isPrivate: true
      };
      channel.publish(name, privateMessageData);
      displayMessage(name, messageData, new Date());
    }
  }

  if (input) input.value = '';
  if (imageInput) imageInput.value = '';
  if (imagePreview) {
    imagePreview.src = '';
    imagePreview.style.display = 'none';
  }
  
  clearTimeout(typingTimeout);
  if (isTyping) sendTypingIndicator(false);
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
  window.netlifyIdentity.logout();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded fired');
  
  // Initialize all DOM elements
  initDOMElements();
  
  console.log('Elements found:', {
    sendBtn: !!sendBtn,
    input: !!input,
    chatList: !!chatList,
    userSearch: !!userSearch,
    netlifyIdentity: !!window.netlifyIdentity
  });
  
  // Setup image preview
  setupImagePreview();
  
  // File button handler for iPad/iOS compatibility
  if (fileBtn) {
    fileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (imageInput) {
        imageInput.click();
      }
    });
    
    // Also handle touch events for better mobile support
    fileBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (imageInput) {
        imageInput.click();
      }
    });
  }
  
  // Event listeners
  if (sendBtn) {
    console.log('Adding click listener to send button');
    sendBtn.addEventListener('click', sendChatMessage);
  }

  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendChatMessage();
    });

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

  if (userSearch) {
    userSearch.addEventListener('input', updateChatList);
  }

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

  // Close image modal handlers
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

  // Netlify Identity initialization
  if (window.netlifyIdentity) {
    console.log('Netlify Identity found, setting up listeners');
    
    window.netlifyIdentity.on('init', user => {
      console.log('Netlify Identity init event, user:', user);
      updateChatUserDisplay();
      if (user) showWelcomeNotification();
    });
    
    window.netlifyIdentity.on('login', user => {
      console.log('Netlify Identity login event');
      updateChatUserDisplay();
      window.netlifyIdentity.close();
    });

    window.netlifyIdentity.on('logout', () => {
      console.log('Netlify Identity logout event');
      updateChatUserDisplay();
      onlineUsers.clear();
      allRegisteredUsers.clear();
      userDirectory.clear();
      privateChannels = {};
      currentChat = 'public';
      currentChatType = 'public';
    });
    
    console.log('Calling netlifyIdentity.init()');
    window.netlifyIdentity.init();
    
    // Check if user is already logged in after a short delay
    setTimeout(() => {
      const currentUser = window.netlifyIdentity.currentUser();
      console.log('Checking for existing user after init:', currentUser);
      if (currentUser) {
        console.log('User already logged in, initializing chat');
        updateChatUserDisplay();
      }
    }, 500);
  } else {
    console.error('Netlify Identity not found!');
  }

  // Header login button
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const user = window.netlifyIdentity.currentUser();
      if (user) {
        logoutChat();
      } else {
        window.netlifyIdentity.open();
      }
    });
  }
});