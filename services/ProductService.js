const sql = require('../utils/SqlConstants');
const { dialog } = require("electron");

function handleError(error, res) {
	if (error) {
			dialog.showErrorBox("Error", "Product does not exist");
			res.redirect('/');
			return true;
	}
	return false;
}
function view_product(data, res, req, db) {
	db.get(sql.PRODUCT_SEARCH_BY_ID, data, (error, product) => {
		if (handleError(error, res) || !product) return;

		db.all(sql.PRODUCT_TRANSACTION_SELECT, [product.id], (error, products) => {
				if (handleError(error, res) || !products.length) return;

				const total_quantity_in = products.reduce((total, { quantity_in }) => total + parseInt(quantity_in), 0);
				const total_quantity_out = products.reduce((total, { quantity_out }) => total + parseInt(quantity_out), 0);

				res.render('product_view', {
						product,
						products,
						total_quantity_in,
						total_quantity_out
				});
		});
});
}
function get_product_by_code(data, res, req, db) {
	db.all(sql.PRODUCT_SEARCH_BY_CODE, data, (error, products) => {
			if(error || products == undefined || products.length === 0) {
					log.info("Error: Product doesn't exist");
					dialog.showErrorBox("Error", "Product doesn't exist");
					res.redirect('/');
					return;
			}
			res.render('main',{
					products: products
			});
	});
}
function get_multiple_product_by_code(data, res, req, db) {
	let sql = "SELECT * FROM Product WHERE code IN (" + data.map(() => '?').join(',') + ") ORDER BY code ASC";
	db.all(sql, data, (error, products) => {
			if(error || products == undefined || products.length === 0) {
					dialog.showErrorBox("Error", "One of the product does not exist");
					res.redirect('/');
					return;
			}
			res.render('main',{
					products: products
			});
	});
}
function get_multiple_product_by_warehouse_code(data, res, req, db) {
	db.all(sql.PRODUCT_SEARCH_BY_WAREHOUSE_CODE, data, (error, products) => {
			if(error || products == undefined || products.length === 0) {
					dialog.showErrorBox("Error", "Warehouse doesn't exist");
					res.redirect('/');
					return;
			}
			res.render('main',{
					products: products
			});
	});
}
function get_product_search_by_code_and_warehouse_code(data, res, req, db) {
	db.get(sql.PRODUCT_SEARCH_BY_CODE_AND_WAREHOUSE_CODE, data, (error, product) => {
		if (handleError(error, res) || !product) return;

		db.all(sql.PRODUCT_TRANSACTION_SELECT, [product.id], (error, products) => {
				if (handleError(error, res) || !products.length) return;

				const total_quantity_in = products.reduce((total, { quantity_in }) => total + parseInt(quantity_in), 0);
				const total_quantity_out = products.reduce((total, { quantity_out }) => total + parseInt(quantity_out), 0);

				res.render('product_view', {
						product,
						products,
						total_quantity_in,
						total_quantity_out
				});
		});
});

}

module.exports = {
	view_product,
	get_product_by_code,
	get_multiple_product_by_code,
	get_multiple_product_by_warehouse_code,
  get_product_search_by_code_and_warehouse_code
}