var express = require('express');
var router = express.Router();

var PostModel = require('../models/posts');
var CommentModel = require('../models/comments');
var checkLogin = require('../middlewares/check').checkLogin;

//GET /posts 所有用户或特定用户的文章页
router.get('/', function (req, res, next) {
   var author = req.query.author;
   PostModel.getPosts(author)
       .then(function (posts) {
           res.render('posts',{
               posts: posts
           });
       })
       .catch(next);
});

//POST /posts 发表一篇文章
router.post('/', checkLogin, function (req, res, next) {
    var author = req.session.user._id;
    var title = req.fields.title;
    var content = req.fields.content;

    try{
        if( !title.length ){
            throw new Error('error','请写标题');
        }
        if(!content.length){
            throw new Error('error','请写内容');
        }
    }catch (e){
        req.flash('error', e.message);
        return res.redirect('back');
    }

    var post = {
        author: author,
        title: title,
        content: content,
        pv: 0
    };

    PostModel.create(post)
        .then(function (result) {
            post = result.ops[0];
            req.flash('success','发表成功');
            return res.redirect(`/posts/${post._id}`);
        })
        .catch(next);
});

//GET /posts/create 发表文章页面
router.get('/create', checkLogin, function (req, res, next) {
    return res.render('create');
});

//GET /posts/:postId 单独的某篇文章页面
router.get('/:postId', checkLogin, function (req, res, next) {
    var postId = req.params.postId;
     Promise.all([
         PostModel.getPostById(postId),  //获取文章信息
         CommentModel.getComments(postId), //获取该文章所有留言
         PostModel.incPv(postId)  //pv加1
         ])
         .then(function (result) {
             var post = result[0];
             var comments = result[1];
             if(!post){
                 throw new Error('该文章不存在');
             }

             res.render('post',{
                 post: post,
                 comments: comments
             })
         })
         .catch(next);
});

//GET /posts/:postId/edit 更新文章页面
router.get('/:postId/edit', checkLogin, function (req, res, next) {
    var postId = req.params.postId;
    var author = req.session.user._id;

    PostModel.getRawPostById(postId)
        .then(function (post) {
            if(!post){
                throw new Error('该文章不存在');
            }
            if(author.toString() !== post.author._id.toString()){
                throw new Error('权限不足');
            }
            res.render('edit',{
                post:post
            });
        })
        .catch(next);
});

//POST /posts/:postId/edit 更新一篇文章
router.post('/:postId/edit', checkLogin, function (req, res, next) {
    var postId = req.params.postId;
    var author = req.session.user._id;
    var title = req.fields.title;
    var content = req.fields.content;
    var data = {
        title: title,
        content: content
    };

    PostModel.updatePostById(postId,author,data)
        .then(function () {
            req.flash('success','编辑文章成功');
            return res.redirect(`/posts/${postId}`);
        })
        .catch(next);
});

//GET /posts/:postId/remove 删除一篇文章
router.get('/:postId/remove', checkLogin, function (req, res, next) {
    var postId = req.params.postId;
    var author = req.session.user._id;

    PostModel.removePostById(postId,author)
        .then(function () {
            req.flash('success','删除成功');
            return res.redirect('/posts')
        })
        .catch(next);
});

//POST /posts/:postId/comment 创建一条留言
router.post('/:postId/comment', checkLogin, function (req, res, next) {
    var postId = req.params.postId;
    var author = req.session.user._id;
    var content = req.fields.content;
    var comment = {
        postId: postId,
        author: author,
        content: content
    }
    CommentModel.create(comment)
        .then(function () {
            req.flash('success', '留言成功');
            return res.redirect('back');
        })
        .catch(next);
});

//GET /posts/:postId/comment/:commentId/remove 删除一条留言
router.get('/:postId/comment/:commentId/remove', checkLogin, function (req, res, next) {
    var commentId = req.params.commentId;
    var author = req.session.user._id;
    
    CommentModel.delCommentById(commentId, author)
        .then(function () {
            req.flash('success','删除成功');
            return res.redirect('back');
        })
        .catch(next);
});

module.exports = router;