const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/*', function(req, res) {
    if (req.path.indexOf('.') === -1) {
        res.sendFile(path.join(__dirname, '', 'index.html'));
    } else {

        res.sendFile(path.join(__dirname, '', req.path));
    }

});

app.listen(801);
console.log('http://localhost:801')
