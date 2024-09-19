const helper = require('../utils/helper');
const product_pdf = require('../services/ProductPdfService');
const product_transaction_pdf = require('../services/ProductTransactionPdfService');

// Database operations
async function getProducts(db, downloadAll) {
    const sql = downloadAll ? "SELECT * FROM Product order by code asc" : "SELECT * FROM Product where quantity > 0 order by code asc";
    return new Promise((resolve, reject) => {
        db.all(sql, (error, products) => {
            if (error) reject(error);
            else resolve(products);
        });
    });
}

async function getProductsByWarehouseCode(db, warehouse_code) {
    const sql = 'SELECT * FROM Product WHERE warehouse_code = ? order by code asc'
    return new Promise((resolve, reject) => {
        db.all(sql, [warehouse_code], (error, products) => {
            if (error) reject(error);
            else resolve(products);
        });
    });
}

async function getProductTransactions(db, productId) {
    const sql = "select * from ProductTransaction WHERE product_id = ? order by (substr(created_date, 7, 4) || '-' || substr(created_date, 4, 2) || '-' || substr(created_date, 1, 2)) desc";
    const sql2 = "select * from product where id = ?";
    return new Promise((resolve, reject) => {
        db.all(sql, [productId], (error, product_transactions) => {
            if (error) reject(error);
            db.get(sql2, [productId], (error, product) => {
                if (error) reject(error);
                resolve({ product_transactions, product });
            });
        });
    });
}

module.exports = {
    download_product_pdf: function(api, db) {
        api.post('/download_product_pdf', async (req, res) => {
            try {
                const products = await getProducts(db, req.body.download_all);
                const stream = res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename='+helper.created_date()+'_Azara_Stock.pdf'
                });
                product_pdf.buildPDF(
                    products,
                    (chunk) => stream.write(chunk),
                    () => stream.end()
                );
            } catch (error) {
                console.error(error);
                res.status(500).send('Error retrieving products');
            }
        });
    },
    download_product_pdf_by_warehouse_code: function(api, db) {
        api.post('/download_product_pdf_by_warehouse_code', async (req, res) => {
            try {
                const products = await getProductsByWarehouseCode(db, req.body.warehouse_code);
                const stream = res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename='+helper.created_date()+'_Azara_Stock_Warehouse_'+req.body.warehouse_code+'.pdf'
                });
                product_pdf.buildPDF(
                    products,
                    (chunk) => stream.write(chunk),
                    () => stream.end()
                );
            } catch (error) {
                console.error(error);
                res.status(500).send('Error retrieving products');
            }
        });
    },
    download_product_transaction_pdf: function(api, db) {
        api.post('/download_product_transaction_pdf', async (req, res) => {
            try {
                const { product_transactions, product } = await getProductTransactions(db, req.body.product_id);
                const stream = res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename='+helper.created_date()+'_Azara_Product_Detail_'+req.body.product_code+'.pdf'
                });
                product_transaction_pdf.buildPDF(
                    product_transactions,
                    product,
                    (chunk) => stream.write(chunk),
                    () => stream.end()
                );
            } catch (error) {
                console.error(error);
                res.status(500).send('Error retrieving product transactions');
            }
        });
    }
};
