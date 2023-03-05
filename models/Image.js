'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
 class Image extends Model {
   static associate(models) {
   }
 }
 Image.init({
  image_id:{
    type:DataTypes.INTEGER,
    autoIncrement:true,
    primaryKey:true
  },
    product_id:{
        type: DataTypes.INTEGER,
    },
   
    file_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
        },
    },
    s3_bucket_path: {
     type: DataTypes.STRING,
     allowNull: false,
   },
 },
 {
   sequelize,
   initialAutoIncrement:1,
   modelName: 'Image',
   timestamps: true,
   createdAt: 'date_created',
   id:'image_id',
   updatedAt:"date_last_updated"
 });
 return Image;
};