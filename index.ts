// Подключение всех модулей к программе
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);


// Отслеживание порта
server.listen(3000);

import { PrismaClient } from '@prisma/client';
import { arrayBuffer } from 'stream/consumers';

const prisma = new PrismaClient();


//Вставляем сообщение в бд
async function createMsg($mess: string, $name: string) {
    const message = await prisma.message.create({
		data: {
			username: $name,
			text: $mess,
		},
	})
}

//Читаем сообщение написаные за последние 5 минут
async function showMsg3() {
	var date = new Date();
	date.setMinutes(date.getMinutes() - 5);
	const message = await prisma.message.findMany({
		select: {
			username: true,
			text: true
		},
		where: {
			createdAt: {
				gte: date
			}
		}
	})
	return message
}


// Отслеживание url адреса и отображение нужной HTML страницы
app.get('/', (request: any, respons: any) => {
	respons.sendFile(__dirname + '/index.html');
});


// Массив со всеми подключениями
var connections: any[] = [];


// Функция, которая сработает при подключении к странице
// Считается как новый пользователь
io.sockets.on('connection', function(socket: {
	emit: any; on: (arg0: string, arg1: { (data: any): void; (data: any): void; }) => void; 
}) {
	console.log("Успешное соединение");


	// Добавление нового соединения в массив
	connections.push(socket);

	
	//Функция, которая послыает массив с сообщениями
	showMsg3().then(result => {
        socket.emit('output-messages', result)
    })

	// Функция, которая срабатывает при отключении от сервера
	socket.on('disconnect', function(data) {
		// Удаления пользователя из массива
		connections.splice(connections.indexOf(socket), 1);
		console.log("Отключились");
	});

	// Функция получающая сообщение от какого-либо пользователя
	socket.on('send mess', function(data) {
		// Внутри функции мы передаем событие 'add mess',
		// которое будет вызвано у всех пользователей и у них добавиться новое сообщение 
		createMsg(data.mess, data.name);
		io.sockets.emit('add mess', {mess: data.mess, name: data.name});
	});

});


