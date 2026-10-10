const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3001;
const DATA = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA, "utf8")); }
  catch { return { users: [], orders: [], products: [
    {id:1,name:"Wireless Headphones",price:1299,category:"Electronics",description:"Comfortable wireless headphones",emoji:"🎧",stock:20},
    {id:2,name:"Smart Watch",price:1899,category:"Electronics",description:"Everyday smart watch",emoji:"⌚",stock:15},
    {id:3,name:"Travel Backpack",price:999,category:"Accessories",description:"Durable backpack for travel",emoji:"🎒",stock:25},
    {id:4,name:"Running Shoes",price:1599,category:"Fashion",description:"Lightweight running shoes",emoji:"👟",stock:18},
    {id:5,name:"Coffee Mug",price:249,category:"Home",description:"Ceramic daily-use mug",emoji:"☕",stock:40},
    {id:6,name:"Desk Lamp",price:799,category:"Home",description:"LED desk lamp",emoji:"💡",stock:12}
  ]}; }
}
function saveData(d) { fs.writeFileSync(DATA, JSON.stringify(d, null, 2)); }
app.get("/api/products", (req,res) => res.json(readData().products));
app.get("/api/products/:id", (req,res) => {
  const p = readData().products.find(x => x.id === Number(req.params.id));
  p ? res.json(p) : res.status(404).json({error:"Product not found"});
});
app.post("/api/register", (req,res) => {
  const {name,email,password} = req.body || {};
  if (!name || !email || !password) return res.status(400).json({error:"Name, email and password are required"});
  const d = readData();
  if (d.users.some(u => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({error:"Email already registered"});
  // Demo only: use a proper password hashing library and database in production.
  d.users.push({id:Date.now(),name,email,password});
  saveData(d); res.status(201).json({message:"Account created. You can now sign in."});
});
app.post("/api/login", (req,res) => {
  const {email,password} = req.body || {};
  const u = readData().users.find(x => x.email.toLowerCase() === String(email||"").toLowerCase() && x.password === password);
  if (!u) return res.status(401).json({error:"Invalid email or password"});
  res.json({message:"Welcome back!",user:{id:u.id,name:u.name,email:u.email}});
});
app.post("/api/orders", (req,res) => {
  const {customer,items,address} = req.body || {};
  if (!customer || !address || !Array.isArray(items) || !items.length) return res.status(400).json({error:"Customer, address and cart items are required"});
  const d = readData(); let total = 0; const orderItems = [];
  for (const item of items) {
    const p = d.products.find(x => x.id === Number(item.id));
    const qty = Math.max(1, Math.min(99, Number(item.qty)||1));
    if (!p || p.stock < qty) return res.status(400).json({error:`Unavailable item or stock: ${item.id}`});
    p.stock -= qty; total += p.price * qty; orderItems.push({id:p.id,name:p.name,price:p.price,qty});
  }
  const order = {id:"ORD-"+Date.now(),customer:String(customer).slice(0,100),address:String(address).slice(0,300),items:orderItems,total,status:"Order placed",createdAt:new Date().toISOString()};
  d.orders.push(order); saveData(d); res.status(201).json({message:"Order placed successfully!",order});
});
app.get("/api/orders", (req,res) => res.json(readData().orders.map(({id,customer,total,status,createdAt})=>({id,customer,total,status,createdAt}))));
app.listen(PORT, () => console.log(`E-commerce app running: http://localhost:${PORT}`));
