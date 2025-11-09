drop database if exists db_products;

create database db_products;

use db_products;

create table
    products (
        ubicacion varchar(250),
        tipoDeUso varchar(250),
        img varchar(250),
        codigo varchar(250),
        url varchar(250),
        minicodigo varchar(250),
        marca varchar(250),
        deltronimg varchar(250),
        updated varchar(250),
        descripcion varchar(250),
        detalles varchar(1000),
        stock varchar(250),
        dolares DECIMAL(10, 2),
        soles DECIMAL(10, 2),
        primary key (codigo, ubicacion, tipoDeUso)
    );

DROP TABLE IF EXISTS cameras;
CREATE TABLE cameras(
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    model varchar(255) NOT NULL UNIQUE,
    product varchar(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS porcentaje;
CREATE TABLE porcentaje (
    id INT PRIMARY KEY DEFAULT 1,
    valor DECIMAL(5, 2) DEFAULT 1.10
);