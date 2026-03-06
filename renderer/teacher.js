const { ipcRenderer } = require("electron");

/* =============================
   GLOBAL SUBJECT LIST
============================= */

const subjects = [
"Maths","Physics","Chemistry","English","Computer"
];

/* =============================
   CHART VARIABLES
============================= */

let marksChart = null;
let attendanceChart = null;


/* =============================
   INITIAL LOAD
============================= */

init();

async function init(){

applySavedTheme();

await loadDashboard();
await loadStudents();
await loadStudentsDropdown();
await loadMarks();
await loadAttendance();
await loadTeacherProfile();

}


/* =============================
   DASHBOARD (AVERAGES)
============================= */

async function loadDashboard(){

const data =
await ipcRenderer.invoke("getStudentDataForDashboard");

if(!data) return;

if(marksChart) marksChart.destroy();
if(attendanceChart) attendanceChart.destroy();

marksChart = new Chart(avgMarksChart,{
type:"bar",
data:{
labels:data.subjects,
datasets:[{
label:"Average Marks",
data:data.avgMarks
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
scales:{ y:{ beginAtZero:true, max:100 } }
}
});

attendanceChart = new Chart(avgAttendanceChart,{
type:"bar",
data:{
labels:data.subjects,
datasets:[{
label:"Average Attendance",
data:data.avgAttendance
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
scales:{ y:{ beginAtZero:true, max:100 } }
}
});

}


/* =============================
   STUDENTS CRUD
============================= */

async function loadStudents(){

const students =
await ipcRenderer.invoke("getStudents");

let html =
"<table><tr><th>Name</th><th>Email</th><th>Action</th></tr>";

students.forEach(s=>{

html+=`
<tr>
<td>${s.name}</td>
<td>${s.email}</td>
<td>
<button onclick="deleteStudent('${s.email}')">
Delete
</button>
</td>
</tr>
`;

});

html+="</table>";

studentTable.innerHTML=html;
}


async function addStudent(){

const name=newStudentName.value;
const email=newStudentEmail.value;
const password=newStudentPassword.value;

const result =
await ipcRenderer.invoke("addStudent",{name,email,password});

studentMsg.innerText=result;

newStudentName.value="";
newStudentEmail.value="";
newStudentPassword.value="";

await loadStudents();
await loadStudentsDropdown();
await loadMarks();
await loadAttendance();
await loadDashboard();

}


async function deleteStudent(email){

await ipcRenderer.invoke("deleteStudent",email);

await loadStudents();
await loadStudentsDropdown();
await loadMarks();
await loadAttendance();
await loadDashboard();

}


/* =============================
   STUDENT DROPDOWN
============================= */

async function loadStudentsDropdown(){

const students =
await ipcRenderer.invoke("getStudents");

let options="";

students.forEach(s=>{
options+=`<option value="${s.email}">${s.email}</option>`;
});

studentSelect.innerHTML=options;
studentSelectAtt.innerHTML=options;

}


/* =============================
   MARKS SECTION
============================= */

async function addMarks(){

const email = studentSelect.value;
const subject = document.getElementById("subject").value;
const marks = document.getElementById("marks").value;

if(!email || !subject || marks===""){
marksMsg.innerText="Fill all fields";
return;
}

await ipcRenderer.invoke("addMarks",{email,subject,marks});

marksMsg.innerText="Saved";
document.getElementById("marks").value="";

await loadMarks();
await loadDashboard();

}


async function loadMarks(){

const marks =
await ipcRenderer.invoke("getAllMarks");

const students =
await ipcRenderer.invoke("getStudents");

let table="<table>";

table+="<tr><th>Student</th>";
subjects.forEach(s=>table+=`<th>${s}</th>`);
table+="</tr>";

students.forEach(student=>{

table+="<tr>";
table+=`
<td>
${student.name}
<br>
<span style="font-size:12px;opacity:0.5">
${student.email}
</span>
</td>
`;

subjects.forEach(subject=>{

const record =
marks.find(m=>
m.student_email===student.email &&
m.subject===subject
);

const value = record ? record.marks : "";

table+=`
<td onclick="editMarksCell(this,'${student.email}','${subject}','${value}')">
${value ? value : "<span style='opacity:0.4'>-</span>"}
</td>
`;

});

table+="</tr>";
});

table+="</table>";

marksTable.innerHTML=table;
}


function editMarksCell(cell,email,subject,oldValue){

cell.innerHTML=`
<input type="number"
value="${oldValue}"
style="width:70px"
onblur="saveMarksInline(this,'${email}','${subject}')"
onkeydown="if(event.key==='Enter') saveMarksInline(this,'${email}','${subject}')">
`;

cell.querySelector("input").focus();
}


async function saveMarksInline(input,email,subject){

const marks=input.value;

await ipcRenderer.invoke("addMarks",{email,subject,marks});

await loadMarks();
await loadDashboard();
}


/* =============================
   ATTENDANCE SECTION
============================= */

async function addAttendance(){

const email=studentSelectAtt.value;
const subject=attSubject.value;
const attendance=document.getElementById("attendance").value;

if(!email || !subject || attendance===""){
attMsg.innerText="Fill all fields";
return;
}

await ipcRenderer.invoke("addAttendance",
{email,subject,attendance});

attMsg.innerText="Saved";
document.getElementById("attendance").value="";

await loadAttendance();
await loadDashboard();

}


async function loadAttendance(){

const attendance =
await ipcRenderer.invoke("getAllAttendance");

const students =
await ipcRenderer.invoke("getStudents");

let table="<table>";

table+="<tr><th>Student</th>";
subjects.forEach(s=>table+=`<th>${s}</th>`);
table+="</tr>";

students.forEach(student=>{

table+="<tr>";
table+=`
<td>
${student.name}
<br>
<span style="font-size:12px;opacity:0.5">
${student.email}
</span>
</td>
`;

subjects.forEach(subject=>{

const record =
attendance.find(a=>
a.student_email===student.email &&
a.subject===subject
);

const value = record ? record.attendance : "";

table+=`
<td onclick="editAttendanceCell(this,'${student.email}','${subject}','${value}')">
${value ? value : "<span style='opacity:0.4'>-</span>"}
</td>
`;

});

table+="</tr>";
});

table+="</table>";

attendanceTable.innerHTML=table;
}


function editAttendanceCell(cell,email,subject,oldValue){

cell.innerHTML=`
<input type="number"
value="${oldValue}"
style="width:70px"
onblur="saveAttendanceInline(this,'${email}','${subject}')"
onkeydown="if(event.key==='Enter') saveAttendanceInline(this,'${email}','${subject}')">
`;

cell.querySelector("input").focus();
}


async function saveAttendanceInline(input,email,subject){

const attendance=input.value;

await ipcRenderer.invoke("addAttendance",
{email,subject,attendance});

await loadAttendance();
await loadDashboard();
}


/* =============================
   TEACHER PROFILE
============================= */

async function loadTeacherProfile(){

const email =
localStorage.getItem("userEmail");

const teacher =
await ipcRenderer.invoke("getTeacherProfile",email);

teacherName.innerText =
teacher?.name || "";

teacherEmail.innerText =
teacher?.email || "";

teacherMobile.innerText =
teacher?.mobile || "-";

teacherClass.innerText =
teacher?.class || "-";

teacherSection.innerText =
teacher?.section || "-";

}


/* =============================
   THEME SYSTEM
============================= */

function applySavedTheme(){

const theme = localStorage.getItem("theme") || "dark";

if(theme === "light"){
document.body.classList.add("light");
}

}

function setTheme(theme){

localStorage.setItem("theme",theme);

applySavedTheme();

}