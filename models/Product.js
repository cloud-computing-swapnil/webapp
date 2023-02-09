'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
 class Product extends Model {
   /**
    * Helper method for defining associations.
    * This method is not a part of Sequelize lifecycle.
    * The `models/index` file will call this method automatically.
    */
   static associate(models) {
     // define association here
   }
 }
 Product.init({


   name: {
     type: DataTypes.STRING,
     allowNull: false,
   },
   description: {
     type: DataTypes.STRING,
     allowNull: false,
   },
   sku: {
     type: DataTypes.STRING,
     allowNull: false,
     unique: true,//error capture
   },
   manufacturer: {
       type: DataTypes.STRING,
       allowNull: false,
     },
     quantity: {
       type: DataTypes.INTEGER,
       allowNull: false,
       validate: {
         min:0,
         max:100
       },
     },
     owner_user_id:{
      type: DataTypes.INTEGER,
     }
 },
 {
   sequelize,
   modelName: 'Product',
   timestamps: true,
   createdAt: 'date_added',
   updatedAt:"date_last_updated"
 });
 return Product;
};
