const helper = require('../utils/helper');
const { dialog } = require("electron");
const sql = require('../utils/SqlConstants');
const product_service = require('../services/ProductService');
const log = require('electron-log');

module.exports = {
  view_product: function (api, db) {
    api.post('/view_product', (req, res) => {
      const { id = '' } = req.body;

      // If neither code nor codes is provided, redirect to home
      if (!id) {
          return res.redirect('/');
      }
      console.log("id", id)
      // Prepare data for service and determine which service to use
      let data = id;
      let service = product_service.view_product;

      // Call the service and handle potential errors
      try {
          service(data, res, req, db);
      } catch (error) {
          console.error(error);
          res.status(500).send('An error occurred while searching for the product');
      }
    });
  },
  search_product_by_code: function(api, db) {
      api.post('/search_product_by_code', (req, res) => {
          const { code = '', codes = '', warehouse_code = '' } = req.body;

          // If neither code nor codes is provided, redirect to home
          if (!code && !codes && !warehouse_code) {
              return res.redirect('/');
          }

          // Prepare data for service and determine which service to use
          let data;
          let service;
          log.info("code", code)
          if (code && warehouse_code) {
              data = [code.toUpperCase(), warehouse_code.toUpperCase()];
              service = product_service.get_product_search_by_code_and_warehouse_code;
          } else if (warehouse_code) {
              data = [warehouse_code.toUpperCase()];
              service = product_service.get_multiple_product_by_warehouse_code;
          } else if (codes) {
              data = codes.toUpperCase().split(',');
              service = product_service.get_multiple_product_by_code;
          } else {
                log.info("here?")
              data = [code.toUpperCase()];
              service = product_service.get_product_by_code;
          }

          // Call the service and handle potential errors
          try {
              service(data, res, req, db);
          } catch (error) {
              console.error(error);
              res.status(500).send('An error occurred while searching for the product');
          }
      });
  },
  insert_product: function(api, db) {
      api.post('/save', (req, res) => {
          const { code = '', quantity, description, created_date = helper.created_date(), warehouse_code = '', } = req.body;
          const data = [code.toUpperCase(), quantity, description, created_date, warehouse_code.toUpperCase()];
          const get_product_sql = "SELECT id FROM PRODUCT order by id desc limit 1";
          const options = {
              buttons: ["Ok"],
              message: "Product added successfully"
          }
          db.run(sql.PRODUCT_INSERT, data, (err) => {
              if (err) {
                  dialog.showErrorBox("Duplicate", `Duplicated product with code ${code}`);
                  return;
              }
              db.get(get_product_sql, [], (err, product) => {
                  if (err) console.log(err);
                  db.run(sql.PRODUCT_TRANSACTION_INSERT, [product.id, quantity, description, created_date], (err) => {
                      if (err) {
                          console.log(err)
                          dialog.showErrorBox("Error", `Failed to insert product transaction for product with code ${code}`);
                          return;
                      }
                      dialog.showMessageBox(options);
                      res.redirect('/');
                  });
              });
          });
      });
  },
  update_product_by_code: function(api, db) {
    api.post('/update_product_by_code', (req, res) => {
        const { id, code = '', quantity, description, created_date = helper.created_date(), warehouse_code = '' } = req.body;
        if (!code) {
            dialog.showErrorBox("Error", "Product Code cannot be empty");
            return;
        }
        const error_msg = `Duplicated product with code ${code}`;
        const error_title = "Duplicate";
        const data = [quantity, description, created_date, warehouse_code.toUpperCase(), id];
        const options = {
            buttons: ["Ok"],
            message: "Product updated successfully"
        }
        db.get(sql.PRODUCT_SEARCH, req.body.id, (err, product) => {
          if (err) console.log(err);
          db.all(sql.PRODUCT_TRANSACTION_SEARCH, product.id, (err, productTransaction) => {
              if (product.quantity != quantity) {
                if (productTransaction.length > 1) {
                  dialog.showErrorBox("Error", "Product has more than one transaction, please update quantity in product detail page");
                  return;
                }
                db.run(sql.PRODUCT_TRANSACTION_SEARCH, data, (err) => {
                  if (err) {
                    dialog.showErrorBox(error_title, error_msg);
                    return;
                  }
                  db.run(sql.PRODUCT_TRANSACTION_UPDATE, [quantity, description, created_date, productTransaction[0].id], (err) => {
                    console.log(err);
                    if (err) {
                        dialog.showErrorBox("Error", `Failed to insert product transaction for product with code ${code}`);
                        return;
                    }
                    dialog.showMessageBox(options);
                    res.redirect('/');
                  });
                });
              } else {
                db.run(sql.PRODUCT_UPDATE, data, (err) => {
                    if (err) {
                        dialog.showErrorBox(error_title, error_msg);
                        return;
                    }
                    dialog.showMessageBox(options);
                    res.redirect('/');
                });
              }
          });
        });
    });
  },
  delete_product: function(api, db) {
    api.post('/delete_product', (req, res) => {
        const delete_product_sql = "DELETE FROM Product where id=?";
        const delete_product_transaction_sql = "DELETE FROM ProductTransaction where product_id=?";
        const options = {
            buttons: ["Ok"],
            message: "Product has been successfully deleted"
        }
        db.run(delete_product_sql, req.body.id, (error) => {
            if (error) {
                dialog.showErrorBox("Error", "Unable to delete product");
                return;
            }
            db.run(delete_product_transaction_sql, req.body.id, (error) => {
                if (error) {
                    dialog.showErrorBox("Error", "Unable to delete product");
                    return;
                }
                dialog.showMessageBox(options);
                res.redirect('/');
            });
        });
    });
  }
};
