//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");


// const trash = document.querySelector(".fa-solid")
// console.log('trash')

const mongoose = require('mongoose');
const { update } = require("lodash");
const res = require("express/lib/response");
const url = 'mongodb://localhost:27017/blogsDB'
mongoose.connect(url, {useNewUrlParser: true})

// making a Schema
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  }, 
  body:{
    type:String, 
    required: true
  },
  date:{
    type: String
  }
  ,
  time:{
    type: String
  }
})
// making a collection/model
const Blog = mongoose.model('Blog', blogSchema);



const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use('*/images',express.static('public/images'));




let posts = [];
let loadMoreBlogs = 9;
// update loadMoreBlogs when we hit post request to /contact route 
// how to deal with two submit button in one form i can't figure it our hence created two forms one page directing to differnet post route


app.get("/", function(req, res){
  // finding all the blogs in the DB
  Blog.find(({}), function(err, blogs){
    if(err){
      console.log('error occur')
    }else{
      res.render("home", {
        startingContent: homeStartingContent,
        posts: blogs, 
        loadMore: loadMoreBlogs,
        count : blogs.length
        });
    }

  }).sort('-date').sort('-time')

});

app.get("/about", function(req, res){

  res.render("about", {aboutContent: aboutContent, count: 'about'});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent,count: 'contact'});
});


app.get("/compose", function(req, res){
  res.render("compose", { count: 'compose'});
});

function myDate (){
  let d = new Date() ;
  date = d.toLocaleString('en-GB').split(",")
  return date;
  }

// console.log(date[0])
// console.log(date[1])
app.post("/compose", function(req, res){
    // adding the last modified feature

    let dateOF = myDate();
  // let's store blog with same title as well 
    const blog = new Blog({
    title: req.body.postTitle,
    body: req.body.postBody,
    date: dateOF[0],
    time: dateOF[1]
  });
    // blog.save();
    blog.save((err)=>{
      if(!err){
        res.redirect("/");
      }
    })
});



app.get("/posts/:blogId", function(req, res){
  // const requestedTitle = _.lowerCase(req.params.postName);
  const requestedPostId = req.params.blogId;
  console.log(requestedPostId)
  console.log(req.params.blogId)

  Blog.findOne({_id: requestedPostId}, function (err, blog){
    if(err){
      console.log(err)
    }else{
      res.render("post", {
        id : blog._id,
        title: blog.title,
        content: blog.body,
        count: blog.title
      });
    }
  })
});



// deleting/trashing items from home page moving them to trash page
let trash;
const Trash = mongoose.model('Trash', blogSchema);
app.post("/", (req, res)=>{
 
  const requestedBlogId = req.body.trashBtn;
  // console.log(requestedBlogId)
  Blog.findByIdAndDelete(requestedBlogId, (err, blog)=>{
    trash = blog
    // console.log(trash)
    // saving the trash blog to new collection called it trashCol
    let dateOF = myDate();
    const trashBlog = new Trash({
      title: trash.title,
      body: trash.body,
      date: dateOF[0],
      time: dateOF[1]

    })
    trashBlog.save();

    if(err){
      console.log(err)
    }else{
      console.log("blog "+blog.title +"is deleted !!")
    }
  })
  res.redirect("/")
})

// getting to trash
app.get("/trash", function(req, res){
  // finding all the blogs in the DB
  // console.log(Blog.find())

  
  Trash.find({}, function(err, blogs){
    // console.log("length of trashBlogs ", blogs.length)
    if(err){
      console.log('error occur')
    }else{
      res.render("trash", {
        posts: blogs,
        count : blogs.length
        });
    }
  }).sort('-date').sort('-time')

});

// put back item from trash to home page
app.post("/trash", (req, res)=>{
  let putBackPostId = req.body.putBack;
  Trash.findByIdAndDelete(putBackPostId, (err, blog)=>{
    if (err){
      // res.redirect("/trash")
      console.log(err)
    }else{
      let dateOF = myDate();
      // puting back
      const post = new Blog({
        title : blog.title,
        body : blog.body,
        date: dateOF[0],
        time: dateOF[1]
      })
  post.save();
    }
  })
  res.redirect("/trash")
});
// confirming the permanent delete
app.post("/permDelete", (req, res)=>{
  // res.send("deleted")
  const perDelBlogId = req.body.permDelete;
  Trash.findByIdAndDelete(perDelBlogId, (err, blog)=>{
    if(err){
      console.log(err)
    }else{
      res.redirect("/trash")
    }
  })
})


app.post("/contact", (req, res)=>{
  loadMoreBlogs += 10;
  const loadMore = req.body.loadMore;
  console.log(loadMore)
  setTimeout(()=>{
    res.redirect("/")
  }, 500)
  
})

// getting request from trash collection also 
app.get("/posts/:blogId", function(req, res){
  // const requestedTitle = _.lowerCase(req.params.postName);
  const requestedPostId = req.params.blogId;
  console.log(requestedPostId)
  // console.log(req.params.blogId)

  Trash.findOne({_id: requestedPostId}, function (err, blog){
    if(err){
      console.log(err)
    }else{
      res.render("post", {
        title: blog.title,
        content: blog.body,
        count : blog.title
      });
    }
  })
});


// Updatig a blog
app.get("/editBlog/:blogId", (req, res)=>{
  console.log("edit post id "+ req.params.blogId)
  // autocomplete the previious title and body
  Blog.findById(req.params.blogId, (err, docs)=>{
    if(!err){
      res.render("editBlog", {
        editPostId: req.params.blogId,
        title : docs.title,
        body : docs.body,
        count: 'edit'
      })
    }
    
  })

})
app.post("/editBlog", (req, res)=>{
  const editPostId = req.body.buttonUp;
  const upTitle = req.body.postTitleUp;
  const upBody = req.body.postBodyUp;

  const preBlog = Blog.findById(editPostId);
  const preTitle = preBlog.title;
  const preBody = preBlog.body;
  let dateOF = myDate();
  Blog.findByIdAndUpdate(editPostId, {
    title :  upTitle.length>0 ? upTitle : preTitle ,
    body: upBody.length > 3 ? upBody : preBody,
    date: dateOF[0],
    time: dateOF[1]

  }, function(err, docs){
    if(err){
      console.log(err)
    }else{
      res.redirect("/")
      console.log('update successfully', docs)
    }
  })
})

const port = 5500
app.listen(port, function() {
  console.log("Server started on port ", port);
});


// NOTE difference between 
// The req.params property is an object containing properties mapped to the named route “parameters”. For example, if you have the route /student/:id, then the “id” property is available as req.params.id.

// The req.body property contains key-value pairs of data submitted in the request body. By default, it is undefined and is populated when you use a middleware called body-parsing such as express.urlencoded() or express.json().