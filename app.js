//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>");

// mongoose.connect("mongodb://localhost:27017/<database>")

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "name is required, please check your input"]
  }
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Buy Food"
});
const item2 = new Item({
  name: "Cook Food"
});
const item3 = new Item({
  name: "Eat Food"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    
    if(err){
      console.log(err);
    }
    else{
      if(foundItems.length == 0){
        Item.insertMany(defaultItems, function(err){
          if(err){
            console.log(err);
          }
          else{
            console.log("Successfully insert default items");
          }
        });
        res.redirect("/");
      }
      else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    }
  })
});

app.get("/:listname", function(req, res){
  const listname = _.capitalize(req.params.listname);

  List.findOne({name: listname}, function(err, foundList){
    if (!err){
      if(!foundList){
        // create a new list
        const list = new List({
          name: listname,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + listname);
      }
      else{
        // show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });



  // const newItem = mongoose.model(listname, itemSchema);
  // newItem.find({}, function(err, itemFound){
  //   if(err){
  //     console.log(err);
  //   }
  //   else{
  //     res.render("list", {listTitle: "Today", newListItems: itemFound});
  //   }
  // })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today"){
    Item.findByIdAndRemove(checkItemId, function(err){
      if(err){console.log(err);}
      else{
        console.log("successfully delete " + checkItemId);
      }
    });
    res.redirect("/");
  } 
  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started successfully");
});
