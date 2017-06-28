var sha1 = require('sha1');
var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;

//GET /signin 登录页面
router.get('/', checkNotLogin, function (req, res, next) {
    res.render('signin');
});

//POST /signin 用户登录
router.post('/', checkNotLogin, function (req, res, next) {
    var name = req.fields.name;
    var password = req.fields.password;

    UserModel.getUserByName(name)
        .then(function (user) {
            //检查用户是否存在
            if(!user){
                req.flash('error','用户名不存在');
                return res.redirect('back');
            }
            //检查密码是否匹配
            if(sha1(password) !== user.password){
                req.flash('error','用户名或密码错误');
                return res.redirect('back');
            }
            req.flash('success','登录成功');
            //用户信息写入session
            delete user.password;
            req.session.user = user;
            //跳转到主页
            return res.redirect('/posts');
        })
        .catch(next);
});

module.exports = router;