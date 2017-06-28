var marked = require('marked');
var Post = require('../lib/mongo').Post;
var CommentModel = require('../models/comments');

Post.plugin('addCommentCount', {
   afterFind: function (posts) {
       return Promise.all(posts.map(function (post) {
           return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
               post.commentCount = commentsCount;
               return post;
           });
       }));
   },
    afterFindOne: function (post) {
       if(post){
           return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
               post.commentCount = commentsCount;
               return post;
           })
       }
       return post;
    }
});

Post.plugin('contentToHtml', {
    afterFind: function (posts) {
        return posts.map(function (post) {
            post.content = marked(post.content);
            return post;
        });
    },
    afterFindOne: function (post) {
        post.content = marked(post.content);
        return post;
    }
});

module.exports = {
    create: function create(post) {
        return Post.create(post).exec();
    },

    //根据作者获取所有文章
    getPosts: function getPosts(author) {
        var query = {};
        if(author){
            query.author = author
        }
        return Post.find(query)
            .populate({path: 'author', model:'User'})
            .sort({_id: -1})
            .addCreateAt()
            .addCommentCount()
            .contentToHtml()
            .exec();
    },

    //通过文章id获取文章信息
    getPostById: function getPostById(postId) {
        return Post
            .findOne({_id: postId})
            .populate({path:'author',model:'User'})  //path指定要填充的关联字段，model指定关联字段的model
            .sort({_id: -1})  //倒序
            .addCreateAt()
            .addCommentCount()
            .contentToHtml()
            .exec();
    },

    //通过文章id给pv加1
    incPv: function incPv(postId) {
        return Post
            .update({_id: postId},{$inc:{pv:1}})
            .exec();
    },

    //通过文章id获取一篇原生文章（用于编辑文章）
    getRawPostById: function getRawPostById(postId) {
        return Post
            .findOne({_id:postId})
            .populate({path:'author',model:'User'})
            .exec();
    },

    //通过用户id和文章id更新一篇文章
    updatePostById: function updatePostById(postId, author, data) {
        return Post.update({author:author, _id:postId},{$set:data}).exec();
    },

    //通过用户id和文章id删除一篇文章
    removePostById: function removePostById(postId, author) {
        return Post.remove({author:author, _id:postId}).exec()
            .then(function (res) {
                //文章删除后，再删除该文章下所有的留言
                if(res.result.ok && res.result.n > 0){
                    return CommentModel.delCommentByPostId(postId);
                }
            });
    }
};