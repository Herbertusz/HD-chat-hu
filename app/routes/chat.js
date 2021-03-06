/**
 *
 */

'use strict';

let UserModel, ChatModel;
const ENV = require.main.require('../app/env.js');
const fs = require('mz/fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const log = require.main.require('../libs/log.js');
const HD = require.main.require('../app/public/js/hd/hd.js')(['datetime']);
const Config = require.main.require('../app/config/config.js');
const FileTransfer = require.main.require('../app/public/js/chat/filetransfer.js');
const CHAT = Object.assign({}, Config, FileTransfer);  // TODO: nincs erre jobb módszer?

/**
 * Felhasználók kiválasztásának korlátozásai
 * @param {Object} app - express app (req.app)
 * @param {String} operation - művelet ('create'|'add')
 * @param {Number} triggerUserId - műveletet kiváltó userId
 * @param {Array} userIds - userId-k
 * @param {String} [room=null] - csatorna azonosító
 * @returns {Promise} megadott művelet lefuttatása engedélyezett
 */
const userRestriction = function(app, operation, triggerUserId, userIds, room = null){
    const roomData = app.get('socket').getState().rooms.find(function(thisRoomData){
        return thisRoomData.name === room;
    });
    const max = CHAT.Config.room.maxUsers;
    let permission = true;
    let userIdSet;

    if (operation === 'create'){
        userIdSet = new Set([...userIds, triggerUserId]);
    }
    else if (operation === 'add'){
        userIdSet = new Set([...userIds, ...roomData.userIds]);
    }
    if (max && userIdSet.size > max){
        permission = false;
    }
    return UserModel
        .getUserForbiddens([...userIdSet])
        .then(function(users){
            // TODO: letiltások kezelése (?)
            return permission && true;
        })
        .catch(function(error){
            log.error(error);
        });
};


// Model-ek betöltése
router.use(function(req, res, next){
    UserModel = require.main.require(`../app/models/${ENV.DBDRIVER}/user.js`)(req.app.get('db'));
    ChatModel = require.main.require(`../app/models/${ENV.DBDRIVER}/chat.js`)(req.app.get('db'));
    next();
});

// Chat felület megjelenítése
router.get('/', function(req, res){

    UserModel
        .getUsers()
        .then(function(users){
            res.render('layouts/general', {
                page : '../pages/chat',
                users : users,
                login : req.session.login ? req.session.login.loginned : false,
                userId : req.session.login ? req.session.login.userId : null,
                userName : req.session.login ? req.session.login.userName : '',
                loginMessage : null
            });
        })
        .catch(function(error){
            log.error(error);
        });

});

// Chat felület megjelenítése iframe-ben (iframe-en kívüli rész)
router.get('/remote/:userId', function(req, res){

    const userId = Number(req.params.userId);

    req.session.login = {
        loginned : true,
        userId : userId,
        userName : '',
        error : null
    };

    UserModel
        .getUsers()
        .then(function(users){
            res.render('layouts/iframe', {
                page : '../pages/chat',
                users : users,
                login : true,
                userId : userId,
                userName : users.find(user => user.id === userId).name,
                loginMessage : null
            });
        })
        .catch(function(error){
            log.error(error);
        });

});

// Egy csatorna megjelenítése
router.get('/room/:roomId', function(req, res){
    ;
});

// Egy csatorna átvitelei (doboz feltöltéséhez)
router.post('/getroommessages', function(req, res){

    ChatModel
        .getRoomMessages(req.body.room)
        .then(function(messages){
            res.send({messages});
        })
        .catch(function(error){
            log.error(error);
        });

});

// Felhasználó állapota
router.post('/getstatus', function(req, res){

    UserModel
        .getStatus(Number(req.body.userId))
        .then(function(status){
            res.send({status});
        })
        .catch(function(error){
            log.error(error);
        });

});

/**
 * Felhasználók kiválasztásának korlátozásai
 * @param {String} operation - művelet ('create'|'add')
 * @param {Array} userIds - userId-k
 * @param {String} [room] - csatorna azonosító
 * @returns {Boolean} megadott művelet lefuttatása engedélyezett
 */
router.post('/getrestrictions', function(req, res){

    const userIds = req.body.userIds.split(',').map(id => Number(id));

    userRestriction(req.app, req.body.operation, Number(req.body.triggerUserId), userIds, req.body.room)
        .then(function(permission){
            res.send({permission});
        })
        .catch(function(error){
            log.error(error);
        });

});

// Fájl kiszolgálása
router.get('/file/:room/:fileName', function(req, res, next){

    ChatModel
        .getFile(req.params.room, req.params.fileName)
        .then(function(file){
            const userId = req.session.login ? req.session.login.userId : null;
            const currentRoom = req.app.get('socket').getState().rooms.find(function(room){
                return room.name === req.params.room;
            });
            if (file && !file.deleted && currentRoom.userIds.indexOf(userId) > -1){
                res.sendFile(path.resolve(`${req.app.get('upload')}/${file.raw.source}`));
            }
            else {
                next();
                return;
            }
        })
        .catch(function(error){
            log.error(error);
        });

});

// Fájl feltöltése
router.post('/uploadfile', function(req, res){

    if (req.xhr){
        let uploadedSize = 0;
        const io = req.app.get('socket').io;
        const data = JSON.parse(decodeURIComponent(req.header('X-File-Data')));
        const userId = Number(data.userId);
        const fileStream = fs.createWriteStream(`${req.app.get('upload')}/${data.name}`);
        const fileSize = Number(data.raw.size);

        const errors = CHAT.FileTransfer.fileCheck(data, CHAT.Config.fileTransfer);
        if (errors.length > 0){
            res.send({
                success : false
            });
            fileStream.end();
            return;
        }

        req.on('data', function(file){
            // Fájlátvitel folyamatban
            const first = (uploadedSize === 0);
            uploadedSize += file.byteLength;
            // TODO: header manipulálás esetén megszakítás a maximális méretnél (?)
            // if (uploadedSize > CHAT.FileTransfer.getMaxSize(CHAT.Config.fileTransfer)){
            //     fileStream.end();
            //     return;
            // }
            io.of('/chat').to(data.room).emit('receiveFile', {
                userId : userId,
                room : data.room,
                uploadedSize : uploadedSize,
                fileSize : fileSize,
                firstSend : first
            });
            fileStream.write(file);
        });
        req.on('end', function(){
            // Fájlátvitel befejezve
            io.of('/chat').to(data.room).emit('receiveFile', {
                userId : userId,
                room : data.room,
                uploadedSize : fileSize,
                fileSize : fileSize,
                firstSend : false
            });
            res.send({
                success : true,
                fileName : `${data.name}`
            });
            fileStream.end();
        });
        req.on('close', function(){
            // Fájlátvitel megszakítva
            fileStream.end();
        });
    }

});

// Kliens oldali log
router.post('/clientlog', function(req, res){

    let fileName, logMessage;
    const type = decodeURIComponent(req.body.type);
    const message = decodeURIComponent(req.body.message);
    const time = HD.DateTime.formatMS('Y-m-d H:i:s', Date.now());

    if (type === 'error'){
        const name = decodeURIComponent(req.body.name);
        const stack = decodeURIComponent(req.body.stack);

        fileName = 'client.log';
        logMessage = `
            ${time}\n
            name: ${name}\n
            message: ${message}\n
            stack:\n
            ${stack}
            \n-----\n
        `.replace(/^\s+/gm, '');
    }
    else {
        fileName = 'info.log';
        logMessage = `
            ${time}\n
            message: ${message}\n
            \n-----\n
        `.replace(/^\s+/gm, '');
    }

    fs.appendFile(`${__dirname}/../../logs/${fileName}`, logMessage)
        .then(function(){
            res.send({});
        })
        .catch(function(error){
            log.error(error);
        });

});

module.exports = router;
