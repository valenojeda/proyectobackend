require('dotenv').config();

const express = require('express');
const app = express();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

app.get('/', (req, res) =>{
    res.send("Backend Proyecto Final")
});

const PORT = 3000

//CODIGO PARA CONFIGURAR EL PUERTO
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));


const readData = (route) => {
    try {
        const data = fs.readFileSync("./cat.json");
    return JSON.parse(data);
    } catch (error) {
        console.log(error);
    }
};

const writeData = (data) => {
    try {
       fs.writeFileSync("./cat.json", JSON.stringify(data));
    } catch (error) {
        console.log(error);
    }
}

app.get("/categories", (req, res) => {
    const data = readData();
    res.json(data.categories);
});

app.get("/categories/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const categories = data.categories.find((cat) => cat.id === id);
    res.json(categories);
});

app.post("/categories", (req, res) => {
    const data = readData();
    const body = req.body;
    const newCategorie = {
        id: data.categories.lenght + 1,
        ...body,
    };
    data.categories.push(newCategorie);
    writeData(data);
    res.json(newCategorie);
});

app.put("/categories/:id", (req, res) => {
    const data = readData();
    const body = req.body;
    const id = parseInt(req.params.id);
    const categoriesIndex = data.categories.findIndex((categories) => categories.id === id);
    data.categories[categoriesIndex] = {
        ...data.categories[categoriesIndex],
        ...body,
    };
    writeData(data);
    res.json( { message: "Update successfully"});
});

app.delete("/categories/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const categoriesIndex = data.categories.findIndex((categories) => categories.id === id);
    data.categories.splice(categoriesIndex, 1);
    writeData(data);
    res.json({ message: "Deleted successfully"});
})


app.get("/catProducts/:id", (req, res) => {
    const id = req.params.id; // No es necesario convertirlo a entero si es un nombre de archivo
    const filePath = path.join(__dirname, "cats_products", `${id}.json`);

    fs.readFile(filePath, "utf-8", (err, data) => {
        if (err) {
            // Manejo de errores: archivo no encontrado u otro problema
            if (err.code === "ENOENT") {
                res.status(404).send({ error: "Archivo no encontrado" });
            } else {
                res.status(500).send({ error: "Error al leer el archivo" });
            }
        } else {
            // Devolver el contenido del archivo JSON como respuesta
            res.type("application/json").send(JSON.parse(data));
        }
    });
});





app.get("/products/:id", (req, res) => {
    const id = req.params.id; // Captura el parámetro de la URL
    const filePath = path.join(__dirname, "products", `${id}.json`); // Ruta dinámica

    fs.readFile(filePath, "utf-8", (err, data) => {
        if (err) {
            // Manejo de errores
            if (err.code === "ENOENT") {
                res.status(404).send({ error: "Archivo no encontrado" }); // Archivo no encontrado
            } else {
                res.status(500).send({ error: "Error al leer el archivo" }); // Otro error
            }
        } else {
            // Respuesta con el contenido del archivo JSON
            res.type("application/json").send(JSON.parse(data));
        }
    });
});


app.get("/products_comments/:id", (req, res) => {
    const id = req.params.id; // Captura el parámetro de la URL
    const filePath = path.join(__dirname, "products_comments", `${id}.json`); // Ruta dinámica

    fs.readFile(filePath, "utf-8", (err, data) => {
        if (err) {
            // Manejo de errores
            if (err.code === "ENOENT") {
                res.status(404).send({ error: "Archivo no encontrado" }); // Archivo no encontrado
            } else {
                res.status(500).send({ error: "Error al leer el archivo" }); // Otro error
            }
        } else {
            // Respuesta con el contenido del archivo JSON
            res.type("application/json").send(JSON.parse(data));
        }
    });
});


// Función para leer datos desde cart.json
function readCartData() {
    const filePath = path.join(__dirname, "cart.json"); // Ruta al archivo cart.json
    const rawData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(rawData); // Parsear y devolver los datos como objeto
}

// Ruta para obtener el mensaje de compra
app.get("/cart", (req, res) => {
    const data = readCartData();
    res.json(data); // Devolver el contenido completo del archivo cart.json
});

// Ruta para obtener un mensaje personalizado con el ID
app.get("/cart/:id", (req, res) => {
    const data = readCartData();
    const id = req.params.id;
    res.json({ msg: `${data.msg} para el ID ${id}` }); // Mensaje personalizado con el ID
});



// Función para leer datos desde el archivo sell.json
function readSellData() {
    const filePath = path.join(__dirname, "sell.json"); // Ruta al archivo sell.json
    const rawData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(rawData); // Parsear y devolver los datos como objeto
}

// Ruta para obtener el mensaje de publicación exitosa
app.get("/sell", (req, res) => {
    const data = readSellData();
    res.json(data); // Devolver el contenido completo del archivo sell.json
});

// Ruta para obtener un mensaje personalizado con el ID
app.get("/sell/:id", (req, res) => {
    const data = readSellData();
    const id = req.params.id;
    res.json({ msg: `${data.msg} para el ID ${id}` }); // Mensaje personalizado con el ID
});


// Función para leer datos desde user_cart.json
function readUserCartData() {
    const filePath = path.join(__dirname, "user_cart.json"); // Ruta al archivo user_cart.json
    const rawData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(rawData); // Parsear y devolver los datos como objeto
}

// Ruta para obtener la información completa del carrito del usuario
app.get("/user_cart", (req, res) => {
    const data = readUserCartData();
    res.json(data); // Devolver el contenido completo del archivo user_cart.json
});

// Ruta para obtener los detalles del artículo en el carrito por ID
app.get("/user_cart/article/:id", (req, res) => {
    const data = readUserCartData();
    const articleId = parseInt(req.params.id); // Convertir el ID del artículo a número
    const article = data.articles.find((art) => art.id === articleId); // Buscar el artículo por ID

    if (article) {
        res.json(article); // Devolver el artículo encontrado
    } else {
        res.status(404).send({ error: "Artículo no encontrado" }); // Si el artículo no existe
    }
});
