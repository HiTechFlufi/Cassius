/**
 * Message Parser
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file parses messages sent by the server.
 *
 * @license MIT license
 */

'use strict';

const Room = require('./rooms').Room; // eslint-disable-line no-unused-vars
const User = require('./users').User; // eslint-disable-line no-unused-vars

class Context {
	/**
	 * @param {string} target
	 * @param {Room | User} room
	 * @param {User} user
	 * @param {string} command
	 * @param {number} [time]
	 */
	constructor(target, room, user, command, time) {
		this.target = target ? target.trim() : '';
		this.room = room;
		this.user = user;
		this.command = command;
		this.time = time || Date.now();
	}

	/**
	 * @param {string} text
	 */
	say(text) {
		this.room.say(text);
	}

	/**
	 * @param {string} [command]
	 * @param {string} [target]
	 */
	run(command, target) {
		if (command) {
			command = Tools.toId(command);
			if (!Commands[command]) return;
			if (typeof Commands[command] === 'string') {
				// @ts-ignore Typescript bug - issue #10530
				command = Commands[command];
			}
			target = target.trim();
		} else {
			command = this.command;
			target = this.target;
		}

		if (typeof Commands[command] !== 'function') return;

		try {
			// @ts-ignore Typescript bug - issue #10530
			Commands[command].call(this, target, this.room, this.user, this.command, this.time);
		} catch (e) {
			let stack = e.stack;
			stack += 'Additional information:\n';
			stack += 'Command = ' + command + '\n';
			stack += 'Target = ' + target + '\n';
			stack += 'Time = ' + new Date(this.time).toLocaleString() + '\n';
			stack += 'User = ' + this.user.name + '\n';
			stack += 'Room = ' + (this.room instanceof Users.User ? 'in PM' : this.room.id);
			console.log(stack);
		}
	}
}

exports.Context = Context;

class MessageParser {
	constructor() {
		this.globalContext = new Context('', Rooms.globalRoom, Users.self, '');
	}

	/**
	 * @param {string} message
	 * @param {Room | User} room
	 * @param {User} user
	 * @param {number} [time]
	 */
	parseCommand(message, room, user, time) {
		message = message.trim();
		if (message.charAt(0) !== Config.commandCharacter) return;

		message = message.substr(1);
		let spaceIndex = message.indexOf(' ');
		let target = '';
		let command = '';
		if (spaceIndex !== -1) {
			command = message.substr(0, spaceIndex);
			target = message.substr(spaceIndex + 1);
		} else {
			command = message;
		}
		command = Tools.toId(command);
		if (!Commands[command]) return;
		if (typeof Commands[command] === 'string') {
			// @ts-ignore Typescript bug - issue #10530
			command = Commands[command];
		}
		if (typeof Commands[command] !== 'function') return;

		new Context(target, room, user, command, time).run();
	}
}

exports.MessageParser = new MessageParser();
