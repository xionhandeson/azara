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
	update_product_quantity: function(api) {
		api.post('/update_quantity',(req, res) => {
			let created_date = req.body.created_date == null || req.body.created_date == '' ? helper.created_date() : req.body.created_date;
			let product_id = [req.body.product_id];
			let insert_product_transaction_sql;
			db.get(sql.PRODUCT_SEARCH, product_id, (error, product) => {
				if(req.body.quantity_in != null) {
					quantity = parseInt(req.body.quantity_in)
					total_quantity = product.quantity + quantity
					insert_product_transaction_sql = "INSERT INTO ProductTransaction(product_id, quantity_in, description, created_date) VALUES(?, ?, ?, ?)";
				} else if (req.body.quantity_out != null) {
					quantity = parseInt(req.body.quantity_out)
					total_quantity = product.quantity - quantity
					insert_product_transaction_sql = "INSERT INTO ProductTransaction(product_id, quantity_out, description, created_date) VALUES(?, ?, ?, ?)";
				} else {
					console.log("Invalid quantity entered")
				}
				if(error) console.log(error);
				db.run(insert_product_transaction_sql, [product_id, quantity, req.body.description, created_date], (err) => {
					if(err) console.log(err);
					db.run(sql.PRODUCT_UPDATE_QUANTITY, [total_quantity, product_id], (error) => {
						if(error) console.log(error);
					});
					product_service.get_product_by_code([product.code], res, req, db)
				});
			});
		});
	},
	update_product_transaction: function(api) {
		api.post('/update_product_transaction',(req, res) => {
			let created_date = req.body.created_date == null || req.body.created_date == '' ? helper.created_date() : req.body.created_date;
			let product_id = [req.body.product_id];
			db.get(sql.PRODUCT_SEARCH, product_id, (error, product) => {
				db.get(sql.PRODUCT_TRANSACTION_SEARCH_BY_ID, req.body.id, (error, productTransaction) => {
					if(req.body.quantity_in != null) {
						quantity = parseInt(req.body.quantity_in)
						total_quantity = product.quantity + (quantity - productTransaction.quantity_in)
						insert_product_transaction_sql = "UPDATE ProductTransaction SET quantity_in = ?, description = ?, created_date  = ? WHERE id = ?";
					} else if (req.body.quantity_out != null) {
						quantity = parseInt(req.body.quantity_out)
						total_quantity = product.quantity + (productTransaction.quantity_out - quantity)
						insert_product_transaction_sql = "UPDATE ProductTransaction SET quantity_out = ?, description = ?, created_date  = ? WHERE id = ?";
					} else {
						console.log("Invalid quantity entered")
					}
					if(error) console.log(error);
					db.run(insert_product_transaction_sql, [quantity, req.body.description, created_date, req.body.id], (err) => {
						if(err) console.log(err);
						let update_product_sql = `UPDATE product SET quantity = ? WHERE id = ?`;
						db.run(update_product_sql, [total_quantity, product_id], (error) => {
							if(error) console.log(error);
						});
						product_service.get_product_by_code([product.code], res, req, db)
					});
				});
			});
		});
	},
	delete_product_transaction: function(api){
		api.post('/delete_product_transaction',(req, res) => {
			db.run(sql.PRODUCT_TRANSACTION_DELETE, req.body.id, (error) => {
				db.get(sql.PRODUCT_SEARCH, req.body.product_id, (error, product) => {
					if(error) {
						dialog.showErrorBox("Error", "Unable to delete product transaction")
						return;
					} else {
						if(req.body.quantity_in != 0) {
							total_quantity = product.quantity - parseInt(req.body.quantity_in)
						} else if (req.body.quantity_out != 0) {
							total_quantity = product.quantity + parseInt(req.body.quantity_out)
						} else {
							console.log("Invalid quantity entered")
						}
						db.run(sql.PRODUCT_UPDATE_QUANTITY, [total_quantity, req.body.product_id], (error) => {
							if(error) console.log(error);
						});
						product_service.get_product_by_code([product.code], res, req, db)
					}
				});
			});
		});
	},
};
