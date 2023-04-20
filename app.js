const {
  sequelize,
  User,
  Product,
  Image
} = require('./models')
const express = require('express')
const app = express()
app.use(express.json())
const bcrypt = require('bcrypt');
const auth = require('./auth/auth')
const bodyParser = require('body-parser');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} = require("@aws-sdk/client-s3");
const AWS = require('aws-sdk');
require('dotenv').config()
const multer = require('multer')
const uuid = require('uuid');
const crypto = require('crypto');
const sharp = require('sharp');
const {
  fileURLToPath
} = require('url');
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage
})
const helper = require('./config/winston');
app.get('/healthz', async (req, res) => {
  helper.logger.info("Healthz route hit!!");
  helper.statsdClient.increment('healthz',1);
  res.sendStatus(200);
})

app.get('/healthy', async (req, res) => {
  // helper.logger.info("Healthz route hit!!");
  // helper.statsdClient.increment('healthz',1);
  res.sendStatus(200);
})

///POSTING USER INFORMATION
app.post('/v6/users', async (req, res) => {
  helper.logger.info("POST - User");
  helper.statsdClient.increment('POST_user',1);
  const {
    first_name,
    username,
    last_name,
    password
  } = req.body


  

  try {
    //email should be valid
    const emailRegex = /^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)$/
    if (!emailRegex.test(username)) {
      helper.logger.error("Check failed!! Invalid email.");
      return res.status(400).json({
        error: 'Enter your Email ID in correct format. Example: abc@xyz.com'
      })
    }
    // Validation for ID
    if (req.body.id) {
      helper.logger.error("ID cannot be provided by the user");
      return res.status(400).json({
        error: 'Invalid request body for user object: ID cannot be provided by the user'
      })
    }

    //All four fields should be present
    if (!username ||
      !password ||
      !first_name ||
      !last_name) {
      helper.logger.error("All four fields should be present");
      return res.status(400).json({
        error: 'username, password, first_name, last_name fields are required in the request body'
      })
    }

    const getUser = await User.findOne({
      where: {
        username: username,
      },
    }).catch((err) => {
      helper.logger.error("Some error occurred while creating the user");
      return res.status(500).json({
        error: 'Some error occurred while creating the user'
      })
    })
    if (getUser) {
      helper.logger.error("User already exists!,Please try a different email address");
      return res.status(400).json({
        error: 'User already exists!,Please try a different email address'
      })
    } else {
      helper.logger.info("All Checks Passed.");
      const salt = await bcrypt.genSalt(10);
      const securedPassword = await bcrypt.hash(password, salt)
      const user = await User.create({
        first_name,
        username,
        last_name,
        password: securedPassword
      })
      const userWithoutPassword = {
        id: user.id,
        first_name: user.first_name,
        username: user.username,
        last_name: user.last_name,
        account_updated: user.account_updated,
        account_created: user.account_created
      };
      helper.logger.info("User Successfully added");
      res.status(201).json(userWithoutPassword);
    }
  } catch (err) {
    console.log(err)
    helper.logger.error("DB Error", err);
    return res.status(500).json({
      error: 'Some error occurred while creating the user'
    })
  }
})

//FETCHING USER INFORMATION
app.get('/v1/user/:id', auth, async (req, res) => {
  helper.logger.info(`Get - user for id - ${req.params.id}.`);
  helper.statsdClient.increment('GET_USER',1);
  if (req.params.id) {
    if (req.response.id !== parseInt(req.params.id)) {
      helper.logger.error(`Incorrect user details-Forbidden Resource`);
      return res.status(403).json({
          message: 'Forbidden Resource'
        }),
        console.log("User not match");
    }
  }
  const id = req.params.id
  try {
    const user = await User.findOne({
      where: {
        id
      },
      attributes: {
        exclude: ['password']
      }
    })
    if (!user) {
      helper.logger.error("ID NOT PRESENT");
      return res.status(400).json({
        error: 'ID NOT PRESENT'
      })
    }
    helper.logger.info("Checks passed.");
    helper.logger.info("User Successfully fetched");
    return res.json(user)
  } catch (err) {
    helper.logger.error("DB Error", err);
    console.log(err)
    return res.status(500).json({
      error: 'Something went wrong'
    })
  }
})


//UPDATING USER
app.put('/v1/user/:id', auth, async (req, res) => {
  helper.logger.info(`UPDATE - user for id - ${req.params.id}.`);
  helper.statsdClient.increment('UPDATE_user',1);
  if (req.params.id) {
    if (req.response.id !== parseInt(req.params.id)) {
      helper.logger.error(`Incorrect user details-Forbidden Resource`);
      return res.status(403).json({
          message: 'Forbidden Resource'
        }),
        console.log("User not match");
    }
  }
  const {
    first_name,
    last_name,
    password,
    username
  } = req.body

  try {

    // req.body is empty
    if (!req.body) {
      helper.logger.error("Request body cant empty");
      return res.status(400).json({
        error: 'Request body cant empty'
      })
    }

    // req.body is present but doesn't have any of
    // first_name, last_name, password, username
    if (!req.body.first_name && !req.body.last_name && !req.body.password && !req.body.username) {
      helper.logger.error("All four fields should be present");
      return res.status(400).json({
        error: 'Request body doesnt have any of first_name, last_name, password'
      })
    }
    // if user_id is not present in the request
    const id = req.params.id;
    if (!id) {
      helper.logger.error("User id is not present in the request");
      return res.status(400).json({
        error: 'User id is not present in the request'
      })
    }
    // check if account_created_at is present in the request body
    if (req.body.account_created) {
      helper.logger.error("account_created cant be updated");
      return res.status(400).json({
        error: 'account_created cant be updated'
      })
    }
    // check if account_updated_at is present in the request body
    if (req.body.account_updated) {
      helper.logger.error("account_updated cant be updated");
      return res.status(400).json({
        error: 'account_updated cant be updated'
      })
    }

    var DBUserObj = await User.findByPk(id);
    // check if username is present in the request body
    // if present, verify it matches the username in the db
    if (req.body.username) {
      if (DBUserObj.username !== req.body.username) {
        helper.logger.error("Username cant be updated");
        return res.status(400).json({
          error: 'Username cant be updated'
        })
      }
    }
    // check if id is present in the request body and if it matches the id in the request
    if (req.body.id) {
      if (DBUserObj.id !== req.body.id) {
        helper.logger.error("ID cant be updated");
        return res.status(400).json({
          error: 'ID cant be updated'
        })
      }
    }
    helper.logger.info("Checks passed.");
    const salt = await bcrypt.genSalt(10);
    const securedPassword = await bcrypt.hash(password, salt)

    const user = await User.findOne({
      where: {
        id
      }
    })
    user.first_name = first_name
    user.last_name = last_name
    user.password = securedPassword
    user.username = username;

    await user.save()
    helper.logger.info("User Successfully updated");
    return res.status(204).json()
  } catch (err) {
    helper.logger.error("DB Error", err);
    console.log(err)
    return res.status(500).json({
      error: 'Something went wrong'
    })
  }
})



//Posting Product Information
app.post('/v1/product', auth, async (req, res) => {
  helper.logger.info("POST - Product");
  helper.statsdClient.increment('POST_product',1);
  try {
    const owner_user_id = req.response.id
    const {
      name,
      description,
      sku,
      manufacturer,
      quantity
    } = req.body

    // Validation for ID
    if (req.body.id) {
      helper.logger.error("Invalid request body for user object");
      return res.status(400).json({
        error: 'Invalid request body for user object: ID cannot be provided by the user'
      })
    }
    //Validation for date_added,date_last_updated and owner_user_id
    if (req.body.owner_user_id || req.body.date_added || req.body.date_last_updated) {
      helper.logger.error("These properties cant be provided by the user");
      return res.status(400).json({
        error: 'These properties cant be provided by the user'
      })
    }
    //Validation for quantity
    if (quantity < 0 || quantity > 100 || typeof req.body.quantity === 'string') {
      helper.logger.error("Quantity should be between 0 and 100 and it shouldnt be string");
      return res.status(400).json({
        error: 'Quantity should be between 0 and 100 and it shouldnt be string'
      })
    }
    //All four fields should be present
    if (!name ||
      !description ||
      !sku ||
      !manufacturer ||
      !quantity) {
      helper.logger.error("Name, description,sku,manufacturer,quantity fields are required in the request body");
      return res.status(400).json({
        error: 'Name, description,sku,manufacturer,quantity fields are required in the request body'
      })
    }
    const getProduct = await Product.findOne({
      where: {
        sku: sku,
      },
    })

    if (getProduct) {
      helper.logger.error("Bad request!! The entered sku value already exists.");
      return res.status(400).json({
        error: 'Sku already exists!,Please try a different SKU No'
      })
    } else {
      helper.logger.info("Checks Passed.");
      const product = await Product.create({
        name,
        description,
        sku,
        manufacturer,
        quantity,
        owner_user_id
      })
      helper.logger.info("Product Successfully added");
      res.status(201).json(product);
    }
  } catch (err) {
    helper.logger.error("DB Error - ", err);
    console.log(err)
    return res.status(500).json({
      error: 'Some error occurred while creating the Product'
    })
  }
})


//UPDATING Product Information---PATCH
app.patch('/v1/product/:id', auth, async (req, res) => {
  helper.logger.info("PATCH - Product for id - ", req.params.id);
  helper.statsdClient.increment('PATCH_product',1);
  const id = req.params.id;
  const product = await Product.findOne({
    where: {
      id
    }
  })
  if (!product) {
    helper.logger.error("Product not found");
    return res.status(404).send('Product not found');
  }

  if (product.owner_user_id.toString() !== req.response.id.toString()) {
    helper.logger.error("You are not authorized to update this product");
    return res.status(401).send('You are not authorized to update this product');
  }

  const {
    name,
    description,
    sku,
    manufacturer,
    quantity
  } = req.body;
  product.name = name;
  product.description = description;
  product.sku = sku;
  product.manufacturer = manufacturer;
  product.quantity = quantity;

  try {
    // Validation for ID
    if (req.body.id) {
      helper.logger.error("Invalid request body for user object");
      return res.status(400).json({
        error: 'Invalid request body for user object: ID cannot be provided by the user'
      })
    }
    //Validation for date_added,date_last_updated and owner_user_id
    if (req.body.owner_user_id || req.body.date_added || req.body.date_last_updated) {
      helper.logger.error("These properties cant be provided by the user");
      return res.status(400).json({
        error: 'These properties cant be provided by the user'
      })
    }
    //Validation for quantity
    if (quantity < 0 || quantity > 100 || typeof req.body.quantity === 'string') {
      helper.logger.error("Quantity should be between 0 and 100 and it shouldnt be string");
      return res.status(400).json({
        error: 'Quantity should be between 0 and 100 and it shouldnt be string'
      })
    }

    helper.logger.info("Checks Passed.");
    await Product.update({
      ...req.body
    }, {
      where: {
        id
      },
      
    });
    helper.logger.info("Product Successfully updated");
    // await product.update(req.body,);
    return res.status(204).json()
  } catch (error) {
    helper.logger.error("DB Error - ", err);
    res.status(400).send(error);
  }
});

//UPDATING Product Information--PUT
app.put('/v1/product/:id', auth, async (req, res) => {
  helper.logger.info("PUT - Product for id - ", req.params.id);
  helper.statsdClient.increment('PUT_product',1);
  const id = req.params.id;
  const product = await Product.findOne({
    where: {
      id
    }
  })
  if (!product) {
    helper.logger.error("Product not found");
    return res.status(404).send('Product not found');
  }

  if (product.owner_user_id.toString() !== req.response.id.toString()) {
    helper.logger.error("You are not authorized to update this product");
    return res.status(401).send('You are not authorized to update this product');
  }

  const {
    name,
    description,
    sku,
    manufacturer,
    quantity
  } = req.body;
  product.name = name;
  product.description = description;
  product.sku = sku;
  product.manufacturer = manufacturer;
  product.quantity = quantity;

  try {
    // Validation for ID
    if (req.body.id) {
      helper.logger.error("Invalid request body for user object");
      return res.status(400).json({
        error: 'Invalid request body for user object: ID cannot be provided by the user'
      })
    }
    //Validation for date_added,date_last_updated and owner_user_id
    if (req.body.owner_user_id || req.body.date_added || req.body.date_last_updated) {
      helper.logger.error("These properties cant be provided by the user");
      return res.status(400).json({
        error: 'These properties cant be provided by the user'
      })
    }
    //Validation for quantity
    if (quantity < 0 || quantity > 100 || typeof req.body.quantity === 'string') {
      helper.logger.error("Quantity should be between 0 and 100 and it shouldnt be string");
      return res.status(400).json({
        error: 'Quantity should be between 0 and 100 and it shouldnt be string'
      })
    }
    //All four fields should be present
    if (!name ||
      !description ||
      !sku ||
      !manufacturer ||
      !quantity) {
      helper.logger.error("All four fields should be present");
      return res.status(400).json({
        error: 'Name, description,sku,manufacturer,quantity fields are required in the request body'
      })
    }
    helper.logger.info("Checks Passed.");

    await product.save();
    helper.logger.info("Product Successfully updated");
    return res.status(204).json()
  } catch (error) {
    helper.logger.error("DB Error - ", err);
    res.status(400).send(error);
  }
});



////Deleting Product Information
app.delete('/v1/product/:id', auth, async (req, res) => {
  helper.logger.info("DELETE - Product for id - ", req.params.id);
  helper.statsdClient.increment('DELETE_product',1);
  try {
    const id = req.params.id;
    const product = await Product.findOne({
      where: {
        id
      }
    })
    if (!product) {
      helper.logger.error("Product not found");
      return res.status(404).json({
        message: 'Product not found'
      });
    }
    // Check if the user who added the product is making the request
    if (product.owner_user_id !== req.response.id) {
      helper.logger.error("Not authorized to delete this product");
      return res.status(401).json({
        message: 'Not authorized to delete this product'
      });
    }
    // Delete the product
    helper.logger.info("All checks passed");
    await product.destroy();
    helper.logger.info("Product Successfully deleted");
    return res.status(204).json()
  } catch (error) {
    helper.logger.error("DB Error - ", err);
    res.status(500).json({
      message: error.message
    });
  }
});


//GET PRODUCTS
app.get('/v1/product/:id', async (req, res) => {
  helper.logger.info("GET - Product for id - ", req.params.id);
  helper.statsdClient.increment('GET_product',1);
  const id = req.params.id
  try {
    const product = await Product.findOne({
      where: {
        id
      }
    })
    if (!product) {
      helper.logger.error("ID not present");
      return res.status(404).json({
        error: 'ID NOT PRESENT'
      })
    }
    helper.logger.info("Product Successfully fetched");
    return res.json(product)
  } catch (err) {
    console.log(err)
    helper.logger.error("DB Error - ", err);
    return res.status(500).json({
      error: 'Something went wrong'
    })
  }
})










const bucketName = process.env.BUCKET_NAME
const accessId = process.env.ACCESS_KEY
const secretKey = process.env.SECRET_ACCESS

// Set up AWS S3 configuration
const s3 = new AWS.S3({
  accessKeyId: accessId,
  secretAccessKey: secretKey
})
const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')


app.post('/v1/product/:id/image', upload.single('file'), auth, async (req, res) => {
  helper.logger.info("POST - Image");
  helper.statsdClient.increment('POST_image_counter');
  const id = req.params.id;
  const product = await Product.findOne({
    where: {
      id
    }
  })
  if (!product) {
    helper.logger.error("Product not found");
    return res.status(404).send('Product not found');
  }
  if (product.owner_user_id.toString() !== req.response.id.toString()) {
    helper.logger.error("You are not authorized to post this image under this product");
    return res.status(401).json({
      error: 'You are not authorized to post this image under this product',
    });
  }

  const file = req.file
  if (!file.mimetype.startsWith("image/")) {
    helper.logger.error("The file type is not supported");
    return res.status(400).json({
      error: "The file type is not supported",
    });
  }
  const fileName = generateFileName()
  const uploadParams = {
    Bucket: bucketName,
    Body: file.buffer,
    Key: fileName,
  }
  // Send the upload to S3

  const data = await s3.upload(uploadParams).promise();
  const s3BucketPath = `s3://${bucketName}`;
  const image = await Image.create({
    product_id: req.params.id,
    file_name: fileName,
    date_created: new Date(),
    s3_bucket_path: data.Location,
  })
  let result = await image.save();
  helper.logger.info("Image Successfully added");
  return res.status(201).send(result);
});

//DELETING THE IMAGES
app.delete('/v1/product/:id/image/:image_id', auth, async (req, res) => {
  helper.logger.info("DELETE - Image for id ");
  helper.statsdClient.increment('DELETE_image_counter');

  const id = req.params.id;
  const product = await Product.findOne({
    where: {
      id
    }
  })
  if (!product) {
    helper.logger.error("Product not found");
    return res.status(404).send('Product not found');
  }
  if (product.owner_user_id.toString() !== req.response.id.toString()) {
    helper.logger.error("You are not authorized to post this image under this product");
    return res.status(401).json({
      error: 'You are not authorized to delete this image under this product',
    });
  }

  const image = await Image.findOne({
    where: {
      image_id: req.params.image_id,
    },
  });
  if (!image) {
    helper.logger.error("No product image found");
    return res.status(404).json({
      message: "No product image found",
    });
  }

  if (image.product_id != id) {
    helper.logger.error("This image doesnt belong to this Product");
    return res.status(404).json({
      message: 'This image doesnt belong to this Product',
    });
  }

  const deleteParams = {
    Bucket: bucketName,
    Key: image.file_name,
  }
  try {
    await image.destroy();
    helper.logger.info("Image Successfully deleted");
    const data = await s3.deleteObject(deleteParams).promise();
    return res.status(204).send();
  } catch (err) {
    helper.logger.error("DB Error - ", err);
    console.log(err);
    return res.status(500).send("Error deleting image from S3 bucket");
  }
});


// Route to get details of a specific product image
app.get('/v1/product/:id/image/:image_id', auth, async (req, res) => {
  helper.logger.info("GET - Image for id ");
  helper.statsdClient.increment('GET_image_counter');
  const id = req.params.id;
  const product = await Product.findOne({
    where: {
      id
    }
  })
  if (req.params.id) {
    if (req.response.id !== parseInt(product.owner_user_id)) {
      helper.logger.error(`Incorrect user details-Forbidden Resource`);
      return res.status(403).json({
          message: 'Forbidden Resource'
        }),
        console.log("User not match");
    }
  }
  if (!product) {
    helper.logger.error("Product not found");
    return res.status(404).send('Product not found');
  }
  if (product.owner_user_id.toString() !== req.response.id.toString()) {
    helper.logger.error("You are not authorized to post this image under this product");
    return res.status(401).json({
      error: 'You are not authorized to fetch this image under this product',
    });
  }

  try {
    console.log(req.params)
    const image = await Image.findOne({
      where: {
        image_id: req.params.image_id,
      },
    });
    if (!image) {
      helper.logger.error("No product image found");
      return res.status(404).json({
        message: "No product image found",
      });
    }
    if (image.product_id != id) {
      return res.status(403).json({
        message: "This product is not allowed to access other's image",
      });
    }
    helper.logger.info("Image Successfully fetched");
    res.status(200).json(image);
  } catch (error) {
    helper.logger.error("DB Error - ", error);
    console.error(error);
    res.status(500).send('Internal server error.');
  }
});



// Route to get details of all product images
app.get('/v1/product/:id/image', auth, async (req, res) => {
  helper.logger.info("GET -All Image for product id");
  helper.statsdClient.increment('GET_all_image_counter');
  const id = req.params.id;
  const product = await Product.findOne({
    where: {
      id
    }
  })
  console.log(product)
  if (req.params.id) {
    if (req.response.id !== parseInt(product.owner_user_id)) {
      helper.logger.error(`Incorrect user details-Forbidden Resource`);
      return res.status(403).json({
          message: 'Forbidden Resource'
        }),
        console.log("User not match");
    }
  }
  if (!product) 
    helper.logger.error("Product not found");
    return res.status(404).json({
    
    message: "Product not found",
  });
  if (product.owner_user_id.toString() !== req.response.id.toString()) {
    helper.logger.error("You are not authorized to post this image under this product");
    return res.status(401).json({
      error: 'You are not authorized to fetch this image under this product',
    });
  }

  try {
    const images = await Image.findAll({
      where: {
        product_id: req.params.id,
      },
    });
    if (!images.length) {
      helper.logger.error("No product image found");
      return res.status(404).json({
        message: "No product images found",
      });
    }
    helper.logger.info("Image Successfully fetched");
    res.status(200).json(images);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error.');
  }
});


//Listening 
app.listen({
  port: 8000
}, async () => {
  console.log('Server up on http://localhost:8000')
  await sequelize.authenticate()
  console.log('Database Connected!')
  helper.logger.info("Database setup complete.")
  await sequelize.sync({
    alter: true
  });

})

module.exports = app;
