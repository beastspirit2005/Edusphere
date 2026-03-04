const { ipcRenderer } = require("electron");

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("userMessage");
const fileInput = document.getElementById("fileInput");

// =====================
// LOAD CHAT HISTORY
// =====================

let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

function renderHistory(){

chatBox.innerHTML = "";

chatHistory.forEach(msg => {

const div = document.createElement("div");

div.className = msg.role;

div.innerText = msg.content;

chatBox.appendChild(div);

});

chatBox.scrollTop = chatBox.scrollHeight;

}

const dashboard = localStorage.getItem("dashboard");

if(dashboard === "teacher"){
    document.querySelector("h2").innerText = "🤖 EduSphere AI Assistant";
}
else if(dashboard === "student"){
    document.querySelector("h2").innerText = "🤖 EduSphere AI Tutor";
}

renderHistory();

// =====================
// ADD MESSAGE
// =====================

function addMessage(sender,text){

const div = document.createElement("div");

div.className = sender;

div.innerText = text;

chatBox.appendChild(div);

chatBox.scrollTop = chatBox.scrollHeight;

}

// =====================
// SEND MESSAGE
// =====================

async function sendMessage(){

const message = input.value;

if(!message) return;

addMessage("user",message);

chatHistory.push({role:"user",content:message});

localStorage.setItem("chatHistory",JSON.stringify(chatHistory));

input.value="";

addMessage("ai","Thinking...");

const reply = await ipcRenderer.invoke("aiChat",message);

chatBox.lastChild.innerText = reply;

chatHistory.push({role:"ai",content:reply});

localStorage.setItem("chatHistory",JSON.stringify(chatHistory));

}

// =====================
// FILE ANALYSIS
// =====================

fileInput.addEventListener("change", async () => {

const file = fileInput.files[0];

if(!file) return;

addMessage("user","Uploaded: "+file.name);

addMessage("ai","Analyzing file...");

const buffer = await file.arrayBuffer();

const result = await ipcRenderer.invoke("analyzeFile",{
name:file.name,
data:buffer
});

chatBox.lastChild.innerText = result;

chatHistory.push({role:"ai",content:result});

localStorage.setItem("chatHistory",JSON.stringify(chatHistory));

});

// =====================
// CLEAR CHAT
// =====================

function clearChat(){

chatHistory = [];

localStorage.removeItem("chatHistory");

chatBox.innerHTML="";

}

function goBack(){

const params = new URLSearchParams(window.location.search);
const from = params.get("from");

if(from === "teacher"){
    window.location.href = "teacher.html";
}
else{
    window.location.href = "student.html";
}

}

const params = new URLSearchParams(window.location.search);
const from = params.get("from");

if(from === "teacher"){
    document.querySelector("h2").innerText = "🤖 EduSphere AI Assistant";
}