const helper = require('./helper');
const { dialog } = require("electron");

//Create connection
const sqlite3 = require('sqlite3').verbose();

// open database in memory
let db = new sqlite3.Database('./azara.db', (err) => {
  if (err) {
    return console.error(err.message);
  } else {
		console.log('Connected to the in-memory SQlite database.');
		create_tables(db);
	}
});

module.exports = {
	load_homepage: function(api){
		let sql = "SELECT * FROM Product order by code asc";
		api.get('/',(req, res) => {
			db.all(sql, (error, products) => {
				if(error) console.log(error);
				res.render('main',{
					products: products
				});
			});
		});
	},
	search_product_by_code: function(api){
		api.post('/search_product_by_code',(req, res) => {
			if (req.body.code == '' && req.body.codes == '') {
				res.redirect('/');
				return;
			}
			if (req.body.codes != '' && req.body.codes != undefined) {
				let formatted_codes = "'" + req.body.codes.toUpperCase().split(',').join("','") + "'";
				let data = [formatted_codes]
				get_multiple_product_by_code(data, res, req, db)
			}else {
				let data = [req.body.code.toUpperCase()]
				get_product_by_code(data, res, req, db)
			}
		});
	},
	insert_product: function(api){
		api.post('/save',(req, res) => {
			let created_date = req.body.created_date == null || req.body.created_date == '' ? helper.created_date() : req.body.created_date;
			let data = [req.body.code.toUpperCase(), req.body.quantity, req.body.description, created_date];
			let sql = "INSERT INTO product(code, quantity, description, created_date) VALUES(?, ?, ?, ?)";
			let insert_product_transaction_sql = "INSERT INTO ProductTransaction(product_id, quantity_in, description, created_date) VALUES(?, ?, ?, ?)";
			let get_product_sql = "SELECT id FROM PRODUCT order by id desc limit 1";
			let options  = {
				buttons: ["Ok"],
				message: "Product added successfully"
			}
			db.run(sql, data, (err) => {
				if(err) {
					dialog.showErrorBox("Duplicate", "Duplicated product with code "+ req.body.code)
					return;
				} else {
					db.get(get_product_sql, [], (err, product) => {
						if(err) console.log(err)
						db.run(insert_product_transaction_sql, [product.id, req.body.quantity, req.body.description, created_date], (err) => {
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
			let update_product_sql = `UPDATE product SET code = ?, quantity = ?, description = ?, created_date = ? WHERE code = ?`;
			let get_product_sql = "SELECT * FROM PRODUCT WHERE id=?";
			let get_product_transaction_sql = "SELECT * FROM ProductTransaction where product_id = ? order by id";
			let options  = {
				buttons: ["Ok"],
				message: "Product updated successfully"
			}
			db.get(get_product_sql, req.body.id, (err, product) => {
				if(err) console.log(err)
				update_product_transaction_sql = "UPDATE ProductTransaction SET quantity_in = ?, description = ?, created_date  = ? WHERE id = ?";
				db.all(get_product_transaction_sql, product.id, (err, productTransaction) => {
					if (product.quantity != req.body.quantity ) {
						if (productTransaction.length > 1 ) {
							dialog.showErrorBox("Error", "Product has more than one transaction, please update quantity in product detail page")
							return;
						} else {
								db.run(update_product_sql, data, (err) => {
									if(err) {
										dialog.showErrorBox(error_title, error_msg)
										return;
									} else {
									db.run(update_product_transaction_sql, [req.body.quantity, req.body.description, created_date, productTransaction[0].id], (err) => {
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
						db.run(update_product_sql, data, (err) => {
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
	update_product_quantity: function(api) {
		api.post('/update_quantity',(req, res) => {
			let created_date = req.body.created_date == null || req.body.created_date == '' ? helper.created_date() : req.body.created_date;
			let product_id = [req.body.product_id];
			let get_product_sql = "SELECT * FROM Product WHERE id = ?";
			let insert_product_transaction_sql;
			db.get(get_product_sql, product_id, (error, product) => {
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
					let update_product_sql = `UPDATE product SET quantity = ? WHERE id = ?`;
					db.run(update_product_sql, [total_quantity, product_id], (error) => {
						if(error) console.log(error);
					});
					get_product_by_code([product.code], res, req, db)
				});
			});
		});
	},
	update_product_transaction: function(api) {
		api.post('/update_product_transaction',(req, res) => {
			let created_date = req.body.created_date == null || req.body.created_date == '' ? helper.created_date() : req.body.created_date;
			let product_id = [req.body.product_id];
			let get_product_sql = "SELECT * FROM Product WHERE id = ?";
			let get_product_transaction_sql = "SELECT * FROM ProductTransaction WHERE id = ?";
			db.get(get_product_sql, product_id, (error, product) => {
				db.get(get_product_transaction_sql, req.body.id, (error, productTransaction) => {
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
						get_product_by_code([product.code], res, req, db)
					});
				});
			});
		});
	},
	delete_product_transaction: function(api){
		api.post('/delete_product_transaction',(req, res) => {
			let sql = "DELETE FROM ProductTransaction where id=?";
			let get_product_sql = "SELECT * FROM Product WHERE id=?";
			db.run(sql, req.body.id, (error) => {
				db.get(get_product_sql, req.body.product_id, (error, product) => {
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
						let update_product_sql = `UPDATE product SET quantity = ? WHERE id = ?`;
						db.run(update_product_sql, [total_quantity, req.body.product_id], (error) => {
							if(error) console.log(error);
						});
						get_product_by_code([product.code], res, req, db)
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

function get_product_by_code(data, res, req, db) {
	let sql = "SELECT * FROM Product WHERE code = ?";
	db.serialize(() => {
		db.get(sql, data, (error, row) => {
			if(error || row == undefined) {
				dialog.showErrorBox("Error", "Product does not exist")
				res.redirect('/');
				return;
			}
			let total_quantity_in = 0;
			let total_quantity_out = 0;
			db.all("select * from ProductTransaction WHERE product_id = ? order by (substr(created_date, 7, 4) || '-' || substr(created_date, 4, 2) || '-' || substr(created_date, 1, 2)) desc", [row.id], (error, rows) => {
				rows.forEach((row) => {
					total_quantity_in += parseInt(row.quantity_in);
					total_quantity_out += parseInt(row.quantity_out);
				});
				if(error || rows == undefined) {
					dialog.showErrorBox("Error", "Product does not exist")
					res.redirect('/');
					return;
				}
				res.render('product_view',{
					row: row,
					rows: rows,
					total_quantity_in: total_quantity_in,
					total_quantity_out: total_quantity_out
				});
			});
		});
	});
}

function get_multiple_product_by_code(data, res, req, db) {
	let sql = "SELECT * FROM Product WHERE code in ("+ data +") order by code asc";
	let products = []
	db.each(sql, [], (error, product) => {
		if(error || product == undefined) {
			dialog.showErrorBox("Error", "One of the product does not exist")
			res.redirect('/');
			return;
		}
		products.push(product)
	});
	res.render('main',{
		products: products
	});
}

function create_tables(db) {
	let create_product_sql = 'CREATE TABLE IF NOT EXISTS "Product" ( "id" INTEGER NOT NULL UNIQUE, "code" TEXT NOT NULL UNIQUE, "quantity" INTEGER DEFAULT 0, "description" TEXT, "created_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "modified_date" TEXT, PRIMARY KEY("id") )'
	let create_product_transaction_sql = 'CREATE TABLE IF NOT EXISTS "ProductTransaction" ( "id" INTEGER NOT NULL, "product_id" INTEGER NOT NULL, "quantity_in" INTEGER DEFAULT 0, "quantity_out" INTEGER DEFAULT 0, "description" TEXT, "created_date" TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY("id" AUTOINCREMENT) )'

	db.run(create_product_sql,(err) => {
		db.run(create_product_transaction_sql,(err) => {
			if (err) {
				console.log(err)
			}
		});
	});
}
