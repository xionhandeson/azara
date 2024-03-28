const helper = require('../utils/helper');
const { dialog } = require("electron");
const sql = require('../utils/SqlConstants');
const product_service = require('../services/ProductService');

// Database operations
async function getProduct(db, productId) {
	return new Promise((resolve, reject) => {
			db.get(sql.PRODUCT_SEARCH, productId, (error, product) => {
					if (error) reject(error);
					else resolve(product);
			});
	});
}

async function updateProductQuantity(db, productId, quantity) {
	return new Promise((resolve, reject) => {
			db.run(sql.PRODUCT_UPDATE_QUANTITY, [quantity, productId], (error) => {
					if (error) reject(error);
					else resolve();
			});
	});
}

async function insertProductTransaction(db, sql, params) {
	return new Promise((resolve, reject) => {
			db.run(sql, params, (error) => {
					if (error) reject(error);
					else resolve();
			});
	});
}

async function getProductTransaction(db, transactionId) {
	return new Promise((resolve, reject) => {
			db.get(sql.PRODUCT_TRANSACTION_SEARCH_BY_ID, transactionId, (error, productTransaction) => {
					if (error) reject(error);
					else resolve(productTransaction);
			});
	});
}

async function updateProductTransaction(db, sql, params) {
	return new Promise((resolve, reject) => {
			db.run(sql, params, (error) => {
					if (error) reject(error);
					else resolve();
			});
	});
}

async function deleteProductTransaction(db, transactionId) {
	return new Promise((resolve, reject) => {
			db.run(sql.PRODUCT_TRANSACTION_DELETE, transactionId, (error) => {
					if (error) reject(error);
					else resolve();
			});
	});
}

module.exports = {
	update_product_quantity: function(api, db) {
		api.post('/update_quantity', async (req, res) => {
				try {
						const created_date = req.body.created_date || helper.created_date();
						const product_id = req.body.product_id;
						const product = await getProduct(db, product_id);

						let quantity, total_quantity, insert_product_transaction_sql;

						if (req.body.quantity_in > 0) {
								quantity = parseInt(req.body.quantity_in);
								total_quantity = product.quantity + quantity;
								insert_product_transaction_sql = "INSERT INTO ProductTransaction(product_id, quantity_in, description, created_date) VALUES(?, ?, ?, ?)";
						} else if (req.body.quantity_out > 0) {
								quantity = parseInt(req.body.quantity_out);
								total_quantity = product.quantity - quantity;
								insert_product_transaction_sql = "INSERT INTO ProductTransaction(product_id, quantity_out, description, created_date) VALUES(?, ?, ?, ?)";
						} else {
								dialog.showErrorBox("Error", "Invalid quantity entered");
								product_service.view_product([product.id], res, req, db);
								return;
						}

						await insertProductTransaction(db, insert_product_transaction_sql, [product_id, quantity, req.body.description, created_date]);
						await updateProductQuantity(db, product_id, total_quantity);
						console.log("here")
						product_service.view_product([product.id], res, req, db);
				} catch (error) {
						console.error(error);
						res.status(500).send('Error updating product quantity');
				}
		});
  },
	update_product_transaction: function(api, db) {
		api.post('/update_product_transaction', async (req, res) => {
				try {
						const created_date = req.body.created_date || helper.created_date();
						const product_id = req.body.product_id;
						const product = await getProduct(db, product_id);
						const productTransaction = await getProductTransaction(db, req.body.id);
						let quantity, total_quantity, update_product_transaction_sql;

						if (req.body.quantity_in > 0) {
								quantity = parseInt(req.body.quantity_in);
								total_quantity = product.quantity + (quantity - productTransaction.quantity_in);
								update_product_transaction_sql = "UPDATE ProductTransaction SET quantity_in = ?, description = ?, created_date  = ? WHERE id = ?";
						} else if (req.body.quantity_out > 0) {
								quantity = parseInt(req.body.quantity_out);
								total_quantity = product.quantity + (productTransaction.quantity_out - quantity);
								update_product_transaction_sql = "UPDATE ProductTransaction SET quantity_out = ?, description = ?, created_date  = ? WHERE id = ?";
						} else {
								dialog.showErrorBox("Error", "Invalid quantity entered");
								product_service.view_product([product.id], res, req, db);
								return;
						}

						await updateProductTransaction(db, update_product_transaction_sql, [quantity, req.body.description, created_date, req.body.id]);
						await updateProductQuantity(db, product_id, total_quantity);
						product_service.view_product([product.id], res, req, db);
				} catch (error) {
						console.error(error);
						res.status(500).send('Error updating product transaction');
				}
		});
  },
	delete_product_transaction: function(api, db) {
		api.post('/delete_product_transaction', async (req, res) => {
				try {
						const product_id = req.body.product_id;
						const product = await getProduct(db, product_id);
						let total_quantity;

						if (req.body.quantity_in != 0) {
								total_quantity = product.quantity - parseInt(req.body.quantity_in);
						} else if (req.body.quantity_out != 0) {
								total_quantity = product.quantity + parseInt(req.body.quantity_out);
						} else {
								console.log("Invalid quantity entered");
								return;
						}

						await deleteProductTransaction(db, req.body.id);
						await updateProductQuantity(db, product_id, total_quantity);
						product_service.view_product([product.id], res, req, db);
				} catch (error) {
						console.error(error);
						dialog.showErrorBox("Error", "Unable to delete product transaction");
				}
		});
  },
};
