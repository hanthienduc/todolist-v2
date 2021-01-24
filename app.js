//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-han:han123@cluster0.djb9z.mongodb.net/todoListDB", { useNewUrlParser: true });

const itemSchema = {
    name: String
}

const Item = mongoose.model("Item", itemSchema);

const Item1 = new Item({
    name: "Welcome to your todoList!"
});

const Item2 = new Item({
    name: "Hit the + button to add a new item."
});

const Item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defautList = [Item1, Item2, Item3];

const listSchema = {
    name: String,
    items: [itemSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

    Item.find({}, function(err, foundItems) {
        if (!err) {
            if (foundItems.length === 0) {
                Item.insertMany(defautList, function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Successfully save default items to database");
                        mongoose.connection.close();
                    }
                });
                res.redirect("/");
            } else {
                res.render("list", { listTitle: "Today", newListItems: foundItems });
            }
        } else {
            console.log(err);
        }

    });

});


app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                // create new list
                const list = new List({
                    name: customListName,
                    items: defautList
                });

                list.save();
                res.redirect("/" + customListName);
            } else {
                // show existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
            }
        }
    });


});

app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({
        name: itemName
    });

    if (listName === "Today") {
        newItem.save();
        res.redirect("/");

    } else {
        List.findOne({ name: listName }, function(err, foundList) {
            if (err) {
                console.log(err);
            }
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        })
    }

});

app.post("/delete", function(req, res) {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (!err) {
                console.log("Successfully deleted checked item ");
                res.redirect("/");
            } else {
                console.log(err);
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

});


// app.get("/work", function(req, res) {
//     res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

app.get("/about", function(req, res) {
    res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function() {
    console.log("Server has started successfully.");
});