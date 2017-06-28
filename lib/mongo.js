var config = require('config-lite')(__dirname);
var Mongolass = require('mongolass');  //mongodb驱动库
var mongolass = new Mongolass();
var moment = require('moment');
var objectIdToTimestamp = require('objectid-to-timestamp');
mongolass.connect(config.mongodb);

mongolass.plugin('addCreateAt', {
    afterFind: function (results) {
        results.forEach(function (item){
            item.create_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm');
        });
        return results;
    },
    afterFindOne: function (result) {
        if(result){
            result.create_at = moment(objectIdToTimestamp(result._id)).format('YYYY-MM0DD HH:mm');
        }
        return result;
    }
});

exports.User = mongolass.model('User', {
    name: {type: 'string'},
    password: {type: 'string'},
    avatar: {type: 'string'},
    gender: {type: 'string', enum: ['m','f','x']},
    bio: {type: 'string'}
});


exports.User.index({name: 1},{unique: true}).exec();  //根据用户名找到用户，用户名全局唯一

exports.Post = mongolass.model('Post', {
    author: {type: 'string'},
    title: {type: 'string'},
    content: {type: 'string'},
    pv: {type: 'number'}
});

exports.Post.index({author: 1, _id: -1}).exec();  //按创建时间降序查看用户的文章列表

exports.Comment = mongolass.model('Comment',{
    author: {type: Mongolass.Types.ObjectId},
    content: {type: 'string'},
    postId: {type: Mongolass.Types.ObjectId}
});

exports.Comment.index({postId: 1, _id: 1}).exec();  //通过文章id获取该文章下所有留言，按留言创建时间升序
exports.Comment.index({author: 1, _id: 1}).exec(); //通过用户id和留言id删除一个留言