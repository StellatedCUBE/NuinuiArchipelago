import { APQuestMenu } from "./questMenu.js";
import { TextParticle } from "./textParticle.js";
import { patchEvents } from "./events.js";
import { APPickup, BossDrop } from "./pickup.js";
import { getIcon } from './icon.js';
import { ConsoleMenu } from "./consoleMenu.js";
import * as Feat from "./feat.js";

function style(node, state) {
	if (node.type === 'item')
		return node.item.progression ? 'magenta' : node.item.useful ? 'blue' : node.item.trap ? 'red' : 'cyan';
	if (node.type === 'player')
		return node.player.slot === state.client.players.self.slot ? 'magenta' : 'yellow';
	return {location: 'green', entrance: 'yellow'}[node.type];
}

function css(style) {
	return {
		bold: 'font-weight:bold',
		underline: 'text-decoration:underline',
		green: 'color:#0f0',
		black: 'color:#000;background-color:#fffa'
	}[style] || (!style || style.endsWith('_bg')) ? '' : 'color:' + style;
}

export class ArchipelagoState {
	#lastDeath = 0;
	feats = 0n;
	#newFeats = 0n;
	#lastFeat = 0;
	#goal;
	#goalVerified;
	#id;
	#saveKey;
	#itemCrystals = 0;
	#gameCrystals = 0;
	#crystalsToSend = 0;
	#bombs = 0;
	progressiveLevels = [0, 0];
	#reconnectTime;
	reconnecting = false;
	itemsHandled = 0;
	helps = 0;
	helpsSpent = 0;
	#essence = 0;
	#bigCrystals = 0;
	coins = 0;
	coinsSpent = 0;
	bufferedHearts = 0;
	casinoKey = Infinity;
	hasGotNuinuiPlayer = false;
	saves = {
		nuinui: {'item-gun': true},
		random: {},
		maiden: {}
	};
	availableLevels = {
		nuinui: new Set(),
		random: new Set(),
		maiden: new Set(),
	};
	incomingDeath = false;
	checking = [];
	toScout = [];
	scouts = {};
	localIgnoreLocations = [];
	chat = [];

	constructor(slotData, reconnect) {
		this.slotData = slotData;
		this.deathLink = slotData.deathLink;
		this.reconnect = reconnect;
		patchEvents();
	}

	async use(client) {
		this.keyPrefix = `t${client.players.self.team}s${client.players.self.slot}\t`;
		client.messages.on('message', (_, nodes) => this.chat.push(nodes.map(node => `<span style="${css(style(node, this))}">${node.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`).join('')));

		const slotId = 0|await client.storage.prepare(this.keyPrefix, -~(2e9*Math.random())).commit(true);
		if (!slotId || (this.#id && this.#id !== slotId))
			return client.socket.disconnect();
		this.#id = slotId;

		if (!this.client) {
			const save = await Tauri.storage.getItem(this.#saveKey = `archipelago-${slotId}-${client.room.seedName}`)
			if (save) {
				this.#newFeats |= BigInt('0x' + save.ft);
				this.checking.push(...save.chk);
			}
			if (this.slotData.boss.prq) {
				client.storage.fetch(this.keyPrefix + 'c').then(gameCrystals => 'number' === typeof gameCrystals && (this.#gameCrystals = gameCrystals));
				for (const i in '.....') {
					this.toScout.push((2 << 16) | i, (3 << 16) | i, (7 << 16) | i);
				}
			}
		}

		this.client = client;
		this.#reconnectTime = 1;
		this.reconnecting = false;

		this.#goal = BigInt('0x' + this.slotData.goal);
		if (this.#goal === this.feats) {
			client.goal();
		}

		client.deathLink.on('deathReceived', _ => this.incomingDeath = this.deathLink);

		client.storage.fetch(this.keyPrefix + 'd').then(deathLink => 'number' === typeof deathLink && (this.deathLink = deathLink));
		client.storage.prepare(this.keyPrefix + 'h', 0).max(this.helpsSpent).commit(true).then(spent => 'number' === typeof spent && (this.helpsSpent = spent));
		
		let packet = JSON.stringify([{
			cmd: 'Set',
			default: 0,
			key: this.keyPrefix + 'f',
			want_reply: true,
			operations: [],
			BigInt: true
		}]);
		if (this.feats) packet = packet.replace('[]', `[{"operation":"or","value":${this.feats}}]`);
		client.socket.ws.send(packet);
		client.socket.wait('setReply', p => p.BigInt).then(([p]) => p.value && (this.feats |= BigInt(p.value)));

		client.room.on('locationsChecked', (locations) => this.checking = this.checking.filter(l => !locations.includes(l)));
		const toCheck = this.checking;
		this.checking = [];
		for (const loc of toCheck)
			this.check(loc, true);

		client.messages.on('goaled', (_, player) => {
			if (player.slot === this.client.players.self.slot) {
				this.#goalVerified = true;
				this.save();
			}
		});

		this.toScout.push(...Object.keys(this.scouts).filter(loc => this.scouts[loc] === null).map(x=>+x));
	}

	update() {
		this.hitBy = this.deathCause = null;

		if (!this.client) return;
		
		if (!this.client.authenticated && !this.reconnecting) {
			this.reconnecting = true;
			setTimeout(this.reconnect, this.#reconnectTime, this);
			this.#reconnectTime = Math.min(180000, Math.max(5000, this.#reconnectTime * 2));
		}

		if (this.client.items.count > this.itemsHandled) {
			const items = this.client.items.received;
			for (let i = this.itemsHandled; i < items.length; i++) {
				const item = items[i];
				this.handleItem(item);
			}
			this.itemsHandled = items.length;
		}

		if (this.toScout.length) {
			const toScout = this.toScout.filter(loc => this.client.room.allLocations.includes(loc));
			this.toScout = [];
			if (toScout.length) {
				for (const loc of toScout)
					this.scouts[loc] = null;
				try {
					this.client.scout(toScout).then(data => data.forEach(item => this.scouts[item.locationId] = item));
				} catch {}
			}
		}

		const player = NNM.getPlayer();

		if (!NNM.game.menu && player?.playerControl) {
			if (this.pendingPopUp) {
				NNM.game.menu = this.pendingPopUp;
				this.pendingPopUp = null;
			} else if (this.incomingDeath)
				player.die(NNM.game);
		}

		if (!NNM.game.menu && this.bufferedHearts > 0) {
			this.bufferedHearts--;
			NNM.game.scene.actors.push(new Heart(player.pos.plus({ x: 4 + 8 * Math.sign(NNM.game.currentStage === 'port' && this.arenaId === 4 ? -1 : Math.round(player.vel.x)), y: -16 })));
		}

		if (this.#newFeats) {
			this.#newFeats &= this.#goal & ~this.feats;
			this.feats |= this.#newFeats;
			if (this.feats === this.#goal) {
				try { this.client.goal(); }
				catch {}
			}
			if (this.#newFeats) {
				let packet = JSON.stringify([{
					cmd: 'Set',
					default: 0,
					key: this.keyPrefix + 'f',
					want_reply: false,
					operations: []
				}]);
				packet = packet.replace('[]', `[{"operation":"or","value":${this.#newFeats}}]`);
				try { this.client.socket.ws.send(packet); }
				catch {}
				this.#newFeats = 0n;
			}
		}

		if (this.#crystalsToSend && !this.reconnecting) {
			try { this.client.storage.prepare(this.keyPrefix + 'c', 0).add(this.#crystalsToSend).commit(); }
			catch {}
			this.#crystalsToSend = 0;
		}

		if (player instanceof PekoraPlayer) {
			player.crystalCount = Math.max(0, Math.min(999, this.#itemCrystals + this.#gameCrystals));
			player.bombCount = this.#bombs;
		}
	}

	setSaveField(quest, field, value=true) {
		this.saves[quest][field] = value;
		if (NNM.game.currentQuest === quest) NNM.game.saveData.data[field] = value;
	}

	unlockLevel(quest, level) {
		this.setSaveField(quest, 'stage-' + level);
		this.availableLevels[quest].add(level);
	}

	handleItem(item) {
		let msg;
		const sub_id = item.id & 255;
		const local = item.sender.slot === item.receiver.slot;
		if (local && this.localIgnoreLocations.includes(item.locationId))
			return;
		switch (item.id >> 16) {
			case 0:
				this.#itemCrystals += sub_id;
				if (!NNM.game.menu)
					NNM.game.playSound('cling2');
				if (1+!local && NNM.getPlayer()) {
					const particle = new TextParticle(NNM.getPlayer().pos.plus({ x: 8, y: -10 }), ['    +' + sub_id], 'center', -0.12);
					const label = particle.labels[0];
					const old = label.draw_en.bind(label);
					label.draw_en = (game, cx) => old(game, cx, cx.drawImage(NNM.game.assets.images.sp_gem, 0, 4, 16, 8, 0, -1, 16, 8));
					NNM.game.scene.particles.pool.push(particle);
				}
				break;

			case 1:
				this.setSaveField('nuinui', 'item-gun');
				const level = Object.keys(NNM.game.quests.nuinui.stages)[sub_id];
				if (!level) break;
				if ((item.id & 256) && this.slotData.boss.nnq) {
					this.unlockLevel('nuinui', this.latestNNQLevel = level);
					if (this.popupFlag = !this.slotData.nnq_li && item.locationId > 9) break;
				}
				if ((item.id & 512) && sub_id < 5 && this.slotData.boss.prq) this.unlockLevel('random', level);
				let level_name = NNM.game.assets.locales[NNM.game.lang]['stage_' + level];
				level_name = level_name.substring(2, level_name.length - 2);
				msg = [(item.id & (256 | 512)) === (256 | 512) ? 'raw:you obtained access to ' + level_name : `raw:you obtained ${level_name} in ` + ((item.id & 256) ? 'nuinui quest' : 'random quest')];
				if (!local)
					msg.push('raw:received from ' + item.sender.name);
				this.popup(new PopUpMenu(NNM.game, null, msg, 'stage', sub_id));
				break;

			case 3:
				if (this.hasGotNuinuiPlayer) {
					this.setSaveField('nuinui', 'item-gun');
					this.setSaveField('nuinui', 'item-noel');
					this.popup(new PopUpMenu(NNM.game, null, [sub_id ? 'castle_2' : 'archipelago_flare', local ? 'castle_3' : 'raw:received from ' + item.sender.name], 'item', sub_id * 3));
				} else {
					this.hasGotNuinuiPlayer = true;
					this.setSaveField('nuinui', 'current-mode', sub_id ? 'noel' : 'flare');
				}
				break;

			case 4:
				this.setSaveField('nuinui', 'item-' + ['fire', 'rocket', 'petal', 'sword', 'shield', 'dual'][sub_id]);
				if (NNM.game.currentQuest === 'nuinui' && NNM.getPlayer())
					NNM.getPlayer().chargeTypeList = Object.keys(NNM.getPlayer().chargeTypeData).filter(shot => this.saves.nuinui['item-' + shot])
				msg = [sub_id === 1 ? 'falls_10' : 'archipelago_shot_' + sub_id];
				if (!local)
					msg.push('raw:received from ' + item.sender.name);
				this.popup(new PopUpMenu(NNM.game, null, msg, 'archipelago', getIcon(item.id)));
				break;

			case 5:
				this.setSaveField('nuinui', 'key-' + sub_id);
				if (NNM.game.scene.bossOrder && NNM.game.scene.bossOrder[NNM.game.scene.keyId] === sub_id && NNM.game.scene.events.length)
					NNM.game.scene.events[0].key = true;
				msg = ['archipelago_key'];
				if (!local)
					msg.push('raw:received from ' + item.sender.name);
				this.popup(new PopUpMenu(NNM.game, null, msg, 'archipelago', getIcon(item.id)));
				break;

			case 6:
				this.setSaveField('nuinui', 'item-' + ['clock', 'jump', '', 'boots'][sub_id - 1]);
				if (NNM.game.currentQuest === 'nuinui' && NNM.getPlayer() && (sub_id === 4 || NNM.game.playerClass === Flare))
					NNM.getPlayer()[['item', 'doubleJump', '', 'canWallJump'][sub_id - 1]] = true;
				this.popup(new PopUpMenu(NNM.game, null, [['casino_7', 'yamato_8', '', 'heaven_0'][sub_id - 1], local ? ['casino_70', 'yamato_9', '', 'heaven_1'][sub_id - 1] : 'raw:received from ' + item.sender.name], 'item', sub_id));
				break;

			case 7:
				this.setSaveField('nuinui', 'emblem-' + sub_id);
				msg = ['archipelago_emblem_' + sub_id];
				if (!local)
					msg.push('raw:received from ' + item.sender.name);
				this.popup(new PopUpMenu(NNM.game, null, msg, 'archipelagoEmblem', sub_id));
				break;

			case 8:
				this.setSaveField('random', 'crystal-' + Object.keys(NNM.game.quests.random.stages)[sub_id]);
				if (!(this.#goal & (1n << BigInt(Feat.PRQ_LEVEL_CLEAR)))) {
					if (++this.#bigCrystals > 3)
						this.unlockLevel('random', 'holo_hq');
					msg = ['archipelago_big_crystal'];
					if (!local)
						msg.push('raw:received from ' + item.sender.name);
					this.popup(new PopUpMenu(NNM.game, null, msg, 'archipelago', getIcon(item.id)));
				}
				break;

			case 9:
				
				this.#essence++;
				break;

			case 10:
				this.coins++;
				if (!NNM.game.menu)
					NNM.game.playSound('cling2');
				if (!local && NNM.getPlayer()) {
					const particle = new TextParticle(NNM.getPlayer().pos.plus({ x: 8, y: -10 }), ['  +1'], 'center', -0.12);
					const label = particle.labels[0];
					const old = label.draw_en.bind(label);
					label.draw_en = (game, cx) => old(game, cx, cx.drawImage(NNM.game.assets.images.sp_star, 24, 0, 8, 8, 0, -1, 8, 8));
					NNM.game.scene.particles.pool.push(particle);
				}
				break;

			case 11:
				this.bufferedHearts++;
				break;

			case 12:
				this.helps++;
				if (local && item.locationId < 655360)
					this.popup(new PopUpMenu(NNM.game, null, ['archipelago_gsh'], 'archipelago', getIcon(item.id)));
				break;

			case 14:
				this.popupFlag = true;
				if (!NNM.game.scene.altColorLocked && NNM.game.menu?.constructor.name !== 'ArchipelagoConnectMenu') {
					NNM.game.config.setItem('altColor', !NNM.game.config.getItem('altColor'));
					if (!NNM.game.menu) {
						NNM.game.playSound('no_damage');
						NNM.game.scene.shakeBuffer = 12;
					}
				}
				break;

			case 15:
				const newLevelItem = this.progressiveLevels[sub_id]++ | (sub_id ? 2 << 16 : ((512 * !this.slotData.boss.prq) | ((1 << 16) | 256)));
				this.handleItem({id: newLevelItem, sender: item.sender, receiver: item.receiver, locationId: item.locationId});
				break;

			case 16:
				this.casinoKey = 0;
				msg = ['archipelago_key'];
				if (!local)
					msg.push('raw:received from ' + item.sender.name);
				this.popup(new PopUpMenu(NNM.game, null, msg, 'archipelago', getIcon(item.id)));
				break;

			case 17:
				this.#bombs++;
				msg = ['archipelago_bomb'];
				if (!local)
					msg.push('raw:received from ' + item.sender.name);
				this.popup(new PopUpMenu(NNM.game, null, msg, 'archipelago', getIcon(item.id)));
				break;
		}
	}

	get availableLevelCount() {
		return this.availableLevels.nuinui.size + this.availableLevels.random.size + this.availableLevels.maiden.size;
	}

	get onlyNoel() {
		return !this.saves.nuinui['item-noel'] && this.saves.nuinui['current-mode'] === 'noel';
	}

	selectQuest(prevMenu) {
		NNM.game.menu = new APQuestMenu(NNM.game, prevMenu);
		if (NNM.game.menu.quests.length === 1) {
			NNM.game.setQuest(NNM.game.menu.quests[0].id);
			NNM.game.scene.update(NNM.game);
			this.selectLevel(prevMenu);
		}
	}

	selectLevel(prevMenu) {
		NNM.game.menu = new (NNM.game.currentQuest === 'maiden' ? MarineStageSelect : StageSelect)(NNM.game, prevMenu);
	}

	checked(loc) {
		return this.checking.includes(loc) || this.client.room.checkedLocations.includes(loc);
	}

	checkAvailable(loc) {
		return !this.checking.includes(loc) && this.client.room.missingLocations.includes(loc);
	}

	check(loc, noPopup) {
		if (loc === 3) {
			this.feat(Feat.NNQ_LEVEL_CLEAR + 4);
		} else if (loc === 4) {
			this.feat(Feat.NNQ_LEVEL_CLEAR + 4);
			this.feat(Feat.NNQ_GOOD_END);
		} else if ((loc >> 16) === 1) {
			this.feat(Feat.NNQ_LEVEL_CLEAR + (loc & 7));
		}

		if (loc && !this.checked(loc)) {
			this.checking.push(loc);
			if (!noPopup && this.scouts[loc] && this.scouts[loc].receiver.slot !== this.client.players.self.slot) {
				let name = this.scouts[loc].name;
				if (this.scouts[loc].receiver.game === 'Hollow Knight')
					name = name.replace(/_/g, ' ');
				this.popup(new PopUpMenu(NNM.game, null, ['raw:sent ' + name, 'raw:to ' + this.scouts[loc].receiver.name], 'archipelago', [NNM.game.assets.images.NNM_Archipelago_logo2]));
			}
			if (this.scouts[loc] && this.scouts[loc].receiver.slot === this.client.players.self.slot) {
				this.popupFlag = noPopup;
				this.handleItem(this.scouts[loc]);
				this.localIgnoreLocations.push(loc);
				if (!this.popupFlag) {
					let name = this.scouts[loc].name;
					if (!+name[0])
						name = 'a ' + name;
					this.popup(new PopUpMenu(NNM.game, null, ['raw:found ' + name], 'archipelago', getIcon(this.scouts[loc].id)));
				}
			}

			if (this.reconnecting) this.save();

			try {
				this.client.check(loc);
			} catch {}
		}
	}

	scout(loc) {
		if (this.scouts[loc] === undefined && !this.toScout.includes(loc) && this.client.room.missingLocations.includes(loc))
			this.toScout.push(loc);
	}

	feat(feat) {
		this.#newFeats |= 1n << BigInt(feat);
		this.#lastFeat = NNM.game.frameCount;
	}

	save(onlyIfReconnecting) {
		if (onlyIfReconnecting && !this.reconnecting) return;
		if (!this.#goalVerified && (this.reconnecting || this.checking.length || this.#lastFeat > NNM.game.frameCount - 2e3)) {
			Tauri.storage.setItem(this.#saveKey, {
				chk: this.checking,
				ft: (this.feats | this.#newFeats).toString(16),
				t: Date.now()
			});
		} else {
			Tauri.storage.removeItem(this.#saveKey);
		}
	}

	disconnect() {
		this.save();
		self.archipelagoState = null;
		this.client.socket.disconnect();
	}

	textParticle(x, y, text, align, yvel) {
		NNM.game.scene.particles.pool.push(new TextParticle(new Vector2(x, y), text, align, yvel));
	}

	popup(menu) {
		this.popupFlag = true;
		if (!this.noPopup) {
			if (this.pendingPopUp) {
				let p = this.pendingPopUp;
				while (p.previousMenu) p = p.previousMenu;
				p.previousMenu = menu;
			} else {
				if (menu instanceof PopUpMenu && NNM.game.menu instanceof PopUpMenu) {
					let p = NNM.game.menu;
					while (p.previousMenu && p instanceof PopUpMenu) p = p.previousMenu;
					if (p instanceof PopUpMenu) {
						p.previousMenu = menu;
						return;
					}
				}
				this.pendingPopUp = menu;
			}
		}
	}

	giftText(loc) {
		const item = this.scouts[loc];
		if (item) {
			if (item.sender.slot === item.receiver.slot) {
				if (!item.progression && loc === 2)
					return 'we found this!';
			} else if (item.progression)
				return item.receiver.name + ' is going to need this!';
			else if (item.useful) 
				return item.receiver.name + ' is going to want this!';
			else
				return `we found something of ${item.receiver.name}'s!`;
		}
	}

	onSceneStart(scene) {
		this.latestNNQLevel = null;
		if (NNM.game.currentQuest === 'nuinui') {
			const stageIndex = Object.keys(NNM.game.quests.nuinui.stages).indexOf(scene.labelId);
			if (stageIndex < 5) {
				const [x, y] = [[255, 55], [150, 31], [47, 14], [224, 43], [249.5, 52]][stageIndex];
				scene.actors.push(new APPickup(new Vector2(x * 16, y * 16), 10 + stageIndex));
				if (stageIndex !== 0 && stageIndex !== 4) {
					const [x, y] = [[4272, 80], [2710, 880], [566, 654]][stageIndex - 1];
					scene.actors.push(new APPickup(new Vector2(x, y), 30 + stageIndex));
				}
			}
		}
	}

	emblem(event, level) {
		NNM.game.scene.actors.push(new APPickup(event[['koyori', 'chloe', 'lui', 'iroha'][level]].pos.plus(new Vector2(-8, -8)), level + 20));
	}

	item(pos, loc) {
		NNM.game.scene.actors.push(new (loc === 'boss' ? BossDrop : APPickup)(pos, loc));
	}

	console(menu) {
		NNM.game.menu = new ConsoleMenu(menu);
	}

	getIcon(i) {
		return getIcon(i);
	}

	death() {
		if (this.incomingDeath)
			this.incomingDeath = false;
		else if (this.deathLink && this.#lastDeath < NNM.game.frameCount) {
			this.#lastDeath = NNM.game.frameCount;
			const name = this.client.players.self.name;
			let type, cause, message;
			if (this.hitBy instanceof Rock) {
				message = name + ' crashed into a rock';
			} else if (this.hitBy instanceof Bullet && (this.hitBy.pekoArrow || this.hitBy.originActor instanceof PekoraBoss)) {
				type = 'laughed at';
				cause = 'Pekora';
			} else if (this.hitBy instanceof Watamelon || (this.hitBy === NNM.getPlayer() && NNM.game.scene.events.some(e => 'wHand' in e))) {
				message = 'Watame did nothing wrong';
			} else if (this.hitBy && this.hitBy !== NNM.getPlayer()) {
				const causeActor = this.hitBy.originActor || this.hitBy;
				type = this.hitBy instanceof Projectile ? 'shot' : causeActor instanceof Casinochip ? 'run over' : causeActor instanceof Comet ? 'hit' : causeActor instanceof Tentacle ? 'tentacled' : 'killed';
				cause = {
					Nousabot: 'a Nousabot',
					Nousakumo: 'a Nousakumo',
					Robot: NNM.game.currentStage === 'yamato' ? 'a spirit piloting a mech' : 'a robot',
					Casinochip: 'a casino chip',
					Mikobell: 'a Mikobell',
					Cannon: 'a cannon',
					DokuroEnemy: 'a Dokuro-kun',
					Neko: 'a ghost',
					Pirate: 'a robot',
					RobotBoss: 'a robot',
					Spirit: 'a spirit',
					Miteiru: 'a Miteiru',
					Oni: 'an oni',
					Fairy: 'a smol ' + (causeActor.type ? 'Towa' : 'Kanata'),
					Fubuzilla: 'Fubura Tower',
					Dragon: 'Coco',
					DragonHand: 'Coco',
					Card: 'Polka',
					Tentacle: 'Ina',
					Demon: 'the demon lord',
					PekoMiniBoss: "Pekora's drill",
					Comet: 'a comet',
				}[causeActor.constructor.name] || (!(causeActor instanceof Projectile) && causeActor.constructor.name.replace(/Boss|Evil/, ''));
				if (cause === 'Object') {
					cause = null;
					type = causeActor.__archipelagoVapor && 'steamed';
				} else if (causeActor === this.hitBy && causeActor instanceof PekoMiniBoss) {
					typed = 'drilled';
					cause = 'Pekora';
				}
			} else if (this.deathCause) {
				message = name + this.deathCause;
			} else if (this.hitBy === NNM.getPlayer()) {
				if (NNM.game.scene.events.some(e => e.hilo)) {
					message = name + ' lost to Chloe';
				} else if (NNM.game.currentStage === 'holo_hq') {
					if (this.arenaId === 16) message = name + ' fell off';
					else if (this.arenaId === 15) type = 'burnt';
					else if (this.arenaId === 13) message = name + ' stepped on spikes';
				} else if (NNM.game.scene.boss instanceof Kiara) {
					type = 'burnt';
					cause = 'Kiara';
				} else if (NNM.game.currentStage === 'heaven') {
					message = name + ' fell off';
				}
			} else if (CollisionBox.intersectCollisions(NNM.getPlayer(), NNM.game.scene.currentSection.collisions).length) {
				message = name + ' tried to put something too solid inside of ' + NNM.getPlayer().constructor.name.replace('Player', '');
			}
			if (type) message = name + ' was ' + type + (cause ? ' by ' + cause : '');
			try { this.client.deathLink.sendDeathLink(name, message); }
			catch {}
		}
	}

	diedToNoel() {
		this.check(this.levelEndCheckA);
		this.check(this.levelEndCheckB);
		this.popup(new StageSelect(NNM.game, null, this.transitionLevelNNQ));
		NNM.game.menu = self.archipelagoState.pendingPopUp;
		this.pendingPopUp = null;
	}

	get helpsAvailable() {
		return Math.max(this.helps - this.helpsSpent, 0);
	}

	spendHelp() {
		this.helpsSpent++;
		NNM.game.deathCount = 3;
		try {
			this.client.storage.prepare(this.keyPrefix + 'h', 0).add(1).commit();
		} catch {}
	}

	get transitionLevelNNQ() {
		return !this.slotData.nnq_li && this.latestNNQLevel;
	}

	getCrystals(qty) {
		this.#gameCrystals += qty;
		this.#crystalsToSend += qty;
	}
}
