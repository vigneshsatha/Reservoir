const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const exphbs  = require('express-handlebars');
const moment = require('moment')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const config = require('./config/database')
const LocalStrategy = require('passport-local').Strategy;
const session = require("express-session");
var flash = require('express-flash');

let menu;

mongoose.connect(config.database);

let db = mongoose.connection;

db.once('open',function(){
    console.log('Connected to MongoDB')  
});

db.on('error',function(err) {
   console.log(err) 
});
const app = express()

let Level = require('./model/level')

let LevelHistory = require('./model/level_history')

let User = require('./model/user')

app.use(express.static(path.join(__dirname,'public')))
app.use(bodyParser.urlencoded({extended:false}));
app.use(session({ secret: "cats" }));
app.use(passport.initialize());
app.use(passport.session());
app.set('views',path.join(__dirname,'views'))
app.use(flash());


passport.use(new LocalStrategy(
function(username, password, done) {
  User.findOne({ username: username }, function (err, user) {
    if (err) { return done(err); }
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    bcrypt.compare(password, user.password, function(err, isMatch){
        if(err){
            console.log(err)
        }
        if(isMatch){
            return done(null, user);
        }
        console.log('Not match');
        return done(null, false, null);
    });
  });
}
));
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });


app.engine('handlebars', exphbs({
    defaultLayout: 'layout', 
    extname: '.handlebars',
    partialsDir :  'views' ,
    layoutsDir : 'views'   
}));

app.set('view engine', 'handlebars');

Level.find({},{'name':1,'damId':1},function(err, obj){
    if(err){
        console.log(err)
        menu={};
    }else{
        menu = obj;
    }
});

app.get('*',function(req, res, next){
    res.locals.user = req.user || null;
    next();
});

app.get('/',(req, res)=>{
    Level.find({},function(err, levels){
         if(err){
             console.log(err)
         }else{
             res.render('level',{
                 'levels':levels,
                 'title':'Dam Level',
                 'topic':'Dam Level',
                 'menu' : menu
             })
         }
    }); 
 });

 app.get('/level/:id',(req, res)=> {
    let id = req.params.id;
    Level.findOne({'damId':id},function(err, obj){
        if(err){
            console.log(err)
        }
        let damName = obj.name;
        LevelHistory.find({'damId':req.params.id},function(err, obj){
            if(err){
                console.log(err)
            }else{
                console.log()
                res.render('view_one',{
                    'levels':obj,
                    'title':damName,
                    'menu' : menu
                    })
            }
        });
    });

});

app.all('/admin/*',ensureAuthenticated,function(req,res,next){
    next();
});

app.get('/admin/level',(req, res)=>{
    Level.find({},function(err, levels){
         if(err){
             console.log(err)
         }else{
             res.render('admin/level',{
                 'levels':levels,
                 'title':'Dam Level',
                 'topic':'Dam Level',
                 'menu' : menu
             })
         }
    }); 
 });
 

app.get('/admin/add',(req, res)=> {
    console.log(req.user)
    Level.find({},function(err, obj){
        if(err){
            console.log(err)
        }else{
            res.render('admin/add_level',{
                'menu' : menu
                })
        }
    });
});

app.post('/admin/add',(req, res)=> {
    let level = new Level();
    level.level = req.body.level;
    level.name = req.body.name;
    level.nameEn = req.body.nameEn;
    level.damId = req.body.damId;
    let date = moment(req.body.date,'yyyy-MM-DD');
    date = moment(date).format('DD-MM-YYYY');
    level.updated = date;
    level.inflow = req.body.inflow;
    level.outflow = req.body.outflow;
    level.save(level,function(err){
        if(err){
            console.log(err)
            return
        }
        let levelHistory = new LevelHistory();
        levelHistory.level = req.body.level;
        levelHistory.damId = req.body.damId;
        let date = moment(req.body.date,'yyyy-MM-DD');
        date = moment(date).format('DD-MM-YYYY');
        levelHistory.updated = date;
        levelHistory.inflow = req.body.inflow;
        levelHistory.outflow = req.body.outflow;
        levelHistory.diff=0;
        levelHistory.save(function(err) {
            if(err){
                console.log(err)
            }
            res.redirect('/admin/level')
        });
            
    });
});

app.get('/admin/edit/:id',(req, res)=> {
    let id = req.params.id;
    Level.findOne({'_id':id},function(err, obj){
        if(err){
            console.log(err)
        }else{
            res.render('admin/edit_level',{
                'level':obj,
                'title':'Dam Level',
                'menu' : menu
                })
        }
    });
});

app.post('/admin/update',(req, res)=> {
    let level = {};
    level.level = req.body.level;
    level.name = req.body.name;
    level.inflow = req.body.inflow;
    level.outflow = req.body.outflow;
    let date = moment(req.body.date,'yyyy-MM-DD');
    date = moment(date).format('DD-MM-YYYY');
    level.updated = date;
    let query = {'_id':req.body._id}
    Level.update(query, level, function(err){
        if(err){
            console.log(err)
            return
        }else{
            let levelHistory = new LevelHistory();
            levelHistory.level = req.body.level;
            levelHistory.damId = req.body.damId;
            let date = moment(req.body.date,'yyyy-MM-DD');
            date = moment(date).format('DD-MM-YYYY');
            levelHistory.updated = date;
            levelHistory.inflow = req.body.inflow;
            levelHistory.outflow = req.body.outflow;
            levelHistory.diff=0;
            levelHistory.save(function(err) {
                if(err){
                    console.log(err)
                }
                res.redirect('/admin/level')
            });
        }
    });
});

app.get('/admin/history/:id',(req, res)=> {
    let id = req.params.id;
    LevelHistory.find({'damId':id},function(err, levels){
        if(err){
            console.log(err)
        }else{
            res.render('admin/view_one',{
                'levels':levels,
                'title':'Dam Level',
                'menu' : menu
                })
        }
    });
});

app.get('/admin/history/delete/:id',(req, res)=> {
    let id = req.params.id;
    LevelHistory.remove({'_id':id},function(err){
        if(err){
            console.log(err)
        }
        res.redirect('/admin/level');
    });
});

app.get('/user/login',(req, res)=>{
    res.render('login')
});

/**
app.post('/user/login',(req, res, next)=>{
    console.log(req.body);
    passport.authenticate('local', {
        failureRedirect:'/user/login'
    },function(req, res) {
        res.redirect('/');
      })(req, res, next);

});*/
app.post('/user/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.redirect('/user/login'); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        console.log("username="+user.username);
        console.log("req.user="+req.user);
        return res.redirect('/admin/level');
      });
    })(req, res, next);
  });

app.get('/logout',function(req, res){
    console.log(req.user)
    req.logOut();
    res.redirect('/');
});

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }else{
        res.redirect('/user/login');
    }
}

app.listen(3000, () => console.log('Example app listening on port 3000!'))