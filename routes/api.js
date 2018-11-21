const express = require("express");
const escapeReg = require('escape-string-regexp');
const utils = require("utils");
const cfg = require("cfg");
const moment = require('moment');

const r = express.Router();


r.post('/user/list', async (req, res) => {
    var start = parseInt(req.body.start) || 0;
    var limit = parseInt(req.body.limit) || 10;
    var q = req.body.q || "";
    var sort = req.body.sort;
    var order = req.body.order;
    var users = utils.db.read().get("users");
    if(q) {
        users = users.filter(user => {
            var exp = new RegExp(escapeReg(q));
            var _roles = (user.roles||[]).join(',');
            return exp.test(user.name) || exp.test(_roles);
        })
    }
    var total = users.size().value();
    res.json({
        total: total,
        rows: users.drop(start).slice(0, limit).value()
    })
});

r.post('/pushers', async(req, res) => {
    if(!r.rtspServer) {
        res.json({
            total: 0,
            rows: []
        })
    }
    var pushers = [];
    var start = parseInt(req.body.start) || 0;
    var limit = parseInt(req.body.limit) || 100;
    var q = req.body.q || "";
    var sort = req.body.sort;
    var order = req.body.order;
    for(var path in r.rtspServer.sessions) {
        var pusher = r.rtspServer.sessions[path];
        pushers.push({
            id: pusher.sid,
            path: `rtsp://${req.hostname}${cfg.rtsp_tcp_port == 554 ? '' : ':' + cfg.rtsp_tcp_port}${pusher.path}`,
            transType: pusher.transType,
            inBytes: pusher.inBytes,
            outBytes: pusher.outBytes,
            startAt: moment(pusher.startAt).format('YYYY-MM-DD HH:mm:ss'),
            onlines: Object.keys(pusher.playSessions).length
        })
    }
    if(sort) {
        pushers.sort((a, b) => {
            return new String(a[sort]).localeCompare(new String(b[sort])) * (order == 'ascending' ? 1 : -1);
        })
    }
    if(q) {
        pushers = pushers.filter(v => {
            var exp = new RegExp(escapeReg(q));
            return exp.test(v.path) || exp.test(v.id);
        })
    }
    res.json({
        total: pushers.length,
        rows: pushers.slice(start, start + limit)
    })
});

module.exports = r;