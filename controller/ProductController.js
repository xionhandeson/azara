const helper = require('../utils/helper');
const { dialog } = require("electron");
const sql = require('../utils/SqlConstants');
const product_service = require('../services/ProductService');

//Create connection
const sqlite3 = require('sqlite3').verbose();

// open database in memory
let db = new sqlite3.Database('./azara.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
});

module.exports = {
	search_product_by_code: function(api){
		api.post('/search_product_by_code',(req, res) => {
			if (req.body.code == '' && req.body.codes == '') {
				res.redirect('/');
				return;
			}
			if (req.body.codes != '' && req.body.codes != undefined) {
				let formatted_codes = "'" + req.body.codes.toUpperCase().split(',').join("','") + "'";
				let data = [formatted_codes]
				product_service.get_multiple_product_by_code(data, res, req, db)
			}else {
				let data = [req.body.code.toUpperCase()]
				product_service.get_product_by_code(data, res, req, db)
			}
		});
	},
	insert_product: function(api){
		api.post('/save',(req, res) => {
			let created_date = req.body.created_date == null || req.body.created_date == '' ? helper.created_date() : req.body.created_date;
			let data = [req.body.code.toUpperCase(), req.body.quantity, req.body.description, created_date];
			let get_product_sql = "SELECT id FROM PRODUCT order by id desc limit 1";
			let options  = {
				buttons: ["Ok"],
				message: "Product added successfully"
			}
			db.run(sql.PRODUCT_INSERT, data, (err) => {
				if(err) {
					dialog.showErrorBox("Duplicate", "Duplicated product with code "+ req.body.code)
					return;
				} else {
					db.get(get_product_sql, [], (err, product) => {
						if(err) console.log(err)
						db.run(sql.PRODUCT_TRANSACTION_INSERT, [product.id, req.body.quantity, req.body.description, created_date], (err) => {
							if(err) {
								dialog.showErrorBox("Error", "Failed to insert product transaction for product with code "+ req.body.code)
								return;
							} else {
								dialog.showMessageBox(options)
								res.redirect('/');
							}
						});
					});
				}
			});
		});
	},
	update_product_by_code: function(api) {
		api.post('/update_product_by_code',(req, res) => {
			if(req.body.code == '' || req.body.code == null) {
			  dialog.showErrorBox("Error", "Product Code cannot be empty")
				return;
			}
			let created_date = req.body.created_date == null || req.body.created_date == '' ? helper.created_date() : req.body.created_date;
			let error_msg = "Duplicated product with code "+ req.body.code
			let error_title = "Duplicate"
			let data = [req.body.code.toUpperCase(), req.body.quantity, req.body.description, created_date, req.body.code.toUpperCase()];
			let options  = {
				buttons: ["Ok"],
				message: "Product updated successfully"
			}
			db.get(sql.PRODUCT_SEARCH, req.body.id, (err, product) => {
				if(err) console.log(err)
				db.all(sql.PRODUCT_TRANSACTION_SEARCH, product.id, (err, productTransaction) => {
					if (product.quantity != req.body.quantity ) {
						if (productTransaction.length > 1 ) {
							dialog.showErrorBox("Error", "Product has more than one transaction, please update quantity in product detail page")
							return;
						} else {
								db.run(sql.PRODUCT_TRANSACTION_SEARCH, data, (err) => {
									if(err) {
										dialog.showErrorBox(error_title, error_msg)
										return;
									} else {
									db.run(sql.PRODUCT_TRANSACTION_UPDATE, [req.body.quantity, req.body.description, created_date, productTransaction[0].id], (err) => {
											if(err) {
												dialog.showErrorBox("Error", "Failed to insert product transaction for product with code "+ req.body.code)
												return;
											} else {
												dialog.showMessageBox(options)
												res.redirect('/');
											}
									});
								}
							});
						}
					} else {
						db.run(sql.PRODUCT_UPDATE, data, (err) => {
							if(err) {
								dialog.showErrorBox(error_title, error_msg)
								return;
							} else {
								dialog.showMessageBox(options)
								res.redirect('/');
							}
						});
					}
				});
			});
		});
	},
	delete_product: function(api) {
		api.post('/delete_product',(req, res) => {
			let sql = "DELETE FROM Product where id=?";
			let get_product_transaction_sql = "DELETE FROM ProductTransaction where product_id=?";
			let options  = {
				buttons: ["Ok"],
				message: "Product has been successfully deleted"
			}
			db.run(sql, req.body.id, (error) => {
				db.run(get_product_transaction_sql, req.body.id, (error) => {
					if(error) {
						dialog.showErrorBox("Error", "Unable to delete product")
						return;
					} else {
						dialog.showMessageBox(options)
						res.redirect('/');
					}
				});
			});
		});
	}
};
