module.exports = Object.freeze({
	PRODUCT_SELECT: 'select * from Product order by code asc',
	PRODUCT_INSERT: 'insert into Product(code, quantity, description, created_date) VALUES(?, ?, ?, ?)',
	PRODUCT_UPDATE: 'update Product set code = ?, quantity = ?, description = ?, created_date = ? WHERE code = ?',
	PRODUCT_UPDATE_QUANTITY: 'UPDATE product SET quantity = ? WHERE id = ?',
	PRODUCT_DELETE: 'delete from Product where id=?',
	PRODUCT_SEARCH: 'select * from Product WHERE id=?',
	PRODUCT_SEARCH_BY_CODE: 'select * from Product WHERE code = ?',
	PRODUCT_TRANSACTION_SELECT: "select * from ProductTransaction WHERE product_id = ? order by (substr(created_date, 7, 4) || '-' || substr(created_date, 4, 2) || '-' || substr(created_date, 1, 2)) desc",
	PRODUCT_TRANSACTION_INSERT: 'INSERT INTO ProductTransaction(product_id, quantity_in, description, created_date) VALUES(?, ?, ?, ?)',
	PRODUCT_TRANSACTION_SEARCH: 'SELECT * FROM ProductTransaction where product_id = ? order by id',
	PRODUCT_TRANSACTION_SEARCH_BY_ID: 'SELECT * FROM ProductTransaction WHERE id = ?',
	PRODUCT_TRANSACTION_UPDATE: 'UPDATE ProductTransaction SET quantity_in = ?, description = ?, created_date  = ? WHERE id = ?',
	PRODUCT_TRANSACTION_DELETE: 'DELETE FROM ProductTransaction where id=?'
});