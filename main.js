const { app, BrowserWindow, ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let win;

const dbPath = path.join(__dirname, 'database', 'edusphere.db');

const db = new sqlite3.Database(dbPath);

const OpenAI = require("openai");

require("dotenv").config();

const axios = require("axios");

const fs = require("fs")
const pdf = require("pdf-parse")
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js")
// ===============================
// AI CHAT MEMORY
// ===============================

let chatHistory = []

db.run(`
CREATE TABLE IF NOT EXISTS users (

    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    class_id INTEGER

)
`, (err) => {

    if(err){

        console.log("Table creation error:", err);

    } else {

        console.log("Users table ready");

    }

});

function createWindow() {

    win = new BrowserWindow({

        width: 1200,
        height: 800,

        show: false,   // important

        webPreferences: {

            nodeIntegration: true,
            contextIsolation: false

        }

    });


    win.loadFile('renderer/login.html');


    // ✅ FIX 1 — Show window only after ready

    win.once('ready-to-show', () => {

        win.show();

        win.focus();

    });


    

    win.webContents.on('did-finish-load', () => {

        win.webContents.focus();

        win.focus();

    });

}

app.whenReady().then(createWindow);


ipcMain.handle("register", (event, email, password, role) => {

    return new Promise((resolve) => {

        db.get(
            "SELECT * FROM users WHERE email=?",
            [email],
            (err, row) => {

                if (row) {

                    resolve("exists");

                } else {

                    db.run(
                        "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
                        ["User", email, password, role],
                        () => resolve("success")
                    );

                }

            }
        );

    });

});


ipcMain.handle("login", (event, email, password, role) => {

    return new Promise((resolve) => {

        db.get(
            "SELECT * FROM users WHERE email=? AND password=? AND role=?",
            [email, password, role],
            (err, row) => {

                if (row) {

                    resolve("success");

                } else {

                    resolve("invalid");

                }

            }
        );

    });

});

ipcMain.handle("getStudentData",(event,email)=>{

return new Promise((resolve)=>{

db.all(

"SELECT subject,marks FROM marks WHERE student_email=?",

[email],

(err,marks)=>{

db.all(

"SELECT subject,attendance FROM attendance WHERE student_email=?",

[email],

(err,att)=>{

resolve({

marks:{

subjects:marks.map(m=>m.subject),

values:marks.map(m=>m.marks)

},

attendance:{

subjects:att.map(a=>a.subject),

values:att.map(a=>a.attendance)

}

});

});

});

});

});

db.run(`

CREATE TABLE IF NOT EXISTS marks(

id INTEGER PRIMARY KEY,

student_email TEXT,

subject TEXT,

marks INTEGER

)

`);

db.run(`

CREATE TABLE IF NOT EXISTS attendance(

id INTEGER PRIMARY KEY,

student_email TEXT,

subject TEXT,

attendance INTEGER

)

`);

db.run(`

CREATE TABLE IF NOT EXISTS courses(

id INTEGER PRIMARY KEY AUTOINCREMENT,

student_email TEXT,

course_name TEXT

)

`);



ipcMain.handle("getStudentProfile",(event,email)=>{

return new Promise((resolve)=>{

db.get(

"SELECT name,email FROM users WHERE email=?",

[email],

(err,row)=>{

resolve(row);

});

});

});



ipcMain.handle("updateStudentProfile", async(event,data)=>{

return new Promise((resolve)=>{


db.get(

"SELECT password FROM users WHERE email=?",

[data.email],

(err,row)=>{


if(!row){

resolve("User not found");

return;

}


if(row.password !== data.currentPassword){

resolve("Incorrect current password");

return;

}


db.run(

"UPDATE users SET name=?, password=? WHERE email=?",

[
data.name || row.name,
data.newPassword || row.password,
data.email
],

()=>{

resolve("Profile updated successfully");

});

});

});
});

ipcMain.handle("getStudentCourses",(event,email)=>{

return new Promise((resolve)=>{

db.all(

"SELECT course_name FROM courses WHERE student_email=?",

[email],

(err,rows)=>{

resolve(rows);

});

});

});

ipcMain.handle("addMarks",(event,data)=>{

return new Promise((resolve)=>{

db.get(

`SELECT * FROM marks 
 WHERE student_email=? AND subject=?`,

[data.email,data.subject],

(err,row)=>{

if(row){

// UPDATE

db.run(

`UPDATE marks 
 SET marks=? 
 WHERE student_email=? AND subject=?`,

[data.marks,data.email,data.subject],

()=>resolve("Marks updated")

);

}
else{

// INSERT

db.run(

`INSERT INTO marks(student_email,subject,marks)
 VALUES(?,?,?)`,

[data.email,data.subject,data.marks],

()=>resolve("Marks added")

);

}

});

});

});

// ===============================
// TEACHER - STUDENTS CRUD
// ===============================

ipcMain.handle("getStudents", ()=>{

return new Promise((resolve)=>{

db.all(

"SELECT name,email FROM users WHERE role='student'",

[],

(err,rows)=>resolve(rows || [])

);

});

});


ipcMain.handle("addStudent",(event,data)=>{

return new Promise((resolve)=>{

db.run(

"INSERT INTO users(name,email,password,role) VALUES(?,?,?,'student')",

[data.name,data.email,data.password],

(err)=>{

if(err){

resolve("Student already exists");

}else{

resolve("Student added successfully");

}

}

);

});

});


ipcMain.handle("deleteStudent",(event,email)=>{

return new Promise((resolve)=>{

db.run(

"DELETE FROM users WHERE email=? AND role='student'",

[email],

()=>resolve()

);

});

});



// ===============================
// TEACHER - MARKS CRUD
// ===============================

ipcMain.handle("getAllMarks", ()=>{

return new Promise((resolve)=>{

db.all(

"SELECT * FROM marks",

[],

(err,rows)=>resolve(rows || [])

);

});

});


ipcMain.handle("deleteMarks",(event,id)=>{

return new Promise((resolve)=>{

db.run(

"DELETE FROM marks WHERE id=?",

[id],

()=>resolve()

);

});

});



// ===============================
// TEACHER - ATTENDANCE CRUD
// ===============================

ipcMain.handle("getAllAttendance", ()=>{

return new Promise((resolve)=>{

db.all(

"SELECT * FROM attendance",

[],

(err,rows)=>resolve(rows || [])

);

});

});


ipcMain.handle("deleteAttendance",(event,id)=>{

return new Promise((resolve)=>{

db.run(

"DELETE FROM attendance WHERE id=?",

[id],

()=>resolve()

);

});

});



// ===============================
// TEACHER PROFILE
// ===============================

ipcMain.handle("getTeacherProfile",(event,email)=>{

return new Promise((resolve)=>{

db.get(

"SELECT name,email FROM users WHERE email=? AND role='teacher'",

[email],

(err,row)=>resolve(row || {})

);

});

});



// ===============================
// DASHBOARD CLASS AVERAGE
// ===============================

ipcMain.handle("getStudentDataForDashboard",()=>{

return new Promise((resolve)=>{

db.all("SELECT subject, AVG(marks) as avg FROM marks GROUP BY subject",[],(err,marks)=>{

db.all("SELECT subject, AVG(attendance) as avg FROM attendance GROUP BY subject",[],(err,attendance)=>{

resolve({

subjects:marks.map(m=>m.subject),

avgMarks:marks.map(m=>Math.round(m.avg)),

avgAttendance:attendance.map(a=>Math.round(a.avg))

});

});

});

});

});

ipcMain.handle("addAttendance", async (event, data) => {

return new Promise((resolve, reject) => {

db.get(
"SELECT * FROM attendance WHERE student_email=? AND subject=?",
[data.email, data.subject],
(err, row) => {

if (err) {
reject(err);
return;
}

if (row) {

// UPDATE existing record

db.run(
"UPDATE attendance SET attendance=? WHERE student_email=? AND subject=?",
[data.attendance, data.email, data.subject],
() => resolve("Attendance updated successfully")
);

} else {

// INSERT new record

db.run(
"INSERT INTO attendance(student_email,subject,attendance) VALUES(?,?,?)",
[data.email, data.subject, data.attendance],
() => resolve("Attendance saved successfully")
);

}

});

});

});

ipcMain.handle("analyzeStudent", async (event, email) => {

try{

const marks = await new Promise((resolve,reject)=>{
db.all(
"SELECT subject,marks FROM marks WHERE student_email=?",
[email],
(err,rows)=>{
if(err) reject(err);
else resolve(rows);
});
});

const attendance = await new Promise((resolve,reject)=>{
db.all(
"SELECT subject,attendance FROM attendance WHERE student_email=?",
[email],
(err,rows)=>{
if(err) reject(err);
else resolve(rows);
});
});

const prompt = `
You are EduSphere AI.

Analyze student performance.

Marks:
${JSON.stringify(marks)}

Attendance:
${JSON.stringify(attendance)}

Give:
Strong subjects
Weak subjects
Performance summary
Improvement tips

Keep clean and readable.
`;

const response = await axios.post(
"http://localhost:11434/api/generate",
{
model: "llama3:8b",
prompt: prompt,
stream: false
}
);

return response.data.response;

}
catch(error){

console.error(error);
return "AI analysis failed";

}

});

ipcMain.handle("aiChat", async (event, message) => {

try{

// Save user message
chatHistory.push({
role: "user",
content: message
})

// Keep only last 10 messages
if(chatHistory.length > 10){
chatHistory.shift()
}

const conversation = chatHistory
.map(m => `${m.role}: ${m.content}`)
.join("\n")

const prompt = `
You are EduSphere AI.

You assist both teachers and students.

If a teacher asks:
- help create quiz questions
- explain topics for teaching
- summarize study material
- analyze academic performance

If a student asks:
- explain concepts clearly
- solve problems step-by-step
- provide examples.

Question:
${message}

Give a clear helpful response.
`

const response = await axios.post(
"http://localhost:11434/api/generate",
{
model:"llama3:8b",
prompt:prompt,
stream:false,
options:{
num_predict:800
}
}
)

const aiReply = response.data.response

// Save AI response
chatHistory.push({
role:"assistant",
content:aiReply
})

return aiReply

}
catch(error){

console.error(error)
return "AI tutor failed"

}

})



ipcMain.handle("analyzeFile", async (event, file) => {

try{

const tempPath = path.join(__dirname,"temp_"+file.name)

fs.writeFileSync(tempPath, Buffer.from(file.data))

let extractedText = ""

const ext = path.extname(file.name).toLowerCase()

// PDF
if(ext === ".pdf"){

const buffer = fs.readFileSync(tempPath)

const pdfData = await pdf(buffer)

extractedText = pdfData.text

}

// IMAGE OCR
else if(ext === ".png" || ext === ".jpg" || ext === ".jpeg"){

const result = await Tesseract.recognize(tempPath,"eng")

extractedText = result.data.text

}

// TXT
else if(ext === ".txt"){

extractedText = fs.readFileSync(tempPath,"utf8")

}

// DOCX
else if(ext === ".docx"){

const result = await mammoth.extractRawText({path: tempPath})

extractedText = result.value

}

// DOC (limited)
else if(ext === ".doc"){

return "DOC format not fully supported. Please convert to DOCX."

}

else{

return "Unsupported file type."

}

// limit size for AI
extractedText = extractedText.slice(0,6000)

const prompt = `
You are EduSphere AI tutor.

Analyze the uploaded study material and explain clearly.

Tasks:
- Explain the topic simply
- Summarize key points
- Highlight formulas or definitions

Material:
${extractedText}
`

const response = await axios.post(
"http://localhost:11434/api/generate",
{
model:"llama3:8b",
prompt:prompt,
stream:false,
options:{
num_predict:800
}
}
)

fs.unlinkSync(tempPath)

return response.data.response

}
catch(error){

console.error(error)

return "File analysis failed"

}

})