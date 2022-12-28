//use path module
const path = require('path');
//use express module
const express = require('express');
//use hbs view engine
const hbs = require('hbs');
//use bodyParser middleware
const bodyParser = require('body-parser');
const api = express();
const sqlite3 = require('sqlite3').verbose();
const home_service = require('./services/HomeService');
const product_api = require('./controller/ProductController');
const product_transaction_api = require('./controller/ProductTransactionController');
const home_api = require('./controller/HomeController');
const pdf_api = require('./controller/PdfController');

//Set Electron
const { app, BrowserWindow } = require('electron')

console.log(app.getPath('appData'));

let db = new sqlite3.Database(app.getPath('appData')+"/azara.db", (err) => {
  if (err) {
    return console.error(err.message);
  } else {
		console.log('Connected to the in-memory SQlite database.');
		home_service.create_tables(db);
	}
});

if (require('electron-squirrel-startup')) return;

// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

function createWindow () {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadURL('http://localhost:8000')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

//set view engine
api.set('views',path.join(__dirname,'views'));
api.set('view engine', 'hbs');
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: false }));
//set public folder as static folder for static file
api.use('/assets',express.static(__dirname + '/public'));

//Homepage
home_api.load_homepage(app, api, db)

//Product
product_api.insert_product(api, db)
product_api.search_product_by_code(api, db)
product_api.update_product_by_code(api, db)
product_api.delete_product(api, db)

//Product Transaction
product_transaction_api.update_product_quantity(api, db)
product_transaction_api.update_product_transaction(api, db)
product_transaction_api.delete_product_transaction(api, db)

//PDF
pdf_api.download_product_pdf(api, db)
pdf_api.download_product_transaction_pdf(api, db)

//server listening
api.listen(8000, () => {
  console.log('Server is running at port 8000');
});
