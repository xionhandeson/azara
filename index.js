//use path module
const path = require('path');
//use express module
const express = require('express');
//use hbs view engine
const hbs = require('hbs');
//use bodyParser middleware
const bodyParser = require('body-parser');
const api = express();
const product_api = require('./public/js/api');
const pdf_api = require('./public/js/pdf_api');

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

//route for homepage
product_api.load_homepage(api)

//get product by code
product_api.search_product_by_code(api)

//insert data
product_api.insert_product(api)

//update product quantity
product_api.update_product_quantity(api)

//update product
product_api.update_product_by_code(api)

//update product transaction
product_api.update_product_transaction(api)

//delete product transaction
product_api.delete_product_transaction(api)

//delete product
product_api.delete_product(api)

//download product pdf
pdf_api.download_product_pdf(api)

//download product transaction pdf
pdf_api.download_product_transaction_pdf(api)

//server listening
api.listen(8000, () => {
  console.log('Server is running at port 8000');
});
