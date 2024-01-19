const http = require("http");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const axios = require("axios");

//Connecting to PostGreSQL
const { Pool } = require("pg");

const pool = new Pool({
  user: "",
  host: "",
  database: "",
  password: "",
  port:  ,
});
pool.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

const htmlTemplate = fs.readFileSync(
  "D:/Facultate/Anul 2 SATI/nodeJS - Turcu Daniel/proiect/index.html",
  "utf-8"
);

const filePath =
  "D:/Facultate/Anul 2 SATI/nodeJS - Turcu Daniel/proiect/data.txt";
var array = [];

const xmlEndpoint = "https://dataapi-i6q5.onrender.com/?recordtype=xml";
const jsonEndpoint = "https://dataapi-i6q5.onrender.com/?recordtype=json";

var uri =
  "";

async function connectToMongoDB(uri) {
  const client = new MongoClient(uri, {});
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const object = await getAllData(client);
    array.push(object);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    await client.close();
  }
}

async function getAllData(client) {
  const db = client.db("bdmd");
  const collection = db.collection("students");

  // Find all documents in the collection
  const documents = await collection.find({}).toArray();

  // Display all records
  const object = documents[0];

  const newObject = {
    name: object.tara,
    capital: object.capitala,
    population: parseInt(object.populatie, 10).toLocaleString("en-US"),
  };

  return newObject;
}

async function fetchData() {
  try {
    //Adding the object from MongoDB cloud - 1
    await connectToMongoDB(uri);

    const data = await fs.promises.readFile(filePath, "utf8");

    //Adding the object from the XML endpoint - 2
    const xmlObject = await getDatafromXMLEndpoint();
    array.push(xmlObject);

    //Adding the object from the JSON endpoint - 3
    const jsonObject = await getDatafromJSONEndpoint();
    array.push(jsonObject);

    //Adding the object from the file - 4
    array.push(JSON.parse(data));

    const dbResult = await pool.query("SELECT * FROM countries");

    //Adding the object from the PostGreSQL - 5
    dbResult.rows.forEach((row) => {
      array.push({
        name: row.country_name,
        capital: row.country_capital,
        population: row.country_population,
      });
    });

    // Adding the object from the MongoDBCompass - 6
    await readData();

    console.log(array);

    const dynamicContent = array
      .map(
        (obj, index) => `
  <tr>
    <th scope="row">${index + 1}</th>
    <td>${obj.name}</td>
    <td>${obj.capital}</td>
    <td>${obj.population}</td>
  </tr>
`
      )
      .join("");

    const modifiedHtml = htmlTemplate.replace(
      "<!-- Dynamic content will be inserted here -->",
      dynamicContent
    );

    const server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(modifiedHtml);
    });

    const PORT = 3000;

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });

    pool.end();
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getDatafromXMLEndpoint() {
  try {
    const response = await axios.get(xmlEndpoint);
    const options = { compact: true, ignoreComment: true, spaces: 4 };
    const result = convert.xml2js(response.data, options);

    const countryObject = result.rand;

    const newObject = {
      name: countryObject.tara._text,
      capital: countryObject.capitala._text,
      population: parseInt(countryObject.populatie._text, 10).toLocaleString(
        "en-US"
      ),
    };

    return newObject;
  } catch (error) {
    console.error("Error fetching data from XML endpoint:", error);
    throw error;
  }
}

fetchData();

const url = "mongodb://localhost:27017";
const dbName = "countries";

const client = new MongoClient(url, {});

async function readData() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Local");

    const db = client.db(dbName);
    const collection = db.collection("Country");

    const documents = await collection.find({}).toArray();

    array.push(documents[0]);
  } catch (error) {
    console.error("Error reading data from MongoDB:", error);
  } finally {
    await client.close();
    console.log("Connection MongoDB Local closed");
  }
}

const convert = require("xml-js");

async function getDatafromJSONEndpoint() {
  try {
    const response = await axios.get(jsonEndpoint);

    const countryObject = response.data.tari[0];

    const newCountryObject = {
      name: countryObject.tara,
      capital: countryObject.capitala,
      population: parseInt(countryObject.populatie, 10).toLocaleString("en-US"),
    };

    return newCountryObject;
  } catch (error) {
    console.error("Error fetching data from JSON endpoint:", error);
    throw error;
  }
}
