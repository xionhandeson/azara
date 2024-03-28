const sql = require('../utils/SqlConstants');
const _ = require('lodash');
// Database operation
async function getProducts(db, limit, offset) {
    return new Promise((resolve, reject) => {
        db.all(sql.PRODUCT_SELECT, [limit, offset], (error, products) => {
            if (error) reject(error);
            else resolve(products);
        });
    });
}

async function countProducts(db) {
    return new Promise((resolve, reject) => {
        db.get(sql.PRODUCT_COUNT, (error, result) => {
            if (error) reject(error);
            else resolve(result['COUNT(*)']);
        });
    });
}

module.exports = {
    load_homepage: function(app, api, db) {
        api.get('/', async (req, res) => {
            const page = parseInt(req.query.page) || 1; // Current page number
            const limit = 25; // Number of products per page
            const offset = (page - 1) * limit; // Offset for the database query
            try {
                const products = await getProducts(db, limit, offset);
                const totalCount = await countProducts(db);
                const totalPages = Math.ceil(totalCount / limit);

                // Generate pageArray with visible page numbers
                const maxVisiblePages = 5; // Adjust as needed
                const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                const pageArray = _.range(startPage, endPage + 1);

                res.render('main', { products, page, totalPages, pageArray, currentPage: page, hasPrevious: page > 1, hasNext: page < totalPages });
            } catch (error) {
                console.error(error);
                res.status(500).send('Error retrieving products');
            }
        });
    }
}
