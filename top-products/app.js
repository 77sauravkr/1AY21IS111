const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to fetch top products in a category and price range
app.get('/categories/:categoryname/products', async (req, res) => {
    const { categoryname } = req.params;
    const { top, minPrice, maxPrice, page = 1, sort } = req.query;
    const companyNames = ["AMZ", "FLP", "SNP", "MYN", "AZO"];

    // Prepare requests to each company's API
    const requests = companyNames.map(company => {
        const url = `http://20.244.56.144/products/companies/${company}/categories/${categoryname}/products`;
        return axios.get(url, {
            params: {
                top,
                minPrice,
                maxPrice,
                page,
                sort
            }
        }).then(response => response.data);
    });

    try {
        // Execute requests in parallel
        const responses = await Promise.all(requests);

        // Combine and sort products based on sort parameter
        let combinedProducts = [];
        responses.forEach(products => {
            combinedProducts = combinedProducts.concat(products);
        });

        // Sorting logic based on sort query parameter (if provided)
        if (sort) {
            combinedProducts.sort((a, b) => {
                if (sort.startsWith('-')) {
                    const key = sort.substring(1);
                    return b[key] - a[key];
                } else {
                    return a[sort] - b[sort];
                }
            });
        }

        // Pagination
        const startIndex = (page - 1) * top;
        const paginatedProducts = combinedProducts.slice(startIndex, startIndex + parseInt(top));

        res.json(paginatedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Endpoint to fetch details of a specific product by productid
app.get('/categories/:categoryname/products/:productid', async (req, res) => {
    const { categoryname, productid } = req.params;
    const companyNames = ["AMZ", "FLP", "SNP", "MYN", "AZO"];

    // Prepare requests to each company's API
    const requests = companyNames.map(company => {
        const url = `http://20.244.56.144/products/companies/${company}/categories/${categoryname}/products`;
        return axios.get(url, {
            params: {
                productid // Include productid as a parameter
            }
        }).then(response => response.data);
    });

    try {
        // Execute requests in parallel
        const responses = await Promise.all(requests);

        // Find the product with matching productid across responses
        let productDetails = null;
        responses.some(products => {
            productDetails = products.find(product => product.productid === productid);
            return productDetails; // Exit loop when productDetails is found
        });

        if (productDetails) {
            res.json(productDetails);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ error: 'Failed to fetch product details' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
