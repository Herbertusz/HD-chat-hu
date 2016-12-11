/* global */

'use strict';

const express = require('express');
const router = express.Router();
// const session = require('express-session');

router.get('/(:id)', function(req, res){

    res.render('layout', {
        page : 'iframe',
        userId : req.params.id,
        loginMessage : null
    });

});

module.exports = router;