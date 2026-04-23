const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = "dashboard";

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trim());
}

// ===== FILES =====
write(`${root}/package.json`, `{
  "name": "login-dashboard",
  "private": true,
  "scripts": { "dev": "vite" },
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "socket.io-client": "^4.7.2",
    "chart.js": "^4",
    "react-chartjs-2": "^5"
  },
  "devDependencies": {
    "vite": "^5",
    "tailwindcss": "^3",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}`);

write(`${root}/index.html`, `
<!DOCTYPE html>
<html>
<body>
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
</body>
</html>
`);

write(`${root}/src/main.jsx`, `
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
`);

write(`${root}/src/App.jsx`, `
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default function App(){
  const [logs,setLogs]=useState([]);

  useEffect(()=>{
    socket.on("log",(d)=>setLogs(p=>[d,...p]));
  },[]);

  return (
    <div style={{background:"#111",color:"#fff",padding:20}}>
      <h2>Realtime Dashboard</h2>
      {logs.map((l,i)=>(
        <div key={i}>
          {l.username} | {l.status} | {l.balance}
        </div>
      ))}
    </div>
  )
}
`);

console.log("✅ Project created");

// ===== ZIP =====
try {
  execSync(`powershell Compress-Archive -Path ${root} -DestinationPath dashboard.zip`);
  console.log("📦 dashboard.zip created");
} catch (e) {
  console.log("Zip failed, create manually");
}