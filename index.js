//use path module
const path = require('path');
//use express module
const express = require('express');
//use hbs view engine
const hbs = require('hbs');
//use bodyParser middleware
const bodyParser = require('body-parser');
const api = express();
const product_api = require('./controller/ProductController');
const product_transaction_api = require('./controller/ProductTransactionController');
const home_api = require('./controller/HomeController');
const pdf_api = require('./controller/PdfController');

//Set Electron
const { app, BrowserWindow } = require('electron')

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
home_api.load_homepage(api)

//Product
product_api.insert_product(api)
product_api.search_product_by_code(api)
product_api.update_product_by_code(api)
product_api.delete_product(api)

//Product Transaction
product_transaction_api.update_product_quantity(api)
product_transaction_api.update_product_transaction(api)
product_transaction_api.delete_product_transaction(api)

//PDF
pdf_api.download_product_pdf(api)
pdf_api.download_product_transaction_pdf(api)

//server listening
api.listen(8000, () => {
  console.log('Server is running at port 8000');
});
