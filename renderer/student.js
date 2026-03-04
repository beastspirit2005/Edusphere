const { ipcRenderer } = require("electron");


// =============================
// GLOBAL VARIABLES
// =============================

const email = localStorage.getItem("userEmail");

let marksChart = null;
let attendanceChart = null;


// =============================
// INITIALIZE DASHBOARD
// =============================

init();

async function init(){

if(!email){

alert("Session expired. Please login again.");

window.location = "login.html";

return;

}

await loadStudentData();

await loadProfile();

}



// =============================
// LOAD PROFILE
// =============================

async function loadProfile(){

try{

const user = await ipcRenderer.invoke("getStudentProfile", email);

if(!user) return;


// =====================
// EDIT PROFILE INPUTS
// =====================

const nameField =
document.getElementById("studentName");

const emailField =
document.getElementById("studentEmail");


if(nameField)
nameField.value = user.name || "";

if(emailField)
emailField.value = user.email || "";


// =====================
// VIEW PROFILE CARD
// =====================

const viewName =
document.getElementById("viewName");

const viewEmail =
document.getElementById("viewEmail");

const viewRole =
document.getElementById("viewRole");


if(viewName)
viewName.innerText = user.name || "";

if(viewEmail)
viewEmail.innerText = user.email || "";

if(viewRole)
viewRole.innerText = user.role || "";


}
catch(err){

console.error("Profile load error", err);

}

}



// =============================
// LOAD STUDENT DATA
// =============================

async function loadStudentData(){

try{

const data = await ipcRenderer.invoke("getStudentData", email);

if(!data) return;


loadMarksChart(data.marks);

loadAttendanceChart(data.attendance);

loadMarksTable(data.marks);

loadAttendanceTable(data.attendance);

updateStats(data);


}
catch(error){

console.error("Student data error:", error);

}

}



// =============================
// MARKS CHART
// =============================

function loadMarksChart(marks){

const canvas = document.getElementById("marksChart");

if(!canvas) return;


if(marksChart) marksChart.destroy();


marksChart = new Chart(canvas,{

type:"line",

data:{

labels: marks.subjects || [],

datasets:[{

label:"Marks",

data: marks.values || [],

borderWidth:2,

tension:0.3

}]

},

options:{

responsive:true,

maintainAspectRatio:false,

scales:{

y:{

beginAtZero:true,

min:0,

max:100,

ticks:{ stepSize:10 }

}

}

}

});

}



// =============================
// ATTENDANCE CHART
// =============================

function loadAttendanceChart(att){

const canvas = document.getElementById("attendanceChart");

if(!canvas) return;


if(attendanceChart) attendanceChart.destroy();


attendanceChart = new Chart(canvas,{

type:"bar",

data:{

labels: att.subjects || [],

datasets:[{

label:"Attendance %",

data: att.values || [],

borderWidth:1

}]

},

options:{

responsive:true,

maintainAspectRatio:false,

scales:{

y:{

beginAtZero:true,

min:0,

max:100,

ticks:{ stepSize:10 }

}

}

}

});

}



// =============================
// MARKS TABLE
// =============================

function loadMarksTable(marks){

const table = document.getElementById("marksTable");

if(!table) return;


if(!marks.subjects || marks.subjects.length===0){

table.innerHTML="<p>No marks available</p>";

return;

}


let html=`

<table style="width:100%; border-collapse:collapse;">

<tr>

<th>Subject</th>

<th>Marks</th>

</tr>
`;


marks.subjects.forEach((subject,i)=>{

html+=`

<tr>

<td>${subject}</td>

<td>${marks.values[i]}</td>

</tr>
`;

});


html+="</table>";

table.innerHTML=html;

}



// =============================
// ATTENDANCE TABLE
// =============================

function loadAttendanceTable(att){

const table=document.getElementById("attendanceTable");

if(!table) return;


if(!att.subjects || att.subjects.length===0){

table.innerHTML="<p>No attendance available</p>";

return;

}


let html=`

<table style="width:100%; border-collapse:collapse;">

<tr>

<th>Subject</th>

<th>Attendance %</th>

</tr>
`;


att.subjects.forEach((subject,i)=>{

html+=`

<tr>

<td>${subject}</td>

<td>${att.values[i]}%</td>

</tr>
`;

});


html+="</table>";

table.innerHTML=html;

}



// =============================
// UPDATE PROFILE
// =============================
async function updateProfile(){

const name =
document.getElementById("studentName").value;

const currentPassword =
document.getElementById("currentPassword").value;

const newPassword =
document.getElementById("studentPassword").value;

const email =
localStorage.getItem("userEmail");


const result =
await ipcRenderer.invoke(

"updateStudentProfile",

{
email,
name,
currentPassword,
newPassword
}

);


// Show message

document.getElementById("profileMsg").innerText = result;


// ✅ Reload profile to update UI instantly

await loadProfile();


// Also update view card

const user =
await ipcRenderer.invoke("getStudentProfile", email);

document.getElementById("viewName").innerText =
user.name;

document.getElementById("viewEmail").innerText =
user.email;

document.getElementById("viewRole").innerText =
user.role;

}



// =============================
// UPDATE STATS CARDS
// =============================

function updateStats(data){

const marks=data.marks.values || [];

const att=data.attendance.values || [];


const avgMarks=marks.length

? (marks.reduce((a,b)=>a+b,0)/marks.length).toFixed(1)

: "--";


const avgAttendance=att.length

? (att.reduce((a,b)=>a+b,0)/att.length).toFixed(1)

: "--";


const totalSubjects=marks.length || "--";


document.getElementById("avgMarks").innerText=avgMarks;

document.getElementById("avgAttendance").innerText=avgAttendance+"%";

document.getElementById("totalSubjects").innerText=totalSubjects;

}



// =============================
// LOAD COURSES
// =============================

async function loadCourses(){

const courses=

await ipcRenderer.invoke("getStudentCourses", email);


const list=document.getElementById("coursesList");

if(!list) return;


if(!courses || courses.length===0){

list.innerHTML="<p>No courses enrolled</p>";

return;

}


let html="<ul>";

courses.forEach(c=>{

html+=`<li>${c.course_name}</li>`;

});

html+="</ul>";

list.innerHTML=html;

}

async function runAIAnalysis() {

try{

const result = await ipcRenderer.invoke(
"analyzeStudent",
email
);

document.getElementById("aiResult").innerText = result;

}
catch(error){

console.error("AI error:", error);

document.getElementById("aiResult").innerText =
"AI analysis failed.";

}

}