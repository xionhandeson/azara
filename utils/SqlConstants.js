module.exports = Object.freeze({
	PRODUCT_SELECT: 'SELECT * FROM Product ORDER BY code ASC LIMIT ? OFFSET ?',
	PRODUCT_INSERT: 'INSERT INTO Product(code, quantity, description, created_date, warehouse_code) VALUES (?, ?, ?, ?, ?)',
	PRODUCT_UPDATE: 'UPDATE Product SET quantity = ?, description = ?, created_date = ?, warehouse_code = ? WHERE id = ?',
	PRODUCT_UPDATE_QUANTITY: 'UPDATE Product SET quantity = ? WHERE id = ?',
	PRODUCT_DELETE: 'DELETE FROM Product WHERE id = ?',
	PRODUCT_SEARCH: 'SELECT * FROM Product WHERE id = ?',
	PRODUCT_COUNT: 'SELECT COUNT(*) FROM Product;',
	PRODUCT_SEARCH_BY_CODE: 'SELECT * FROM Product WHERE code = ?',
	PRODUCT_SEARCH_BY_ID: 'SELECT * FROM Product WHERE id = ?',
	PRODUCT_SEARCH_BY_WAREHOUSE_CODE: 'SELECT * FROM Product WHERE warehouse_code = ?',
	PRODUCT_SEARCH_BY_CODE_AND_WAREHOUSE_CODE: 'SELECT * FROM Product WHERE code = ? AND warehouse_code = ?',
	PRODUCT_TRANSACTION_SELECT: "SELECT * FROM ProductTransaction WHERE product_id = ? ORDER BY (substr(created_date, 7, 4) || '-' || substr(created_date, 4, 2) || '-' || substr(created_date, 1, 2)) DESC",
	PRODUCT_TRANSACTION_INSERT: 'INSERT INTO ProductTransaction(product_id, quantity_in, description, created_date) VALUES (?, ?, ?, ?)',
	PRODUCT_TRANSACTION_SEARCH: 'SELECT * FROM ProductTransaction WHERE product_id = ? ORDER BY id',
	PRODUCT_TRANSACTION_SEARCH_BY_ID: 'SELECT * FROM ProductTransaction WHERE id = ?',
	PRODUCT_TRANSACTION_UPDATE: 'UPDATE ProductTransaction SET quantity_in = ?, description = ?, created_date = ? WHERE id = ?',
	PRODUCT_TRANSACTION_DELETE: 'DELETE FROM ProductTransaction WHERE id = ?'
});