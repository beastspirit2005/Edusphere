const { ipcRenderer } = require("electron");


// LOGIN FUNCTION

async function login(){

const email = document.getElementById("email").value.trim();

const password = document.getElementById("password").value.trim();

const role = document.getElementById("role").value.toLowerCase();


if(!email || !password){

alert("Please enter email and password");

return;

}


try{

const result = await ipcRenderer.invoke(

"login",
email,
password,
role

);


if(result === "success"){


// SAVE SESSION

localStorage.setItem("userEmail", email);

localStorage.setItem("userRole", role);


alert("Login successful");


// REDIRECT

if(role === "student"){

window.location.href = "student.html";

}
else{

window.location.href = "teacher.html";

}

}
else{

alert("Invalid login credentials");

}

}
catch(error){

console.error(error);

alert("Login error");

}

}




// REGISTER FUNCTION

async function register(){

const email = document.getElementById("email").value.trim();

const password = document.getElementById("password").value.trim();

const role = document.getElementById("role").value.toLowerCase();


if(!email || !password){

alert("Enter email and password");

return;

}


try{

const result = await ipcRenderer.invoke(

"register",
email,
password,
role

);


if(result === "exists"){

alert("User already exists");

}
else{

alert("Registration successful");

}

}
catch(error){

console.error(error);

alert("Registration error");

}

}