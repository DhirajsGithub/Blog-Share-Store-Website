//jshint esversion:6

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");

const { update } = require("lodash");
const res = require("express/lib/response");

///////////////////////////// authentication and login/register page ////////////////////////
// requiring the pre build packages
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const req = require("express/lib/request");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "keyboard dog",
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true }
  })
);
app.use(passport.initialize()); // initialization passport
app.use(passport.session()); // using passport to use session

const url = "mongodb://localhost:27017/blogsDB";
mongoose.connect(url, { useNewUrlParser: true });

// it must be a mongoose schema and not standard .js object
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  // the users which subscribed to owner
  subscription: {
    type: Array,
    default : []
  },

  // the owner which subscribe to other user
  subscribedTo: {
    type: Array,
    default : []
  },
  // posts liked/comment by other user to the owner
  likedBy: {
    type: Array,
    default : []
  },
  commentBy: {
    type: Array,
    default : []
  },

  // owner liked/comment by owner to other user
  commentTo:{
    type: Array,
    default : []
  },
  likedTo: {
    type: Array,
    default : []
  },

  notSub: {
    type: Array,
    default : []
  },
  notLikedBy: {
    type: Array,
    default : []
  },
  notCommentBy: {
    type: Array,
    default : []
  },
  subRemoved: {
    type: Array,
    default : []
  },
  notBlogBy: {
    type: Array,
    default : []
  },

  avatar: {
    default : "https://zopto.com/blog/wp-content/uploads/2020/11/def-user-profile-img.jpeg",
    type : String
  },

});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("BlogUser", userSchema);

// making a Schema for each blog public as well private
const publicBlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  date: {
    type: String,
  },
  time: {
    type: String,
  },
  owner: String,
  tag: {
    type : String,
    default: "tag"
  },

  like: {
    type: Array,
    default : []
  },

  comments: {
    type: Array,
    default : []
  },
  prPb: String,
  avatar: {
    default : "https://zopto.com/blog/wp-content/uploads/2020/11/def-user-profile-img.jpeg",
    type : String
  },


});

// making a collection/model
const Blog = mongoose.model("Blog", publicBlogSchema);

// use static authenticate method of model in LocalStrategy
// it must be like this
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser((User, done) => {
  done(null, User);
});

passport.deserializeUser((User, done) => {
  done(null, User);
});

app.get("/", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});
// app.get("/login", (req, res)=>{
//   res.render("login")
// })
// idea is to make a new collection when user registes
// taking registeration detail from here and comparing them at time of login in out database
app.post("/register", (req, res) => {
  const name = req.body.name;
  const username = req.body.username;
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.send(
          `<h1 style="font-family: sans-serif;">${err.message}<br /> Try Login or Use differnt email <br/><br/> <a href="/">Home</a> </h1> `
        );
      } else {
        // for storing as cookies
        passport.authenticate("local")(req, res, () => {
          // it's a get request hence create a new get get request for secrets and render secrets over there
          res.redirect("/");
        });
      }
    }
  );
});

app.post("/", function (req, res) {
  // https://www.passportjs.org/
  // this must be like the data store in our DB
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log("shit");
    } else {
      passport.authenticate("local")(req, res, function () {
        // console.log(user)
        // it's a get request hence create a new get get request for secrets and render secrets over there
        res.redirect(`/public/${user.username}`);
        // res.render("home")
      });
    }
  });
});

///////////////////////////////////////////////////////////////////////

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("*/images", express.static("public/images"));

// how to deal with two submit button in one form i can't figure it our hence created two forms one page directing to differnet post route
// personal blogs of a user
app.get("/home/:username", function (req, res) {
  if (req.isAuthenticated()) {
    // console.log(req.params.username);
    // finding all the blogs in the DB
    User.findOne({username : req.params.username}, (err, user)=>{
      Blog.find({ owner: req.params.username }, function (err, blogs) {
        if (err) {
          console.log("error occur");
        } else {
          res.render("home", {
            avatar : user ? user.avatar : '',
            username: req.params.username,
            posts: blogs,
            count: blogs.length + "-Blogs",
          });
        }
      })
        .sort("-date")
        .sort("-time");
    })
    
  } else {
    // req.flash("error", "You need to be logged in first");
    res.redirect("/");
  }
});

////////////////////////////////////// public blog //////////////////////////////
// making a collection/model
const publicBlog = mongoose.model("publicBlog", publicBlogSchema);

// public blogs
app.get("/public/:username", function (req, res) {

  if (req.isAuthenticated()) {
    User.findOne({username : req.params.username}, (err, user)=>{
      // console.log(user.subscription)
    
    publicBlog.find({}, (err, blogs) => {
      // counting the likes ???
      // console.log(blogs[0].id)
      if (err) {
        console.log(err)
      }else{
        res.render("public", {
          avatar : user ? user.avatar : '' ,
          count: "Trending",
          username: req.params.username,
          posts: blogs,
          
        });
      }
    }).sort("-date") ;
  })
  } else {
    res.redirect("/");
  }
});

app.post("/public/:username", (req, res) => {
  let dateOF = myDate();


  User.findOne({username : req.params.username}, (err, user1)=>{
 
  // let's store blog in the public model

  const blog = new publicBlog({
    title: req.body.postTitle,
    body: req.body.postBody,
    date: dateOF[0],
    time: dateOF[1],
    owner: req.body.username,
    tag: req.body.postTag,
    prPb: req.body.public,
    avatar : user1.avatar,
  });

  blog.save((err, result) => {
    if (err) {
      console.log(err);
    } else {
      let dateOF = myDate();
      // let's store blog in the blog model
      const blog = new Blog({
        // for having same id of public and private blog for updatation and delete when user update/delete blog from home
        _id: result.id,
        title: req.body.postTitle,
        body: req.body.postBody,
        date: dateOF[0],
        time: dateOF[1],
        owner: req.body.username,
        tag: req.body.postTag,
        prPb: req.body.public,
        avatar : user1.avatar,
      
      });
      // blog.save();
      blog.save((err) => {
        if (err) {
          console.log(err)
        }else{
        User.findOneAndUpdate({username: req.params.username}, {
          $push :{
            notBlogBy : {
              blogId : result.id,
              blogTitle : result.title,
              date: dateOF[0],
              time: dateOF[1],
              owner : req.body.username
            }
          }
        }, (err, success)=>{
          if(err){
            console.log(err)
          }else{
            // need to set the notificcatio for it's subscribers
            res.redirect("/public/" + req.params.username);
          }
        })
        }
      });
    }
  });
});
});

app.get("/public-posts/:blogId/:username", (req, res) => {
  if (req.isAuthenticated()) {
    const reqPublicBlogId = req.params.blogId;
    User.findOne({username: req.params.username}, (err, user)=>{
      publicBlog.findOne({ _id: reqPublicBlogId }, (err, blog) => {
        res.render("publicPost", {
          blogId : blog.id,
          username: req.params.username,
          title: blog.title,
          tag: blog.tag,
          content: blog.body,
          count: "Public",
          owner: blog.owner,
          avatar : user ? user.avatar : ''
        });
      });
    })
    
  } else {
    res.redirect("/");
  }
});

// app.get("/public-posts/:blogId/:username", (req, res) => {
//   if (req.isAuthenticated()) {
//     const reqPublicBlogId = req.params.blogId;
//     User.findOne({username: req.params.username}, (err, user)=>{
    
//     publicBlog.findOne({ _id: reqPublicBlogId }, (err, blog) => {
//       res.render("publicPost", {
//         username: req.params.username,
//         title: blog.title,
//         tag: blog.tag,
//         content: blog.body,
//         count: "Public",
//         owner: blog.owner,
//         avatar: user.avatar
//       });
//     });
//   });
//   } else {
//     res.redirect("/");
//   }
// });
app.get("/user/public/:postOwner/:username", (req, res) => {
  if (req.isAuthenticated()) {
    const reqUser = req.params.postOwner;
    User.findOne({username: req.params.username}, (err, user1)=>{
    
    User.findOne({ username: reqUser }, (err, user) => {
      publicBlog.find({ owner: reqUser }, (err, blogs) => {
        res.render("UserPublicPost", {
          totalLikes: user.likedBy.length,
          noOfSub: user.subscription.length,
          owner: req.params.postOwner,
          count: "Public",
          blogsCount: blogs.length,
          posts: blogs,
          username: req.params.username,
          avatar : user1 ? user1.avatar : "",
          avatarOwn : user ? user.avatar : ""
        });
      });
    });
  });
  } else {
    res.redirect("/");
  }
});

// adding subscribers to schema of user
app.post("/user/subscribe/:owner/:username", (req, res) => {
  const reqSub = req.params.username;
  const owner = req.params.owner;
  let date = new Date();

  // adding the subscription of :username to :owner i.e. adding to subscription
  User.findOne({ username: owner }, (err, docs) => {
    const sub = docs.subscription.find((element) => {
      return element.subscribedBy == reqSub;
    });
    if (!sub) {
      User.findOneAndUpdate(
        { username: owner },
        {
          $push: {
            subscription: {
              owner : owner,
              subscribedBy: reqSub,
              date: date.toLocaleDateString(),
              time: date.toLocaleTimeString(),
            },
          },
        },
        (err, success) => {
          if (!err) {
            // adding Subscribed to :owner in :username i.e. adding to subscribedTo
            User.findOneAndUpdate(
              { username: reqSub },
              {
                $push: {
                  subscribedTo: {
                    owner : reqSub,
                    subscribedTo: owner,
                    date: date.toLocaleDateString(),
                    time: date.toLocaleTimeString(),
                  },
                },
              },
              (err, success) => {
                if (err) {
                  console.log(err);
                } else {
                  // storing to notfication of owner when someone subscribe him
                  User.findOneAndUpdate(
                    { username: owner },
                    {
                      $push: {
                        notSub: {
                          subscribedBy: reqSub,
                          date: date.toLocaleDateString(),
                          time: date.toLocaleTimeString(),
                        },
                      },
                    },
                    (err, success) => {
                      if (err) {
                        console.log(err);
                      } else {
                        res.redirect("/user/public/" + owner + "/" + reqSub);
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    } else {
      res.redirect("/user/public/" + owner + "/" + reqSub);
    }
  });
});

// adding comments to blog itself as well as to owner and username
app.post("/comments/:blogId/:owner/:username", (req, res) => {
  const blogId = req.params.blogId;
  const comment = req.body.comment;
  let date = new Date();
  // res.send(comment)
  // adding comment to specific blog itself
  publicBlog.findByIdAndUpdate(
    blogId,
    {
      $push: {
        comments: {
          comment: comment,
          username: req.params.username,
          date: date.toLocaleDateString(),
          time: date.toLocaleTimeString(),
        },
      },
    },
    (err, success) => {
      if (err) {
        console.log(err);
        // res.redirect("/public/"+req.params.username);
      } else {
        // adding to onwer of the blog
        publicBlog.findById(blogId, (err, docs) => {
          User.findOneAndUpdate(
            { username: req.params.owner },
            {
              $push: {
                commentBy: {
                  blogId: docs.id,
                  blogTitle: docs.title,
                  commentBy: req.params.username,
                  date: date.toLocaleDateString(),
                  time: date.toLocaleTimeString(),
                },
              },
            },
            (err, success) => {
              if (!err) {
                // adding to user which commented
                User.findOneAndUpdate(
                  { username: req.params.username },
                  {
                    $push: {
                      commentTo: {
                        blogId: docs.id,
                        blogTitle: docs.title,
                        blogOwner: req.params.owner,
                        date: date.toLocaleDateString(),
                        time: date.toLocaleTimeString(),
                      },
                    },
                  },
                  (err, success) => {
                    if (!err) {
                      User.findOneAndUpdate(
                        { username: req.params.owner },
                        {
                          $push: {
                            notCommentBy: {
                              blogId: docs.id,
                              blogTitle: docs.title,
                              commentBy: req.params.username,
                              date: date.toLocaleDateString(),
                              time: date.toLocaleTimeString(),
                            },
                          },
                        },
                        (err, success) => {
                          if (!err) {
                            res.redirect(
                              "/public/" + req.params.username + "#" + blogId
                            );
                          }
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        });
      }
    }
  );
});

// adding likes to notificatio of owner user
app.post("/likes/:blogId/:owner/:username", (req, res) => {
  const blogId = req.params.blogId;
  let date = new Date();

  // store only unique subscribers in the like array of blog
  publicBlog.findById(blogId, (err, docs) => {
    const liked = docs.like.find((element) => {
      return element.likeBy == req.params.username;
    });
    if (!liked) {
      // adding to like array of public blog with id blogId
      publicBlog.findByIdAndUpdate(
        blogId,
        {
          $push: {
            like: {
              likeBy: req.params.username,
              date: date.toLocaleDateString(),
              time: date.toLocaleTimeString(),
            },
          },
        },
        (err, success) => {
          if (err) {
            console.log(err);
            // res.redirect("/public/"+req.params.username);
          } else {
            // adding to likedBy of owner
            // no need to check the condition if uniques likes are store in blog then unique like will be store here as well
            publicBlog.findById(blogId, (err, docs) => {
              User.findOneAndUpdate(
                { username: req.params.owner },
                {
                  $push: {
                    likedBy: {
                      blogId: docs.id,
                      blogTitle: docs.title,
                      likedBy: req.params.username,
                      date: date.toLocaleDateString(),
                      time: date.toLocaleTimeString(),
                    },
                  },
                },
                (err, success) => {
                  if (!err) {
                    // adding to likedTo of username
                    User.findOneAndUpdate(
                      { username: req.params.username },
                      {
                        $push: {
                          likedTo: {
                            blogId: docs.id,
                            blogTitle: docs.title,
                            likedOwner: req.params.owner,
                            date: date.toLocaleDateString(),
                            time: date.toLocaleTimeString(),
                          },
                        },
                      },
                      (err, success) => {
                        if (!err) {
                          User.findOneAndUpdate(
                            { username: req.params.owner },
                            {
                              $push: {
                                notLikedBy: {
                                  blogId: docs.id,
                                  blogTitle: docs.title,
                                  likedBy: req.params.username,
                                  date: date.toLocaleDateString(),
                                  time: date.toLocaleTimeString(),
                                },
                              },
                            },
                            (err, success) => {
                              if (!err) {
                                res.redirect(
                                  "/public/" +
                                    req.params.username +
                                    "#" +
                                    blogId
                                );
                              }
                              if (err) {
                                console.log(err);
                              }
                            }
                          );
                        }
                        if (err) {
                          console.log(err);
                        }
                      }
                    );
                  }
                  if (err) {
                    console.log(err);
                  }
                }
              );
            });
          }
        }
      );
    } else {
      res.redirect("/public/" + req.params.username + "#" + blogId);
    }
  });
});

app.get("/notification/private/:username", (req, res) => {
  if (req.isAuthenticated()) {
    User.findOne({ username: req.params.username }, (err, docs) => {
      // console.log(docs);

      res.render("notification", {
        count: "Notifications",
        username: req.params.username,
        user: docs,
        avatar : docs ? docs.avatar : ''
      });
    });
  } else {
    res.redirect("/");
  }
});

//////////////////////////////////////////////////////////////////////////////////////////

// getting a compose page
app.get("/compose/:username", function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({username: req.params.username}, (err, user)=>{
    
    res.render("compose", { 
    count: "compose", 
    username: req.params.username,
    avatar : user ? user.avatar : ''
   });
  });
  } else {
    res.redirect("/");
  }
});

function myDate() {
  let d = new Date();
  date = d.toLocaleString("en-GB").split(",");
  return date;
}

// user can compose a blog add it as personal or personal+private
app.post("/compose/:username", function (req, res) {
  // adding the last modified feature
  User.findOne({username: req.params.username}, (err, user1)=>{

  let dateOF = myDate();
  // let's store blog with same title as well
  const blog = new Blog({
    title: req.body.postTitle,
    body: req.body.postBody,
    date: dateOF[0],
    time: dateOF[1],
    owner: req.body.username,
    tag: req.body.postTag.length === 0 ? "none" : req.body.postTag,
    prPb: req.body.private,
    avatar : user1.avatar,
   
  });
  // blog.save();
  blog.save((err) => {
    if (!err) {
      res.redirect("/home/" + req.body.username);
    }
  });
});
});

// user can view a blog by clicking on the Read More button
app.get("/posts/:blogId/:username", function (req, res) {
  if (req.isAuthenticated()) {
    // const requestedTitle = _.lowerCase(req.params.postName);
    const requestedPostId = req.params.blogId;
    // console.log(requestedPostId);
    // console.log(req.params.blogId);

    User.findOne({username: req.params.username}, (err, user)=>{
    

    Blog.findOne({ _id: requestedPostId }, function (err, blog) {
      if (err) {
        console.log(err);
      } else {
        res.render("post", {
          username: req.params.username,
          id: blog._id,
          title: blog.title,
          content: blog.body,
          count: blog.prPb,
          tag: blog.tag,
          display: blog.prPb == "private" ? "block" : "none",
          avatar : user ? user.avatar : ''
        });
      }
    });
  });
  } else {
    res.redirect("/");
  }
});

// deleting/trashing items from home page moving them to trash page
let trash;
const Trash = mongoose.model("Trash", publicBlogSchema);
app.post("/home/:username", (req, res) => {
  const requestedBlogId = req.body.trashBtn;
  // console.log(requestedBlogId)
  Blog.findByIdAndDelete(requestedBlogId, (err, blog) => {
    trash = blog;
    // console.log(trash)
    // saving the trash blog to new collection called it trash with same blog id
    let dateOF = myDate();
    const trashBlog = new Trash({
      _id: trash.id,
      title: trash.title,
      body: trash.body,
      date: dateOF[0],
      time: dateOF[1],
      owner: req.params.username,
      tag: trash.tag,
      prPb: trash.prPb,
      avatar : trash.avatar,
     
    });
    trashBlog.save();

    if (err) {
      console.log(err);
    } else {
      // console.log("blog " + blog.title + "is deleted !!");
      res.redirect("/home/" + req.params.username);
    }
  });
});

//getting to  users trash
app.get("/trash/:username", function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({username: req.params.username}, (err, user)=>{
    
    Trash.find({ owner: req.params.username }, function (err, blogs) {
      // console.log("length of trashBlogs ", blogs.length)
      if (err) {
        console.log("error occur");
      } else {
        res.render("trash", {
          posts: blogs,
          count: blogs.length + "-Trashes",
          username: req.params.username,
          avatar : user ? user.avatar : ''
        
        });
      }
    })
      .sort("-date")
      .sort("-time");
    });
  } else {
    res.redirect("/");
  }
});

// put back item from trash to home page of user
app.post("/trash/:username", (req, res) => {
  let putBackPostId = req.body.putBack;
  Trash.findByIdAndDelete(putBackPostId, (err, blog) => {
    if (err) {
      // res.redirect("/trash")
      console.log(err);
    } else {
      let dateOF = myDate();
      // puting back with same id
      const post = new Blog({
        _id: blog.id,
        title: blog.title,
        body: blog.body,
        date: dateOF[0],
        time: dateOF[1],
        owner: req.params.username,
        tag: blog.tag,
        prPb: blog.prPb,
        avatar : blog.avatar,
  
      });
      post.save(err);
    }
  });
  res.redirect("/trash/" + req.params.username);
});

// permanent delete of blog of user from trash and eventually from home
app.post("/permDelete/:username", (req, res) => {
  // res.send("deleted")
  const perDelBlogId = req.body.permDelete;
  Trash.findByIdAndDelete(perDelBlogId, (err, blog) => {
    if (err) {
      console.log(err);
    } else {
      publicBlog.findByIdAndDelete(perDelBlogId, (err, blog) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/trash/" + req.params.username);
        }
      });
    }
  });
});

// editing a blog
app.get("/editBlog/:blogId/:username", (req, res) => {
  if (req.isAuthenticated()) {
    // console.log("edit post id " + req.params.blogId);
    // autocomplete the previious title and body
    User.findOne({username: req.params.username}, (err, user)=>{
   
    Blog.findById(req.params.blogId, (err, docs) => {
      if (!err) {
        res.render("editBlog", {
          username: req.params.username,
          editPostId: req.params.blogId,
          title: docs.title,
          body: docs.body,
          count: "edit",
          tag: docs.tag,
          prPb: docs.prPb,
          avatar : user ? user.avatar : ''
        });
      }
    });
  });
  } else {
    res.redirect("/");
  }
});
// Updatig a blog . BUG not updating the public blog
app.post("/editBlog/:username", (req, res) => {
  const editPostId = req.body.buttonUp;
  const upTitle = req.body.postTitleUp;
  const upBody = req.body.postBodyUp;
  const upTag = req.body.postTagUp;

  const preBlog = Blog.findById(editPostId);
  const preTitle = preBlog.title;
  const preBody = preBlog.body;
  const preTag = preBlog.tag;
  let dateOF = myDate();
  Blog.findByIdAndUpdate(
    editPostId,
    {
      title: upTitle.length > 0 ? upTitle : preTitle,
      body: upBody.length > 3 ? upBody : preBody,
      date: dateOF[0],
      time: dateOF[1],
      owner: req.params.username,
      tag: upTag.length > 0 ? upTag : preTag,
    },
    function (err, docs) {
      if (err) {
        console.log(err);
      } else {
        // for public blog updatation
        const preBlog = publicBlog.findById(editPostId);
        let dateOF = myDate();
        publicBlog.findByIdAndUpdate(
          editPostId,
          {
            title: upTitle.length > 0 ? upTitle : preTitle,
            body: upBody.length > 3 ? upBody : preBody,
            date: dateOF[0],
            time: dateOF[1],
            owner: req.params.username,
            tag: upTag.length > 0 ? upTag : preTag,
          },
          function (err, docs) {
            if (err) {
              console.log(err);
            } else {
              res.redirect("/posts/" + editPostId+"/"+ req.params.username);
              // console.log("update successfully", docs);
            }
          }
        );
      }
    }
  );
});

// making private blog to public blog
app.get("/pr-to-pb/:blogId/:username", (req, res) => {
  if (req.isAuthenticated()) {


    const reqBlog = req.params.blogId;
    const onwner = req.params.owner;
    let dateOF = myDate();
    User.findOne({username: req.params.username}, (err, user1)=>{
    Blog.findByIdAndUpdate(reqBlog, { prPb: "public" }, (err, docs) => {
      if (err) {
        console.log(err);
      } else {
        // storing the blog in publicBlog model
        const blog = new publicBlog({
          _id: docs.id,
          title: docs.title,
          body: docs.body,
          date: dateOF[0],
          time: dateOF[1],
          owner: docs.owner,
          tag: docs.tag,
          prPb: "public",
          avatar : user1.avatar,
         
        });
        blog.save((err) => {
          if (err) {
            console.log(err);
          } else {
            res.redirect("/home/" + req.params.username);
          }
        });
      }
    });
  })
  } else {
    res.redirect("/");
  }

});

app.get("/community/:username", (req, res) => {
  

  
  if (req.isAuthenticated()) {
    User.findOne({username: req.params.username}, (err, user)=>{
    User.find({}, (err, users) => {
      Feedback.find({}, (err, feebacks) => {
        res.render("community", {
          users: users,
          count: "community",
          username: req.params.username,
          feebacks: feebacks,
          avatar : user ? user.avatar : ''
        });
      }).sort({subscription : -1});
    })
  })
  } else {
    res.redirect("/");
  }
});

const feedbackSchema = new mongoose.Schema({
  username: String,
  feedback: String,
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

app.post("/community/feedback/:username", (req, res) => {
  const feebackPara = req.body.feeback;
  const feeback = new Feedback({
    username: req.params.username,
    feedback: feebackPara,
  });
  feeback.save((err, feeback) => {
    if (err) {
      console.log(err);
    } else {
      // console.log(feeback);
      res.redirect("/community/" + req.params.username);
    }
  });
});
app.get("/notification/:username/", (req, res) => {
  User.findOne({ username: req.params.username }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      res.render("notification", {
        user: user,
        count: "Notify",
        username: req.params.username,
        subscription: user.notSub ? user.notSub.reverse(): "",
        likeBy: user.notLikedBy ? user.notLikedBy.reverse():"",
        commentBy: user.notCommentBy ? user.notCommentBy.reverse():"",
        subRemoved: user.subRemoved  ? user.subRemoved.reverse():"",
        avatar : user ? user.avatar : ''
      });
    }
  });
});
// deleting subscriptions notifications
app.get("/delete/sub/:name/:username", (req, res) => {
  User.findOneAndUpdate(
    { username: req.params.username },
    {
      $pull: {
        notSub: {
          subscribedBy: req.params.name,
        },
      },
    },
    (err, success) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/notification/" + req.params.username);
      }
    }
  );
});

app.get("/delete/comments/:by/:title/:username", (req, res) => {
  User.findOneAndUpdate(
    { username: req.params.username },
    {
      $pull: {
        notCommentBy: {
          commentBy: req.params.by,
          blogTitle: req.params.title,
        },
      },
    },
    (err, success) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/notification/" + req.params.username);
      }
    }
  );
});

app.get("/delete/likes/:by/:username", (req, res) => {
  User.findOneAndUpdate(
    { username: req.params.username },
    {
      $pull: {
        notLikedBy: {
          likedBy: req.params.by,
        },
      },
    },
    (err, success) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/notification/" + req.params.username);
      }
    }
  );
});
app.get("/delete/sub2/:name/:username", (req, res) => {
  User.findOneAndUpdate(
    { username: req.params.username },
    {
      $pull: {
        subRemoved: {
          subRemoved: req.params.name,
        },
      },
    },
    (err, success) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/notification/" + req.params.username);
      }
    }
  );
});

app.get("/activities/:username", (req, res) => {
  User.findOne({ username: req.params.username }, (err, user) => {
    res.render("activities", {
      count: "activities",
      username: req.params.username,
      likedTo: user.likedTo ?  user.likedTo.reverse() : '',
      commentTo: user.commentTo ? user.commentTo.reverse() :'',
      subscription: user.subscription ? user.subscription.reverse() :'',
      subscribedTo: user.subscribedTo ? user.subscribedTo.reverse() :'',
      avatar : user ? user.avatar : ''
    });
  });
});

app.get("/remove-sub/:sub/:username", (req, res) => {
  let dateOF = myDate();

  // remove subscribe to of user
  User.findOneAndUpdate(
    { username: req.params.username },
    {
      $pull: {
        subscribedTo: {
          subscribedTo: req.params.sub,
        },
      },
    },
    (err, success) => {
      if (err) {
        console.log(err);
      } else {
        // remove subscriber of user from
        User.findOneAndUpdate(
          { username: req.params.sub },
          {
            $pull: {
              subscription: {
                subscribedBy: req.params.username,
              },
            },
          },
          (err, success) => {
            if (err) {
              console.log(err);
            } else {
              // notification
              User.findOneAndUpdate(
                { username: req.params.sub },
                {
                  $push: {
                    subRemoved: {
                      subRemoved: req.params.username,
                      date: dateOF[0],
                      time: dateOF[1],
                    },
                  },
                },
                (err, success) => {
                  if (err) {
                    console.log(err);
                  } else {
                    res.redirect("/activities/" + req.params.username);
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

// setting up the avatar thing

app.get("/avatar/https://avatars.dicebear.com/api/avataaars/:link.svg/:username", (req, res) => {
  // res.send(req.link, +'sdf');
  const link = req.params.link
  const avatar = `https://avatars.dicebear.com/api/avataaars/${link}.svg`
  User.findOneAndUpdate({username:req.params.username}, {
    avatar : avatar
  }, (err, success)=>{
    if(err){
      console.log(err)
    }else{
      publicBlog.updateMany({owner : req.params.username}, {
        avatar : avatar
      }, (err, success)=>{
        if(err){
          console.log(err)
        }else{
          res.redirect("/home/"+req.params.username)
        }
      })
     
    }
  })
  
});

const port = 5500;
app.listen(port, function () {
  console.log("Server started on port ", port);
});

// NOTE difference between
// The req.params property is an object containing properties mapped to the named route “parameters”. For example, if you have the route /student/:id, then the “id” property is available as req.params.id.

// The req.body property contains key-value pairs of data submitted in the request body. By default, it is undefined and is populated when you use a middleware called body-parsing such as express.urlencoded() or express.json().
