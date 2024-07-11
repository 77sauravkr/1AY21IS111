const express = require('express');
const axios = require('axios');
const app = express();

const windowSize = 10;
let numbersWindow = [];

const fetchNumbers = async (qualifier) => {
    const urlMap = {
        'p': 'http://20.244.56.144/test/primes',
        'f': 'http://20.244.56.144/test/fibo',
        'e': 'http://20.244.56.144/test/even',
        'r': 'http://20.244.56.144/test/rand'
    };

    if (!urlMap[qualifier]) {
        return [];
    }

    try {
        const response = await axios.get(urlMap[qualifier], { timeout: 500 });
        return response.data.numbers;
    } catch (error) {
        console.error(`Error fetching ${qualifier} numbers:`, error);
        return [];
    }
};

app.get('/numbers/:qualifier', async (req, res) => {
    const { qualifier } = req.params;
    const startTime = Date.now();

    let numbers = [];
    let prevState = [...numbersWindow];

    try {
        numbers = await fetchNumbers(qualifier);
    } catch (error) {
        console.error('Error fetching numbers:', error);
        return res.status(500).json({ error: "Failed to fetch numbers" });
    }

    if (Date.now() - startTime > 500) {
        return res.status(500).json({ error: "Request took too long" });
    }

    // Filter out duplicates from the fetched numbers and add to window
    numbers.forEach(number => {
        if (!numbersWindow.includes(number)) {
            numbersWindow.push(number);
            if (numbersWindow.length > windowSize) {
                numbersWindow.shift();
            }
        }
    });

    const currentState = [...numbersWindow];
    const avg = currentState.length ? currentState.reduce((a, b) => a + b, 0) / currentState.length : 0;

    res.json({
        numbers,
        windowPrevState: prevState,
        windowCurrState: currentState,
        avg: parseFloat(avg.toFixed(2)) // Ensure avg is formatted to two decimal places
    });
});

const PORT = process.env.PORT || 9876;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
