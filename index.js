
require("dotenv").config();  

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const SignupModel = require("./models/adminsignup");
const ProductModel = require("./models/product");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("MongoDB Connection Error:", err));

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await SignupModel.findOne({ email });

    if (user) {
        if (user.password === password) {
            res.json("success");
        } else {
            res.json("incorrect password");
        }
    } else {
        res.json("no record exists");
    }
});

app.post("/register", async (req, res) => {
    try {
        const newUser = await SignupModel.create(req.body);
        res.json(newUser);
    } catch (err) {
        res.status(500).json(err);
    }
});

// ✅ Add Products
app.post("/add-product", async (req, res) => {
    try {
        const { name, quantity, price } = req.body;
        const newProduct = await ProductModel.create({ name, quantity, price });
        res.json(newProduct);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ✅ Fetch All Products
app.get("/products", async (req, res) => {
    try {
        const products = await ProductModel.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Delete Product
app.delete("/delete-product/:id", async (req, res) => {
    try {
        await ProductModel.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Update Product
app.put("/update-product/:id", async (req, res) => {
    try {
        const { name, quantity, price } = req.body;
        const updatedProduct = await ProductModel.findByIdAndUpdate(req.params.id, { name, quantity, price }, { new: true });
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const billSchema = new mongoose.Schema({
    customer: {
        name: String,
        mobile: String,
        email: String,
    },
    billDate: String,
    order: [
        {
            productName: String,
            price: Number,
            quantity: Number,
            totalPrice: Number,
        },
    ],
    total: Number,
});

const Bill = mongoose.model("Bill", billSchema);

app.post("/save-bill", async (req, res) => {
    try {
        const newBill = new Bill(req.body);
        await newBill.save();

        for (const item of req.body.order) {
            const updatedProduct = await ProductModel.findOneAndUpdate(
                { name: item.productName },
                { $inc: { quantity: -item.quantity } },
                { new: true }
            );
            if (updatedProduct.quantity <= 0) {
                await ProductModel.findByIdAndUpdate(updatedProduct._id, { quantity: 0 });
            }
        }

        res.status(201).json({ message: "Bill saved & inventory updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error saving bill or updating inventory." });
    }
});

app.get("/bills", async (req, res) => {
    try {
        const bills = await Bill.find();
        res.json(bills);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch bills" });
    }
});

app.get("/top-selling-products", async (req, res) => {
    try {
        const bills = await Bill.find();
        const products = await ProductModel.find();

        let productSales = {};

        bills.forEach((bill) => {
            bill.order.forEach((item) => {
                if (productSales[item.productName]) {
                    productSales[item.productName] += item.quantity;
                } else {
                    productSales[item.productName] = item.quantity;
                }
            });
        });

        const productDetails = products.map((product) => {
            const soldQuantity = productSales[product.name] || 0;
            const isOutOfStock = product.quantity <= 0;
            return {
                name: product.name,
                quantitySold: soldQuantity,
                quantityInStock: product.quantity,
                isOutOfStock
            };
        });

        const sortedProducts = productDetails
            .sort((a, b) => b.quantitySold - a.quantitySold);

        res.json(sortedProducts);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch top-selling products." });
    }
});



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});




