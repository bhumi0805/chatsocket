const socket = io();

let currentTopic = null;

const topicsList = document.getElementById("topicsList");
const messagesDiv = document.getElementById("messages");
const header = document.getElementById("header");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const createTopicBtn = document.getElementById("createTopicBtn");
const newTopicInput = document.getElementById("newTopicInput");

// Render topics list received from server
socket.on("topicsList", (topics) => {
  topicsList.innerHTML = "";
  topics.forEach((topic) => {
    const li = document.createElement("li");
    li.textContent = topic;
    li.onclick = () => joinTopic(topic);
    if (topic === currentTopic) li.classList.add("active");
    topicsList.appendChild(li);
  });
});

// When user clicks a topic to join
function joinTopic(topicName) {
  currentTopic = topicName;
  header.textContent = `Chatting in: ${topicName}`;
  messagesDiv.innerHTML = "";
  messageInput.disabled = false;
  sendBtn.disabled = false;

  // Highlight selected topic
  Array.from(topicsList.children).forEach(li => {
    li.classList.toggle("active", li.textContent === topicName);
  });

  socket.emit("joinTopic", topicName);
}

// Receive previous chat history on joining topic
socket.on("chatHistory", (messages) => {
  messagesDiv.innerHTML = "";
  messages.forEach(addMessage);
  scrollToBottom();
});

// Receive new message broadcasted to topic
socket.on("newMessage", (msg) => {
  if (msg.topic && msg.topic !== currentTopic) return; // Ignore messages from other topics
  addMessage(msg);
  scrollToBottom();
});

function addMessage(msg) {
  const div = document.createElement("div");
  div.textContent = `[${msg.time}] ${msg.id.substring(0, 5)}: ${msg.message}`;
  messagesDiv.appendChild(div);
}

function scrollToBottom() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

createTopicBtn.addEventListener("click", () => {
  const topicName = newTopicInput.value.trim();
  if (!topicName) return alert("Please enter a topic name");
  socket.emit("createTopic", topicName);
  newTopicInput.value = "";
});

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;
  if (!currentTopic) {
    alert("Please select a topic first.");
    return;
  }
  socket.emit("topicMessage", { topicName: currentTopic, message });
  messageInput.value = "";
}
