var $ = require('jquery');
var fs = require('fs'); 
const ipc = require('electron').ipcRenderer;
const { dialog } = require('electron').remote;
const path = require('path')
var os = require('os');
var pty = require('node-pty');
var Terminal = require('xterm').Terminal;
var shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
// const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
//   cols: 10,
//   rows: 500,
  cwd: ((file.path != undefined) && (fs.existsSync(file.path))) ? path.join(file.path, '..') : process.env.HOME,
  // cwd: '.',
  env: process.env
});
console.log(file.path);
// console.log(process.env);

// Initialize xterm.js and attach it to the DOM
global.xterm = new Terminal({ allowTransparency: true });
xterm.open(document.getElementById('terminal'));
xterm.fit();
xterm.setOption('theme', {
    background: 'rgba(255,255,255,0)'
});
console.log(xterm);

// Setup communication between xterm.js and node-pty
xterm.on('data', (data) => {
    // console.log(data);
  ptyProcess.write(data);
});
ptyProcess.on('data', function (data) {
    // console.log(data);
  xterm.write(data);
});
xterm.open(document.getElementById('terminal'));

var dragFile= document.querySelector('body');
var fileCount = 0;

$(window).bind('keydown', function(event){
  if (event.ctrlKey) {
      switch (String.fromCharCode(event.which).toLowerCase()) {
        case 'n':
            event.preventDefault();
            createNewFile();
            break;
        
        case 'o':
            event.preventDefault();
            openFile();
            break;

        case 't': 
            event.preventDefault();
            createNewFile();
            break; 

        case 'q': 
            event.preventDefault();
            showOrHideTerminal();
            break; 
      } 
  } else if(event.shiftKey)  {
    switch (String.fromCharCode(event.which).toLowerCase()) {
      case 'o':
          event.preventDefault();
          selectFolder();
          break;
    }
  }

});

dragFile.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
  
      for (let f of e.dataTransfer.files) {
        console.log('The file(s) you dragged: ', f)
        ipc.send('ondragstart', f.path)
      }
    });

dragFile.addEventListener('dragover', function (e) {
  e.preventDefault();
  e.stopPropagation();
});

/** FUNCTIONS */

function createNewFile(){
	
  mode = "text";
  fileCount++
  savingAllowed = true;	
  
  var editor = ace.edit('editor')
    editor.setTheme("ace/theme/nord_dark");
  editor.setFontSize(17)

  var newSessionFile = ace.createEditSession('', 'ace/mode/' + mode/*optional*/)
  editor.setSession(newSessionFile)

  $(window).bind('keydown', function(event) {
    if (event.ctrlKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
        case 's':
          let content = editor.getValue()
          dialog.showSaveDialog({ 
            title: 'Select the File Path to save', 
            // defaultPath: path.join(__dirname, '../assets/'), 
            buttonLabel: 'Save', 
            // Restricting the user to only Text Files. 
            filters: [ 
                { 
                    name: 'All files', 
                    extensions: ['*'] 
                }, ], 
            properties: [] 
        }).then(file => { 
            // Stating whether dialog operation was cancelled or not.  
            if (!file.canceled) { 
                  var filePath = file.filePath.toString()
                  
                // Creating and Writing to the sample.txt file 
                fs.writeFile(file.filePath.toString(),  
                             content, function (err) { 
                    if (err) throw err; 
                    console.log(filePath); 
                    ipc.send('file-path-2', filePath, fileCount);
                }); 
            } 
        }).catch(err => { 
            console.log(err) 
        }); 
        break;
        }
    }
  })

  $('.tabs-container').append("<p id=" + fileCount + "><img class='tabs-paragraph-icon' src='png/file.png' width='15' height='16'/>&nbsp;Untitled " + fileCount +  " <i class='fal fa-times'></i></p>&nbsp;")    
  
  return true;
}

function openFile() {      
  dialog.showOpenDialog(
    {
      filters: [
      ],
      properties: ['openFile']
    })
    // I think this should contain file path in one of the properties
    .then(result => {
      if (result && result.filePaths && result.filePaths.length) {
        console.log(result.filePaths[0])
        let filePath = result.filePaths[0];
        // send this file to main process to be processed.
        ipc.send('file-path', filePath);
      }
    });
}

function selectFolder() {      // open read file dialog box
  
}

function showOrHideTerminal() {
  $('#terminal').toggleClass('show')
}

/** IPC FUNCTIONS */

ipc.on('success', (event, fileData, basename, file) => {
  var editor = ace.edit('editor')
  editor.setTheme("ace/theme/nord_dark");
  editor.setFontSize(17)
  editor.setShowPrintMargin(false);
editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true
});
  extension = basename.split('.').pop();

  "html"===extension&&(mode="html"),"js"===extension&&(mode="javascript"),"css"===extension&&(mode="css"),"php"===extension&&(mode="php"),"txt"===extension&&(mode="text"),"c"===extension&&(mode="c_cpp"),"py"===extension&&(mode="python"),"dart"===extension&&(mode="dart");

  "js"===extension&&(icon="js"),"html"===extension&&(icon="html"),"txt"===extension&&(icon="file")
  editor.session.setMode('ace/' + mode)
  newSession = ace.createEditSession(fileData.toString(), 'ace/mode/' + mode/*optional*/)
  editor.setSession(newSession)
  $('.name').innerHTML = ""
  $('.name').html(basename + " - " + file)
  $('.tabs-container').append("<p><img class='tabs-paragraph-icon' src='png/" + icon +".png' width='15' height='16'/>&nbsp;" + basename + " <i class='fal fa-times'></i></p>&nbsp;")    

  $(window).bind('keydown', function(event) {
    if (event.ctrlKey || event.metaKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
        case 's':
          let content = editor.getValue()
          fs.writeFile(file, content, (err) => {
            if (err) {
                alert("An error ocurred updating the file" + err.message);
                console.log(err);
                return;
            }
        
            alert("The file has been succesfully saved");
        });
        }
    }
  })
})

ipc.on('success2', (event, fileData, basename, file, fileCount) => {

  var editor = ace.edit('editor') 
  editor.setTheme("ace/theme/nord_dark");
  editor.setFontSize(17)
  editor.setShowPrintMargin(false);
editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true
});
  extension = basename.split('.').pop();

  "html"===extension&&(mode="html"),"js"===extension&&(mode="javascript"),"css"===extension&&(mode="css"),"php"===extension&&(mode="php"),"txt"===extension&&(mode="text"),"c"===extension&&(mode="c_cpp"),"py"===extension&&(mode="python"),"dart"===extension&&(mode="dart");

  "js"===extension&&(icon="js"),"html"===extension&&(icon="html"),"txt"===extension&&(icon="file")
  editor.session.setMode('ace/' + mode)
  newSession = ace.createEditSession(fileData.toString(), 'ace/mode/' + mode/*optional*/)
  editor.setSession(newSession)
  $('.name').innerHTML = ""
  $('.name').html(basename + " - " + file)
  $('.tabs-container').append("<p id=" + fileCount + "><img class='tabs-paragraph-icon' src='png/" + icon +".png' width='15' height='16'/>&nbsp;" + basename + " <i class='fal fa-times'></i></p>&nbsp;")    

  $(window).bind('keydown', function(event) {
    if (event.ctrlKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
        case 's':
          event.preventDefault()
          event.stopPropagation()
          console.log('test')
        }
    }
  })
})

var show1 = true;
$('.fontawesome').click(function(e) {
    if(show1){
        $('#ft').removeClass('visible')
        show1 = false
    }else{
      $('#st').removeClass('visible')
      $('#gt').removeClass('visible')
      $('#yt').removeClass('visible')
      $('#ft').addClass('visible')
      show1 = true;
    }
})

var show2 = true;
$('.github').click(function(e) {
    if(show2){
      $('#gt').removeClass('visible')
      show2 = false
    }else{
      $('#st').removeClass('visible')
      $('#ft').removeClass('visible')
      $('#yt').removeClass('visible')
      $('#gt').addClass('visible')
      show2 = true;
    }
})

var show3 = true;
$('.stack').click(function(e) {
    if(show3){
      $('#st').removeClass('visible')
      show3 = false
    }else{
      $('#gt').removeClass('visible')
      $('#ft').removeClass('visible')
      $('#yt').removeClass('visible')
      $('#st').addClass('visible')
      show3 = true;
    }
})

var show4 = true;
$('.youtube').click(function(e) {
    if(show4){
      $('#yt').removeClass('visible')
      show4 = false
    }else{
      $('#gt').removeClass('visible')
      $('#st').removeClass('visible')
      $('#ft').removeClass('visible')
      $('#yt').addClass('visible')
      show4 = true;
    }
})

var show5 = true;
$('.youtube').click(function(e) {
    if(show5){
      $('#yt').removeClass('visible')
      show5 = false
    }else{
      $('#gt').removeClass('visible')
      $('#st').removeClass('visible')
      $('#ft').removeClass('visible')
      $('#yt').addClass('visible')
      show5 = true;
    }
})