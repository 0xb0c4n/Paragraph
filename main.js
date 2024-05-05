// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, BrowserView} = require('electron')
const fs = require('fs');
const path = require('path')
var os = require('os');
var pty = require('node-pty');

ipcMain.on('file-path', (e, payload) => {
  if (!payload)
    return;

  let chemin = payload;
  try {
    let file = fs.readFileSync(chemin);
    let basename = path.basename(payload)
    if (!file) {
      e.reply('file-error', 'File does not exist');
      return;
    }

    e.reply('success', file.toString(), basename, chemin);
  } catch (e) {
    e.reply('file-error', 'There was an error reading file');
  }
})

ipcMain.on('file-path-2', (e, payload, fileCount) => {
  if (!payload)
    return;

  let chemin = payload;
  try {
    let file = fs.readFileSync(chemin);
    let basename = path.basename(payload)
    if (!file) {
      e.reply('file-error', 'File does not exist');
      return;
    }

    e.reply('success2', file.toString(), basename, chemin, fileCount);
  } catch (e) {
    e.reply('file-error', 'There was an error reading file');
  }
})
ipcMain.on('ondragstart', (event, filePath) => {
    
    readFile(filePath);

    function readFile(filepath) { 
      fs.readFile(filepath, 'utf-8', (err, data) => { 
        var basename = path.basename(filepath)
         
         if(err){ 
            console.log("An error ocurred reading the file " + err.message) 
            return 
         } 
         
         // handle the file content 
         event.sender.send('fileData', data, basename, filepath) 
      }) 
   } 

  })

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920, 
    height: 1080, 
    icon: './img/logo.png', 
    frame:false,
    background: "#323a44",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
      webviewTag: true
  }
  });

  mainWindow.loadFile('index.html')

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}
app.on('ready', () => {
  createWindow()
})


function quitApp() {
    remote.getCurrentWindow().close()
}

app.allowRendererProcessReuse = false