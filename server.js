const express = require('express');
const path = require('path');

const app = express();

// Poskytovanie statických súborov (index.html, styles.css, app.js)
app.use(express.static(path.join(__dirname)));

// Spustenie servera na porte 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server beží na http://localhost:${PORT}`);
});
