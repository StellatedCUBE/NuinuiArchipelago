import { APPickup, NoelDrop, NousagiItem } from "./pickup.js";
import { enemySanity } from "./patch.js";
import { patchBosses } from "./boss.js";

let hasPatchedEvents = false;

function wrap(inner) {
	return (game, event) => {
		if (self.archipelagoState) {
			if (event.timelineFrame === 1) {
				self.archipelagoState.check(self.archipelagoState.levelEndCheckA);
				self.archipelagoState.check(self.archipelagoState.levelEndCheckB);
			} else if (event.timelineFrame === 180) {
				game.stopBGM();
				self.archipelagoState.popup(new StageSelect(game, null, game.currentQuest === 'nuinui' && archipelagoState.transitionLevelNNQ));
				game.menu = self.archipelagoState.pendingPopUp;
				self.archipelagoState.pendingPopUp = null;
				return;
			}
		}
		inner(game, event);
	}
}

function prefix(event, frame, func) {
	if (frame < 0)
		frame += event.timeline.length;
	const old = event.timeline[frame];
	event.timeline[frame] = (a, b) => {
		if (self.archipelagoState)
			func(a, b);
		old(a, b);
	};
}

function patchNNQ(events, level) {
	for (const section in events) {
		for (const event of events[section]) {
			for (let i = 0; i < event.timeline.length; i++) {
				if (event.timeline[i].toString().includes("setItem('stage-") && level < 4)
					event.timeline[i] = wrap(event.timeline[i]);
				if (level < 4 && event.timeline[i].toString().includes("new EmblemPickup")) {
					prefix(event, 1, (_, e) => e.timelineFrame || self.archipelagoState.scout(20 + level));
					prefix(event, i, (_, e) => e.timelineFrame || self.archipelagoState.emblem(e, level));
				}
			}
		}
	}
}

function patchPRQ(events, level) {
	for (const section in events) {
		for (const event of events[section]) {
			const nousagiMatch = event.timeline[0].toString().match(/nousagiId = 'nousagi-(?:falls|port|casino|yamato|castle)-([123])'/);
			if (nousagiMatch) {
				const loc = (6 << 16) | (level << 2) | nousagiMatch[1];
				prefix(event, 0, (game, e) => {
					if (e.timelineFrame === 1) {
						if (archipelagoState.scouts[loc]?.receiver.game === 'FLARE NUINUI QUEST' && archipelagoState.scouts[loc].id === (13 << 16)) {
							if (archipelagoState.checked(loc))
								e.box.toFilter = true;
							else
								enemySanity(e.box, loc);
						} else {
							e.end = true;
							const pickup = new NousagiItem(e.box, loc);
							if (!(e.box.toFilter = pickup.toFilter))
								game.scene.actors.unshift(pickup);
						}
					}
				});
			}

			for (let i = 0; i < event.timeline.length; i++)
				if (event.timeline[i].toString().includes("new StageSelect"))
					event.timeline[i] = wrap(event.timeline[i]);
		}
	}
}

function patchCondition(event, condition) {
	const old = event.condition;
	event.condition = game => self.archipelagoState ? condition(game) : old(game);
}

export function patchEvents() {
	if (hasPatchedEvents) return;
	hasPatchedEvents = true;

	patchNNQ(NUINUI_FALLS_EVENTS, 0);
	patchNNQ(NUINUI_CASINO_EVENTS, 1);
	patchNNQ(NUINUI_PORT_EVENTS, 2);
	patchNNQ(NUINUI_YAMATO_EVENTS, 3);
	patchNNQ(NUINUI_CASTLE_EVENTS, 4);
	patchNNQ(NUINUI_HOLO_HQ_EVENTS, 5);
	patchNNQ(NUINUI_HEAVEN_EVENTS, 6);

	patchCondition(NUINUI_CASINO_EVENTS['5_2'][0], game => !self.archipelagoState.checked(1) && !game.scene.actors.find(a => a.apLocation === 1));
	prefix(NUINUI_CASINO_EVENTS['5_2'][0], -1, (game, event) => event.timelineFrame || game.scene.actors.push(new APPickup(event.elfriend.pos.value().plus(new Vector2(0, -16)), 1)));
	
	NUINUI_CASINO_EVENTS['7_2'].push({condition: _ => self.archipelagoState && !self.archipelagoState.casinoKeyHinted && NNM.getPlayer().pos.x < 2352 && !self.archipelagoState.checked(11), timeline: [(_, event) => {
		event.end = true;
		self.archipelagoState.casinoKeyHinted = true;
		try {
			self.archipelagoState.client.socket.ws.send('[{"cmd":"CreateHints","locations":[11]}]');
		} catch (e) {
			console.error(e);
		}
	}]});

	prefix(NUINUI_PORT_EVENTS['1_0'][1], 0, (_, event) => {
		if (!event.timelineFrame)
			for (let i = 11 << 16; self.archipelagoState.client.room.allLocations.includes(i); i++)
				self.archipelagoState.scout(i);
	});

	patchCondition(NUINUI_YAMATO_EVENTS['2_9'][0], game => !self.archipelagoState.checked(2) && !game.scene.actors.find(a => a.apLocation === 2));
	prefix(NUINUI_YAMATO_EVENTS['2_9'][0], -1, (game, event) => event.timelineFrame || game.scene.actors.push(new APPickup(event.elfriend.pos.value().plus(new Vector2(0, -16)), 2)));
	prefix(NUINUI_YAMATO_EVENTS['16_0'][0], -2, (game, event) => event.timelineFrame || game.scene.actors.push(new NoelDrop(event)));

	NUINUI_CASTLE_EVENTS['4.6_8'] = [{condition: _ => self.archipelagoState?.scout(24)}];
	prefix(NUINUI_CASTLE_EVENTS['5_9'][0], 0, (game, event) => event.timelineFrame || game.scene.actors.push(new APPickup(game.scene.currentSection.pos.plus(new Vector2(152, 104)), 24, true)));
	prefix(NUINUI_CASTLE_EVENTS['3_3'][0], 0, (_, event) => {
		if (event.timelineFrame === 1) {
			let i = 12 << 16;
			for (const wave of event.enemies) {
				for (const enemy of wave) {
					self.archipelagoState.scout(i);
					enemySanity(enemy, i++);
				}
			}
		}
	});

	prefix(NUINUI_HOLO_HQ_EVENTS['5_0'][0], 0, (game, event) => event.timelineFrame || game.scene.actors.push(new APPickup(new Vector2(1750, 294), game.scene.keyId | (5 << 16), true)));
	prefix(NUINUI_HOLO_HQ_EVENTS['6_0'][0], 0, (game, event) => event.timelineFrame || game.scene.actors.push(new APPickup(new Vector2(2070, 16), (5 << 16) | 5)));
	prefix(NUINUI_HOLO_HQ_EVENTS['6_0'][0], -1, (game, event) => {
		if (!event.timelineFrame) {
			self.archipelagoState.check(self.archipelagoState.levelEndCheckA);
			self.archipelagoState.check(self.archipelagoState.levelEndCheckB);
		} else if (event.timelineFrame === 179) {
			game.stopBGM();
			self.archipelagoState.popup(new StageSelect(game, null, archipelagoState.transitionLevelNNQ));
			game.menu = self.archipelagoState.pendingPopUp;
			self.archipelagoState.pendingPopUp = null;
			event.end = true;
		}
	});

	prefix(NUINUI_HEAVEN_EVENTS['6_6'][0], 0, game => game.scene.actors.push(new APPickup(new Vector2(1998, 1216), 7)));
	patchCondition(NUINUI_HEAVEN_EVENTS['8_0'][0], _ => false);
	NUINUI_HEAVEN_EVENTS['8_0'].push({condition: _ => self.archipelagoState, timeline: [(game, event) => {
		game.scene.windParticles = true;
		const player = NNM.getPlayer();
		if (!game.scene.kanataBossCleared || !player.canWallJump) {
			if (player.pos.y > 159) {
				player.pos = event.pos.value();
				player.takeHit(game, player);
				player.vel.x = 0;
			} else if (!event.pos) {
				event.pos = player.pos.value();
			} else if (game.scene.currentSection.collisions.some(cb => cb.pos.x <= player.pos.x + 8 && cb.pos.x + cb.size.x >= player.pos.x + 8 && cb.pos.y === player.pos.y + player.size.y)) {
				event.pos = new Vector2(player.pos.x, player.pos.y + player.size.y - 32);
			}
		}
	}]});

	prefix(NUINUI_HEAVEN_EVENTS['0_0'][0], -1, (_, event) => {
		if (!event.timelineFrame) {
			self.archipelagoState.check(self.archipelagoState.levelEndCheckA);
			self.archipelagoState.check(self.archipelagoState.levelEndCheckB);
		}
	});
	prefix(NUINUI_HEAVEN_EVENTS['0_1'][1], 4, (game, event) => {
		if (event.timelineFrame === 359) {
			game.playSound('select');
			const menu = new StageSelect(game, null, archipelagoState.transitionLevelNNQ);
			const update = menu.update;
			menu.update = game => game.stopBGM(void update(game));
			self.archipelagoState.popup(menu);
			game.menu = self.archipelagoState.pendingPopUp;
			self.archipelagoState.pendingPopUp = null;
			event.end = true;
		}
	});

	patchPRQ(RANDOM_FALLS_EVENTS, 0);
	patchPRQ(RANDOM_CASINO_EVENTS, 1);
	patchPRQ(RANDOM_PORT_EVENTS, 2);
	patchPRQ(RANDOM_YAMATO_EVENTS, 3);
	patchPRQ(RANDOM_CASTLE_EVENTS, 4);

	prefix(RANDOM_CASINO_EVENTS['3_2'][1], 0, (_, event) => event.shortcut && (event.shortcut.price = archipelagoState.casinoKey));
	prefix(RANDOM_CASINO_EVENTS['3_2'][2], 0, (game, event) => {
		if (event.timelineFrame === 1) {
			event.__archipelago = new TextElem(game, ['a', 'p'], { lang: 'en', textAlign: 'center' });
			event.coinGame.slots.forEach((slot, i) => {
				const loc = i | (8 << 16);
				slot.__archipelago = archipelagoState.checkAvailable(loc) && (slot.type !== 'enemy' || archipelagoState.scouts[loc]?.receiver.slot !== archipelagoState.client.players.self.slot) && loc;
			});
			const oldSpawn = event.coinGame.spawnCoin.bind(event.coinGame);
			event.coinGame.spawnCoin = x => archipelagoState.getCrystals(-1, oldSpawn(x));
		}
	});

	patchBosses();
}
