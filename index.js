require('dotenv').config();

const express = require('express');
const app = express();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const SECRET_KEY = "CLAVE SECRETA";

// Habilitar CORS para permitir peticiones desde otros orígenes
app.use(cors());

// Parsear el cuerpo de las peticiones como JSON
app.use(express.json());

// Ruta al archivo cart.json
const cartFilePath = path.join(__dirname, 'cart.json');

// Ruta a la carpeta de productos
const productsFolderPath = path.join(__dirname, 'products');

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

// Middleware para verificar el token
const authenticateToken = (req, res, next) => {
    // Obtener el header de autorización (donde se encuentra el token)
    const authHeader = req.headers['authorization'];
    // Extraemos el token del encabezado (En el formato "Bearer token")
    const token = authHeader && authHeader.split(' ')[1];

    // Si no hay token, devolvemos un error de "Unauthorized"
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    // Verificamos si el token es válido usando la librería 'jsonwebtoken'
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido o expirado' });
        }
        // Si el token es válido, añadimos la información del usuario a la solicitud (req.user)
        req.user = user;
        next();
    });
};

// Login
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if ( username && password ) {
      const token = jwt.sign({ username }, SECRET_KEY);
      res.status(200).json({ token });

    } else {
      res.status(401).json({ message: "Usuario y/o contraseña incorrecto" });
    }
});

app.get('/ecommerce-data', authenticateToken, (req, res) => {
    console.log("Acceso a /ecommerce-data con token válido"); // Verificar si llega la solicitud

    // Leer el archivo cart.json para obtener las categorías
    fs.readFile(cartFilePath, 'utf-8', (err, cartData) => {
        if (err) {
            return res.status(500).json({ message: "Error al leer las categorías", error: err });
        }

        const categories = JSON.parse(cartData).categories;

        // Leer todos los productos de la carpeta products
        fs.readdir(productsFolderPath, (err, files) => {
            if (err) {
                return res.status(500).json({ message: "Error al leer los productos", error: err });
            }

            // Filtrar solo los archivos JSON (productos)
            const productFiles = files.filter(file => file.endsWith('.json'));

            // Leer cada archivo de producto y almacenarlos en un array
            const productPromises = productFiles.map(file => {
                return new Promise((resolve, reject) => {
                    const productPath = path.join(productsFolderPath, file);

                    fs.readFile(productPath, 'utf-8', (err, productData) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(JSON.parse(productData));
                        }
                    });
                });
            });

            // Esperar que todos los productos se lean antes de enviar la respuesta
            Promise.all(productPromises)
                .then(products => {
                    // Enviar los datos (categorías y productos) en la respuesta
                    res.status(200).json({
                        message: "Acceso permitido",
                        categories: categories,
                        products: products,
                        user: req.user
                    });
                })
                .catch(err => {
                    res.status(500).json({ message: "Error al leer los productos", error: err });
                });
        });
    });
});

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
