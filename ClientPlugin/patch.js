export const NAME = 'Archipelago';

NNM.code.insertAtStartOfScope('SaveData.setItem', 'if (self.archipelagoState) return;');
NNM.code.insertAtEndOfScope('Scene.drawPlayerHealth', 'if (self.archipelagoState?.reconnecting) cx.drawImage(game.assets.images.NNM_Archipelago_dc, 5, 5);');
NNM.code.insertAfterFirstMatchingLine('TextElem.constructor', 'this.lang =', 'if (this.lang === "en" && chars.find(c => !FONT_EN[c])) chars.push(...chars.splice(0, chars.length).map(c => c.toLowerCase()).map(c => FONT_EN[c] ? c : "?"));');
NNM.code.insertAtStartOfScope('TextBubble.parse_en', 'char = char.toLowerCase(); if (!FONT_EN[char] && char !== "\\n") char = "?";');
NNM.code.insertBeforeFirstMatchingLine('KeyboardListener.handler', 'preventDefault', 'if (document.activeElement.tagName === "INPUT") return;');
NNM.code.insertAtStartOfScope('Game.update', 'self.archipelagoState?.update();');
NNM.code.insertBeforeFirstMatchingLine('StageSelect.constructor', 'this.cursorPos', 'if (self.archipelagoState) this.stageIndex = Math.max(0, this.stages.map(s => s.stageId).indexOf(game.currentStage));');
NNM.code.insertAfterFirstMatchingLine('StageSelect.update', 'this.stageIndex = ', 'if (self.archipelagoState) this.stageIndex = Math.max(0, this.stages.map(s => s.stageId).indexOf(this.nextStage));');
NNM.code.insertAtEndOfScope('Game.setQuest', function() {
	if (self.archipelagoState) {
		this.saveData.data = {};
		Object.assign(this.saveData.data, self.archipelagoState.saves[this.currentQuest]);
	}
});
NNM.code.insertBeforeFirstMatchingLine('NewGameMenuEvent.constructor', 'initFunc(', _ => {
	if (self.archipelagoState) {
		self.archipelagoState.oldSave = game.saveData.data;
		game.saveData.data = {};
	}
});
NNM.code.insertAfterFirstMatchingLine('NewGameMenuEvent.constructor', 'initFunc(', _ => {
	if (self.archipelagoState) {
		game.saveData.data = self.archipelagoState.oldSave;
	}
});
NNM.code.insertBeforeFirstMatchingLine('Item.options', 'setQuest', 'self.archipelagoState?.disconnect()');
NNM.code.insertBeforeFirstMatchingLine('Item.constructor', 'achievementCount', function() {
	if (self.archipelagoState) {
		this.options = this.options.filter(o => o.id !== 'achievements' && o.id !== 'save' && o.id !== 'load');
		if (Object.values(self.archipelagoState.availableLevels).filter(x => x.size).length > 1) {
			for (let i = 0; i < this.options.length; i++) {
				if (this.options[i].id === 'stage_select') {
					this.options.splice(i + 1, 0, {
						id: 'archipelago_quest_select',
						func: _ => self.archipelagoState.selectQuest(this)
					});
					break;
				}
			}
		}
		for (let i = 0; i < this.options.length; i++) {
			if (this.options[i].id === 'return_to_title') {
				this.options.splice(i, 0, {
					id: 'archipelago_console',
					func: _ => self.archipelagoState.console(this)
				});
				break;
			}
		}
	}
});
NNM.code.insertBeforeFirstMatchingLine('PopUpMenu.drawOptions', "'stage'", function() {
	if (this.type === 'archipelago') {
		const [i, r] = this.typeId;
		if (r)
			cx.drawImage(i, r[0], r[1], r[2], r[3], 0|(r[2] * -0.5), 0|(24 - r[3] * 0.5), r[2], r[3]);
		else
			cx.drawImage(i, 0|(i.width * -0.5), 0|(24 - i.height * 0.5));
	} else if (this.type === 'archipelagoEmblem') {
		cx.filter = 'invert(1)';
		cx.drawImage(game.assets.images.vfx_explosion, 0, 0, 18, 18, -9, 15, 18, 18);
		cx.filter = 'none';
		cx.drawImage(game.assets.images.sp_holox, 10 * this.typeId, 0, 10, 10, -5, 19, 10, 10);
	}
});
export function enemySanity(a, loc) {
	if (self.archipelagoState.client.room.missingLocations.includes(loc)) {
		const oldTakeHit = a.takeHit;
		a.takeHit = (game, x) => {
			oldTakeHit(game, x);
			if (!game.scene.actors.includes(a)) {
				self.archipelagoState.check(loc, true);
				const scout = self.archipelagoState.scouts[loc];
				if (scout && !(a instanceof self.Box && a.type === 'cage')) {
					let name = scout.name;
					if (scout.receiver.game === 'Hollow Knight')
						name = name.replace(/_/g, ' ');
					if (a instanceof self.Cannon) {
						self.archipelagoState.textParticle(
							a.dir ? a.pos.x + a.size.x + 8 : a.pos.x - 8,
							a.pos.y + a.size.y / 2,
							scout.receiver.slot === self.archipelagoState.client.players.self.slot ? [name] : [name, 'for ' + scout.receiver.name],
							a.dir ? 'left' : 'right',
							-0.12
						);
					} else {
						const down = a.pos.y < game.scene.currentSection.pos.y + 32;
						self.archipelagoState.textParticle(
							a.pos.x + a.size.x / 2,
							down ? a.pos.y + a.size.y + 8 : a.pos.y - 8,
							scout.receiver.slot === self.archipelagoState.client.players.self.slot ? [name] : [name, 'for ' + scout.receiver.name],
							'center',
							down ? 0.12 : -0.12
						);
					}
				}
			}
		};
		if (a instanceof self.Box) {
			if (a.type === 'box') {
				const oldDraw = a.draw;
				a.draw = (game, cx) => {
					oldDraw(game, cx);
					cx.globalAlpha = .3;
					cx.drawImage(game.assets.images.NNM_Archipelago_logo, Math.round(a.pos.x), Math.round(a.pos.y));
					cx.globalAlpha = 1;
				}
			}
		} else {
			const oldUpdate = a.update;
			a.update = game => {
				oldUpdate(game);
				if (~-a.frameCount & 15) return;
				const clr = (Math.random() * 6) << 3;
				const t = Math.random() * 6.28;
				const s = Math.random() * 0.4 + 0.8;
				game.scene.particles.pool.push(new Particle({
					zIndex: 0,
					lifespan: 40 + (0|(Math.random() * 16)),
					pos: new Vector2(a.pos.x + (1 + s * Math.sin(t)) * a.size.x * 0.5, a.pos.y + (1 + s * Math.cos(t)) * a.size.y * 0.5),
					vel: new Vector2(Math.sin(t) * 0.2, Math.random() * 0.15 - 0.3),
					draw: function(cx, assets) {
						cx.drawImage(assets.images.NNM_Archipelago_circles, (this.life * 4 / this.lifespan) << 3, clr, 8, 8, Math.round(this.pos.x) - 4, Math.round(this.pos.y) - 4, 8, 8);
					}
				}));
			};
		}
	}
}
NNM.code.insertAfterFirstMatchingLine('Scene.updateSection', 'this.actors.push', function() {
	if (self.archipelagoState && game.currentQuest === 'nuinui') {
		const loc = (
			Object.keys(game.quests.nuinui.stages).indexOf(game.currentStage) |
			(this.sections.indexOf(newSection) << 3) |
			(newSection.actors.indexOf(event) << 9) |
			655360
		);
		self.archipelagoState.scout(loc);
		enemySanity(this.actors[this.actors.length - 1], loc);
	}
}, {enemySanity});
NNM.code.insertAfterFirstMatchingLine('NUINUI_PORT_EVENTS', 'else enemy = new enemyClass', _ => {
	if (self.archipelagoState) {
		event.archipelagoEnemySanityCheck = event.archipelagoEnemySanityCheck ? event.archipelagoEnemySanityCheck + 1 : (11 << 16);
		enemySanity(enemy, event.archipelagoEnemySanityCheck);
	}
}, {enemySanity});
NNM.code.insertAtStartOfScope('Game.setStage', function() {
	if (self.archipelagoState) {
		self.archipelagoState.actorsToAdd = [];
		if (this.currentQuest === 'maiden') {
			self.archipelagoState.levelEndCheckA = self.archipelagoState.levelEndCheckB = 0;
		} else {
			const stageIndex = Object.keys(this.quests.nuinui.stages).indexOf(stageId);
			if (this.currentQuest === 'nuinui') {
				self.archipelagoState.scout(10 + stageIndex);
				self.archipelagoState.scout(30 + stageIndex);
				if (stageId === 'casino')
					self.archipelagoState.scout(1);
				else if (stageId === 'port')
					self.archipelagoState.scout(5);
				else if (stageId === 'yamato') {
					self.archipelagoState.scout(2);
					self.archipelagoState.scout(6);
				} else if (stageId === 'heaven')
					self.archipelagoState.scout(7);
				else if (stageId === 'holo_hq')
					for (let i = (5 << 16) + 1; i < (5 << 16) + 6; i++)
						self.archipelagoState.scout(i);
				if (self.archipelagoState.onlyNoel)
					this.mode = 'noel';
			} else {
				for (let i = 1; i < 4; i++)
					self.archipelagoState.scout((6 << 16) | (stageIndex << 2) | i);
			}

			self.archipelagoState.scout(self.archipelagoState.levelEndCheckA = ((1 + (this.currentQuest === 'random')) << 16) | stageIndex);
			self.archipelagoState.scout(self.archipelagoState.levelEndCheckB = (3 << 16) | stageIndex);
		}
	}
});
NNM.code.insertAtEndOfScope('Scene.constructor', 'self.archipelagoState?.onSceneStart(this);');
NNM.code.insertAfterFirstMatchingLine('Checkpoint.update', 'this.canHelp = true', 'if (self.archipelagoState && !flare.helpHealth) this.canHelp = self.archipelagoState.helpsAvailable;');
NNM.code.insertAtStartOfScope('instantBubble', 'if (self.archipelagoState && bubbleId === "helpBubble") text += ` (${self.archipelagoState.helpsAvailable})`;');
NNM.code.insertAfterFirstMatchingLine('Checkpoint.update', 'helpHealth = ', 'self.archipelagoState?.spendHelp();');
NNM.code.insertBeforeFirstMatchingLine('NUINUI_HOLO_HQ_EVENTS', 'sp_okayu', 'if (!event.__archipelagoNoMogu)');
NNM.code.insertBeforeFirstMatchingLine('NUINUI_HOLO_HQ_EVENTS', '.pos.x -= 20 * 16', 'if (self.archipelagoState && flare.helpPosAnim) flare.helpPosAnim.x -= 20 * 16;');
NNM.code.insertAfterFirstMatchingLine('NUINUI_HOLO_HQ_EVENTS', 'koroneDir', _ => {
	if (self.archipelagoState && !event.timelineFrame) {
		const cp = new Checkpoint({pos:Vector2.zero});
		cp.pos = okayuPos.plus({x: -8, y: 24});
		cp.draw = cp.setCheckpoint = _ => {};
		const oldUpdate = cp.update;
		cp.update = game => {
			const particles = game.scene.particles.pool.length;
			oldUpdate(game);
			if (NNM.getPlayer().helpHealth)
				event.__archipelagoNoMogu = true;
			else
				game.scene.particles.pool.length = particles;
		};
		game.scene.actors.push(cp);
	}
});
NNM.code.insertAfterFirstMatchingLine('Aircon.update', 'actors.forEach', 'if (!actor.vel) return;');
NNM.code.findReplaceAllLines('NUINUI_CASINO_EVENTS', "'casino_6'", "game.mode==='noel'?'archipelago_noel_greeting':'casino_6'");
NNM.code.findReplaceAllLines('NUINUI_CASINO_EVENTS', "game.assets.locales[game.lang]['casino_8']", "self.archipelagoState?.giftText(1)||game.assets.locales[game.lang]['casino_8']");
NNM.code.insertBeforeFirstMatchingLine('NUINUI_PORT_EVENTS', 'flare.die', 'if (self.archipelagoState) self.archipelagoState.deathCause = " lost a duel to Lui";');
NNM.code.findReplaceAllLines('NUINUI_YAMATO_EVENTS', "'yamato_0'", "game.mode==='noel'?'archipelago_noel_greeting':'yamato_0'");
NNM.code.findReplaceAllLines('NUINUI_YAMATO_EVENTS', "game.assets.locales[game.lang]['yamato_2']", "self.archipelagoState?.giftText(2)||game.assets.locales[game.lang]['yamato_2']");
NNM.code.insertBeforeFirstMatchingLine('NUINUI_YAMATO_EVENTS', 'flare.die', 'if (self.archipelagoState) self.archipelagoState.deathCause = " lost a duel to Iroha";');
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', 'flare.pos.y > scene.lockedViewPos.y + game.height', 'if (self.archipelagoState) self.archipelagoState.deathCause = " didn\'t climb fast enough";');
NNM.code.insertAtStartOfScope('Flare.die', 'self.archipelagoState?.death();');
for (const character of ['Flare', 'Noel', 'MarinePlayer', 'PekoraPlayer']) {
	NNM.code.insertAtStartOfScope(character + '.takeHit', 'if (self.archipelagoState) self.archipelagoState.hitBy = other;');
}
NNM.code.insertAtEndOfScope('VaporBlock.constructor', 'this.vaporCollisionBox.__archipelagoVapor = true;');
NNM.code.insertAtStartOfScope('IntroEvent.endIntro', 'if (self.archipelagoState) self.archipelagoState.incomingDeath = false;');
NNM.code.insertBeforeFirstMatchingLine('Aqua.takeHit', "'dual'", 'if (self.archipelagoState) self.archipelagoState.item(this.pos.value(), 5); else');
NNM.code.insertAfterFirstMatchingLine('NUINUI_FALLS_EVENTS', 'actor !== event.boss', 'if (self.archipelagoState?.slotData.boss.nnq[0] === "Usadrill") self.archipelagoState.item(event.boss.middleParts[8].pos.value(), "boss");');
NNM.code.insertAfterFirstMatchingLine('NUINUI_FALLS_EVENTS', 'RocketPickup', 'if (self.archipelagoState?.slotData.boss.nnq[1] === "Pekora") self.archipelagoState.item(event.pekora.pos.value(), "boss");');
NNM.code.findReplaceAllLines('PekoraBoss.update', 'if (CollisionBox.intersectCollisions', 'if (!this.__archipelagoNoCollide&&CollisionBox.intersectCollisions');
NNM.code.findReplaceAllLines('PekoMiniBoss.draw', 'part.pos.y > game.height', '(part.pos.y > game.height && !self.archipelagoState)');
NNM.code.findReplaceAllLines('PekoMiniBoss', 'size.y < 0', 'size.y < (self.archipelagoState?.arenaT ?? 0)');
NNM.code.findReplaceAllLines('PekoMiniBoss.update', '9 * 16', '(self.archipelagoState ? self.archipelagoState.arenaT + 144 : 9 * 16)');
NNM.code.findReplaceAllLines('PekoMiniBoss.introPhase', '24', '(self.archipelagoState?.arenaT ?? 0) + 24');
NNM.code.findReplaceAllLines('PekoMiniBoss.resurfacePhase', '24', '(self.archipelagoState?.arenaT ?? 0) + 24');
NNM.code.insertAtStartOfScope('PekoMiniBoss.drillReleasePhase', 'if (self.archipelagoState) { this.drillReleaseExplosion = true; game.scene.actors.find(a => a.archipelagoInaBridge)?.destroy(game, this.middleParts.at(-1)); }');
NNM.code.findReplaceAllLines('PekoMiniBoss.drillReleasePhase', '8 * 16', '(self.archipelagoState?.arenaT ?? 0) + 8 * 16');
NNM.code.findReplaceAllLines('PekoMiniBoss.drillChargePhase', '18', '18 + (self.archipelagoState?.arenaT ?? 0)');
NNM.code.findReplaceAllLines('PekoMiniBoss.idlePhase', '6 * 16', '(self.archipelagoState?.arenaT ?? 0) + 6 * 16');
NNM.code.insertAtStartOfScope('PekoMiniBoss.introPhase', function() {
	const bridge = game.scene.actors.find(a => a.archipelagoInaBridge);
	if (bridge) {
		bridge.destroy(game, this.leftParts[0]);
		bridge.destroy(game, this.rightParts[0]);
	}
});
NNM.code.findReplaceAllLines('Calli.update', "game.currentStage === 'casino'", "(game.currentStage === 'casino' || (self.archipelagoState && this.skullBoss))");
NNM.code.findReplaceAllLines('Calli.update', 'game.scene.currentSection.collisions', '__archipelago_col');
NNM.code.insertAtStartOfScope('Calli.update', `
	let __archipelago_col = game.scene.currentSection.collisions;
	if (this.isGrounded) this.archipelagoIgnoreEventCollisions = null;
	if (this.archipelagoIgnoreEventCollisions?.collision) __archipelago_col = __archipelago_col.filter(c => c !== this.archipelagoIgnoreEventCollisions.collision);
	else if (this.archipelagoIgnoreEventCollisions?.collisions) __archipelago_col = __archipelago_col.filter(c => !this.archipelagoIgnoreEventCollisions.collisions.includes(c));
`);
for (const scope of ['Miko.chantPhase', 'EvilFlare.attackPhase']) {
	NNM.code.insertAfterFirstMatchingLine(scope, '-', _ => {
		if (self.archipelagoState) {
			for (let i = 2; i > 0; i--) {
				const a = game.scene.actors[game.scene.actors.length - i];
				a.toFilter = a.pos.x < self.archipelagoState.arenaTL || a.pos.x + a.size.x > self.archipelagoState.arenaTR;
			}
		}
	});
}
NNM.code.insertBeforeFirstMatchingLine('Miko.idlePhase', 'this.maxHealth / 2', 'if (!self.archipelagoState)');
NNM.code.findReplaceAllLines('Marine.update', '6 * 16', '(self.archipelagoState ? self.archipelagoState.arenaB - 40 : 6 * 16)');
NNM.code.findReplaceAllLines('Marine.idlePhase', '30 * 16', '(self.archipelagoState ? (self.archipelagoState.arenaL + self.archipelagoState.arenaR) / 2 : 30 * 16)');
NNM.code.insertAfterFirstMatchingLine('Marine.movePhase', 'new DokuroEnemy', 'if (self.archipelagoState) game.scene.actors.at(-1).pos = new Vector2((self.archipelagoState.arenaL + self.archipelagoState.arenaR) / 2 - 8, self.archipelagoState.arenaB - 48);');
NNM.code.insertAtStartOfScope('Marine.movePhase', 'if (self.archipelagoState) this.__archipelago_t += this.moveDir/53;')
NNM.code.insertAtStartOfScope('Marine.dashPhase', 'if (self.archipelagoState) this.__archipelago_t += this.moveDir/26;')
NNM.code.insertBeforeFirstMatchingLine('Marine.update', 'this.pos.x = ', 'if (this.__archipelago_xl && this.phase !== "defeated") this.pos.x = lerp(this.__archipelago_xl, this.__archipelago_xr, this.__archipelago_t); else');
NNM.code.insertAfterFirstMatchingLine('NUINUI_YAMATO_EVENTS', '!event.fubuzilla.health', 'if (event.fubuzilla.canDie < 2 && self.archipelagoState) self.archipelagoState.item(new Vector2(718, 1050), "boss");');
NNM.code.insertAfterFirstMatchingLine('Ayame.focusPhase', 'this.vel = ', 'if (self.archipelagoState?.arenaId === 1) this.vel.y *= 0.73;');
NNM.code.insertAfterFirstMatchingLine('Ayame.update', 'const newCollisionBox', 'if (self.archipelagoState) newCollisionBox.pos.y = Math.round(this.pos.y);');
NNM.code.insertBeforeFirstMatchingLine('Flare.deathTransition', 'deathTransitionIndex === 360', 'if (self.archipelagoState && this.deathTransitionIndex===360) self.archipelagoState.diedToNoel(); else');
NNM.code.findReplaceAllLines('Suisei.introPhase', 'scenePos.y + 6 * 16', '(self.archipelagoState ? self.archipelagoState.arenaB - 64 : scenePos.y + 6 * 16)');
NNM.code.findReplaceAllLines('Axe.update', 'game.scene.currentSection.pos', 'self.archipelagoState ? {x:Math.min(self.archipelagoState.arenaL,self.archipelagoState.arenaTL)-32,y:self.archipelagoState.arenaB-160} : game.scene.currentSection.pos');
NNM.code.findReplaceAllLines('Axe.update', 'scenePos.x + 14 * 16', '(self.archipelagoState ? Math.max(self.archipelagoState.arenaR, self.archipelagoState.arenaTR) - 64 : scenePos.x + 14 * 16)');
NNM.code.insertAtStartOfScope('Axe.update', function() {
	if ([4, 18].includes(self.archipelagoState?.arenaId)) {
		if (this.gravityBuffer === Infinity) {
			if (this.suisei.phase === 'charge') {
				this.gravityBuffer = 0;
			} else {
				this.pos.x -= Math.cos(this.angle) / 2;
				this.pos.y += Math.sin(this.angle) / 2;
			}
		} else if (this.gravityBuffer === 1) {
			this.gravityBuffer = Infinity;
		}
	}
});
NNM.code.insertBeforeFirstMatchingLine('Suisei.chargePhase', 'this.phaseBuffer === 300', 'if (self.archipelagoState?.arenaId === 18 && this.phaseBuffer < 300 && NNM.getPlayer().pos.y > this.pos.y) this.aimAngle += this.aimAngle ? .2 : -.2;');
NNM.code.findReplaceAllLines('Suisei.rainPhase', 'scenePos.x', '(self.archipelagoState ? this.pos.x - 152 : scenePos.x)');
NNM.code.findReplaceAllLines('Suisei.idlePhase', 'this.axe.isGrounded', '(this.axe.isGrounded || (self.archipelagoState && this.axe.gravityBuffer === Infinity))');
NNM.code.findReplaceAllLines('Suisei.idlePhase', 'CollisionBox.center(this).distance(CollisionBox.center(this.axe))', '(self.archipelagoState ? Math.abs(this.pos.x - this.axe.pos.x - 24) : CollisionBox.center(this).distance(CollisionBox.center(this.axe)))');
NNM.code.insertBeforeFirstMatchingLine('Suisei.idlePhase', 'new Comet', _ => {
	if (self.archipelagoState) {
		const l = Math.max(self.archipelagoState.arenaL + 32, self.archipelagoState.arenaTL);
		const r = Math.min(self.archipelagoState.arenaR - 48, self.archipelagoState.arenaTR);
		p1.x = l + ((Math.random() * (r - l)) & ~15);
	}
});
NNM.code.findReplaceAllLines('Polka.update', '(6 * 20 + 13) * 16', '(self.archipelagoState ? self.archipelagoState.arenaL + 1 : (6 * 20 + 13) * 16)');
NNM.code.findReplaceAllLines('Polka.update', '(6 * 20 + 26) * 16', '(self.archipelagoState ? self.archipelagoState.arenaR - 17 : (6 * 20 + 26) * 16)');
NNM.code.findReplaceAllLines('Polka.update', 'new Vector2((133 + 4 * i) * 16, 37 * 16)',
	'self.archipelagoState && self.archipelagoState.arenaId !== 9 ? new Vector2(self.archipelagoState.arenaL + 32 + i * (self.archipelagoState.arenaR - self.archipelagoState.arenaL - 96) / 3, self.archipelagoState.arenaT) : new Vector2((133 + 4 * i) * 16, 37 * 16)');
NNM.code.findReplaceAllLines('Polka.update', 'new Vector2((133 + (i % 2 ? 12 : 0)) * 16, (38 + (i > 1 ? 5 : 0)) * 16)',
	'self.archipelagoState && self.archipelagoState.arenaId !== 9 ?' +
	'new Vector2(i % 2 ? self.archipelagoState.arenaL + 32 : self.archipelagoState.arenaR - 64, i > 1 ? self.archipelagoState.arenaB - 48 : self.archipelagoState.arenaT + 16) :' +
	'new Vector2((133 + (i % 2 ? 12 : 0)) * 16, (38 + (i > 1 ? 5 : 0)) * 16)'
);
for (const actor of ['Ayame', 'Demon', 'DemonHand', 'Dragon', 'DragonHand', 'Axe', 'Comet'])
	NNM.code.insertAtStartOfScope(actor + '.checkHit', 'if (self.archipelagoState && collisionBox instanceof Aircon) return;');
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', 'new EvilMiko', 'self.archipelagoState?.scout(3);');
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', 'mikoBossCleared = true', 'if (game.mode === "noel") self.archipelagoState?.item(event.miko.pos.value(), "boss");');
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', "game.timer && game.mode !== 'noel'", 'self.archipelagoState?.check(3);');
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', "'hint'", _ => {
	if (self.archipelagoState?.pendingPopUp) {
		game.menu = self.archipelagoState.pendingPopUp;
		self.archipelagoState.pendingPopUp = null;
	}
});
NNM.code.insertAfterFirstMatchingLine('EvilMiko.takeHit', 'dragonBreath = ', 'if (self.archipelagoState?.arenaId === 4) this.dragonBreath = 0;');
NNM.code.insertAfterFirstMatchingLine('EvilMiko.attackPhase', 'crystalDist = ', 'if (self.archipelagoState) this.crystalDist = Math.min(this.crystalDist, this.pos.x - self.archipelagoState.arenaL - 24, self.archipelagoState.arenaR - this.pos.x - 40);');
NNM.code.findReplaceAllLines('EvilMiko.attack3Phase', '37 * 16', 'self.archipelagoState ? Math.max(self.archipelagoState.arenaB - 144, self.archipelagoState.arenaT + 16) : 37 * 16');
NNM.code.findReplaceAllLines('EvilMiko.attack3Phase', 'flare.pos.x', '(self.archipelagoState?.arenaId === 4 ? 374 : flare.pos.x)');
NNM.code.insertAfterFirstMatchingLine('EvilMiko.attack3Phase', 'const bullet =', 'bullet.__archipelagoLava = self.archipelagoState?.arenaId === 4;');
NNM.code.insertAfterFirstMatchingLine('Bullet.update', 'currentSection.collisions', function() {
	const spawnX = 354;
	if (this.__archipelagoLava && !game.scene.actors.some(a => a instanceof Rock && a.pos.x < spawnX + 44 && a.pos.x > spawnX - 44)) {
		game.scene.events.find(e => e.addEnemy).addEnemy(Rock, new Vector2(spawnX / 16, 9.75 + Math.random() / 2), 2, 0, 0, Math.random() > 0.5);
		game.playSound('NNM_Archipelago_cobblestone');
	}
});
NNM.code.findReplaceAllLines('EvilFlare.attackPhase', '24 * 16', 'self.archipelagoState ? game.scene.currentSection.pos.y : 24 * 16');
NNM.code.findReplaceAllLines('EvilFlare.jumpPhase', '32 * 16', '(self.archipelagoState ? self.archipelagoState.arenaB - 32 : 32 * 16)');
NNM.code.findReplaceAllLines('EvilFlare.update', '32 * 16', '(self.archipelagoState && self.archipelagoState.arenaId !== 11 ? (this.phase === "defeated") * 1e5 + self.archipelagoState.arenaB - 32 : 32 * 16)');
NNM.code.findReplaceAllLines('EvilFlare.update', '36 * 16', '(self.archipelagoState ? self.archipelagoState.arenaR - 16 : 36 * 16)');
NNM.code.findReplaceAllLines('EvilFlare.update', '23 * 16', 'self.archipelagoState?.arenaL ?? 23 * 16');
NNM.code.insertBeforeFirstMatchingLine('NUINUI_CASTLE_EVENTS', 'scene.particles.charge', "if (event.demon.archipelago) return event.timelineFrame % 60 || game.playSound('charge2');");
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', 'event.timelineFrame > 8 * 60 && (game.keys.a || game.keys.start)', 'if (!self.archipelagoState)');
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', "'stage'", _ => {
	if (self.archipelagoState) {
		if (self.archipelagoState.pendingPopUp) {
			game.menu = self.archipelagoState.pendingPopUp;
			self.archipelagoState.pendingPopUp = null;
		} else {
			game.menu = new Item(game);
		}
	}
});
NNM.code.insertAtStartOfScope('Demon.endPhase', 'if (self.archipelagoState && this.phaseBuffer === 180) this.hands[0].toFilter = this.hands[1].toFilter = this.toFilter = true;');
NNM.code.findReplaceAllLines('Demon.introPhase', '13.5 * 16', '(self.archipelagoState ? game.scene.view.pos.y + 24 : 13.5 * 16)')
NNM.code.findReplaceAllLines('Demon.endPhase', '28 * 16', '(self.archipelagoState ? game.scene.view.pos.x + 128 : 28 * 16)');
NNM.code.findReplaceAllLines('Demon.handPhase', '20 * 16', '(self.archipelagoState ? self.archipelagoState.arenaB - 32 : 20 * 16)');
NNM.code.findReplaceAllLines('ShirakenHelper.update', '20 * 16', '(self.archipelagoState ? self.archipelagoState.arenaB - 32 : 20 * 16)');
NNM.code.findReplaceAllLines('ShirakenHelper.update', '-1,', 'self.archipelagoState && this.dir ? 1 + (self.archipelagoState.arenaId === 18) : -1,');
NNM.code.findReplaceAllLines('Demon.laserPhase', '96', 'self.archipelagoState ? 999 : 96');
NNM.code.findReplaceAllLines('Demon.laserPhase', '22 * 16', 'this.__archipelagoLaserBottom ?? 22 * 16');
NNM.code.findReplaceAllLines('Demon', '33 * 16', 'self.archipelagoState ? game.scene.view.pos.x + 208 : 33 * 16');
NNM.code.findReplaceAllLines('Demon', '23 * 16', 'self.archipelagoState ? game.scene.view.pos.x + 48 : 23 * 16');
NNM.code.findReplaceAllLines('Demon.laserPhase', '28 * 16', 'self.archipelagoState ? game.scene.view.pos.x + 128 : 28 * 16');
NNM.code.insertAfterFirstMatchingLine('Demon.draw', 'sp_demon_laser', `
	if (self.archipelagoState) {
		cx.drawImage(game.assets.images.sp_demon_laser, (Math.floor(this.frameCount * .25) % 4) * 64, 149, 64, 43, 0, 160, 64, 86);
		cx.drawImage(game.assets.images.sp_demon_laser, (Math.floor(this.frameCount * .25) % 6) * 64, 0, 64, 96, 0, this.__archipelagoLaserBottom - Math.round(this.pos.y) - 96, 64, 96);
	} else
`);
NNM.code.insertBeforeFirstMatchingLine('NUINUI_HOLO_HQ_EVENTS', 'event.key = ', 'self.archipelagoState&&scene.bossOrder.sort((a,b)=>!game.saveData.getItem("key-"+a)-!game.saveData.getItem("key-"+b));');
NNM.code.findReplaceAllLines('Kiara.draw', '< 6;', '<(game.scene.currentSection.size.y>>5);');
NNM.code.insertAfterFirstMatchingLine('Gura.attackPhase', 'targetY = ', 'self.archipelagoState&&(this.targetY = self.archipelagoState.guraY);');
NNM.code.insertAfterFirstMatchingLine('Gura.attack2Phase', 'targetY = ', 'self.archipelagoState&&(this.targetY = self.archipelagoState.guraY + 32);');
NNM.code.insertAfterFirstMatchingLine('Gura.attack3Phase', 'targetY = ', 'self.archipelagoState&&(this.targetY = self.archipelagoState.guraY);');
NNM.code.insertAfterFirstMatchingLine('Gura.attack3Phase', 'explosion', 'game.scene.actors.find(a => a.archipelagoInaBridge)?.destroy(game, this, true, true);');
NNM.code.findReplaceAllLines('Gura.attack3Phase', 'scenePos.y + 8 * 16', '(self.archipelagoState?self.archipelagoState.arenaB-32:scenePos.y + 8 * 16)');
NNM.code.findReplaceAllLines('Gura.idlePhase', 'scenePos.y', '(self.archipelagoState?self.archipelagoState.guraY-16:scenePos.y)');
for (const scope of ['Gura.attackPhase', 'Gura.attack4Phase', 'Gura.movePhase']) {
	NNM.code.findReplaceAllLines(scope, 'const target', 'let target');
	NNM.code.insertAfterFirstMatchingLine(scope, 'let target', 'self.archipelagoState&&(target = this.targetSide ? self.archipelagoState.guraRight : self.archipelagoState.guraLeft);');
}
NNM.code.findReplaceAllLines('Gura.draw', '< 6;', '<(game.scene.currentSection.size.y>>5);');
NNM.code.findReplaceAllLines('Gura', 'game.scene.currentSection.pos', '(self.archipelagoState && game.scene.lockedViewPos || game.scene.currentSection.pos)');
NNM.code.findReplaceAllLines('Ina.attack3Phase', '13 * 16', '(self.archipelagoState ? self.archipelagoState.arenaT + 16 : 13 * 16)');
NNM.code.findReplaceAllLines('Ina.update', '&&', '&& (!self.archipelagoState || game.scene.rain) &&');
NNM.code.findReplaceAllLines('Ina.takeHit', '21.5 * 16', '(self.archipelagoState ? game.scene.currentSection.pos.y + game.scene.currentSection.size.y - 40 : 22.5 * 16)');
NNM.code.findReplaceAllLines('Ina.idlePhase', 'Math', '(self.archipelagoState ? game.scene.currentSection.pos.y + game.scene.currentSection.size.y - 384 : 0) + Math');
NNM.code.findReplaceAllLines('Tentacle.update', '22.5 * 16', '(self.archipelagoState ? game.scene.currentSection.pos.y + game.scene.currentSection.size.y - 24 : 22.5 * 16)');
NNM.code.insertAfterFirstMatchingLine('Tentacle.update', 'const x', 'if (!self.archipelagoState || game.scene.rain)');
NNM.code.insertBeforeFirstMatchingLine('Tentacle.update', 'water_trail', 'if (!self.archipelagoState || game.scene.rain)');
NNM.code.insertAfterFirstMatchingLine('Ame.clockPhase', 'flare.dir =', _ => {
	if (self.archipelagoState?.ameResetData) {
		const {pos, dir, fx} = self.archipelagoState.ameResetData;
		flare.pos = pos;
		flare.dir = dir;
		game.scene.actors.push(fx);
	}
});
NNM.code.insertAtStartOfScope('Scene.get collisions', 'const __archipelago_plr=NNM.getPlayer();')
NNM.code.findReplaceAllLines('Scene.get collisions', 'this.currentSection.collisions', '(self.archipelagoState?.arenaId === 16 && __archipelago_plr.pos.y + __archipelago_plr.size.y > self.archipelagoState.arenaB &&' +
	'__archipelago_plr.pos.y < self.archipelagoState.arenaB + 16 ? this.currentSection.collisions.map(c => !c.archipelagoInaBridge || c.pos.x + c.size.x <= __archipelago_plr.pos.x || c.pos.x >= __archipelago_plr.pos.x + __archipelago_plr.size.x ?' +
	'c : {pos:{x:__archipelago_plr.pos.x + __archipelago_plr.size.x,y:c.pos.y},size:c.size}) : this.currentSection.collisions)');
NNM.code.findReplaceAllLines('Kanata.divePhase', '-8 * 16', '(self.archipelagoState ? game.scene.currentSection.pos.y - 128 : -8 * 16)');
NNM.code.findReplaceAllLines('Kanata.divePhase', '12 * 16', '(self.archipelagoState ? game.scene.currentSection.pos.y + 192 : 12 * 16)');
NNM.code.findReplaceAllLines('Kanata.divePhase', /10 [*] 16/g, '(self.archipelagoState && self.archipelagoState.arenaId !== 18 && self.archipelagoState.arenaId !== 4 ? self.archipelagoState.arenaB - self.archipelagoState.arenaT : 10 * 16)');
NNM.code.insertAfterAllMatchingLines('Kanata', 'this.targetY = Math', 'if (self.archipelagoState) this.targetY += game.scene.currentSection.pos.y;');
NNM.code.findReplaceAllLines('Kanata', '8.5 * 20 * 16', '(self.archipelagoState ? (self.archipelagoState.arenaL + self.archipelagoState.arenaR) / 2 : 8.5 * 20 * 16)');
NNM.code.findReplaceAllLines('Kanata', '(8 * 20 + (this.targetSide ? 16 : 3)) * 16', '(self.archipelagoState ? (this.targetSide ? self.archipelagoState.arenaR - 64 : self.archipelagoState.arenaL + 48) : (8 * 20 + (this.targetSide ? 16 : 3)) * 16)');
NNM.code.insertAfterFirstMatchingLine('NUINUI_HEAVEN_EVENTS', 'unlockAchievement(27)', 'self.archipelagoState && !game.bgm && game.playBGM("kiseki");')
NNM.code.insertAtStartOfScope('Dragon.endPhase', 'if (self.archipelagoState && this.phaseBuffer === 180) this.hands[0].toFilter = this.hands[1].toFilter = this.toFilter = true;');
NNM.code.findReplaceAllLines('Dragon.introPhase', '(60 + 13.5) * 16', '(self.archipelagoState ? game.scene.view.pos.y + 24 : (60 + 13.5) * 16)')
NNM.code.findReplaceAllLines('Dragon.endPhase', '28 * 16', '(self.archipelagoState ? Infinity : 28 * 16)');
NNM.code.insertAfterFirstMatchingLine('Dragon.laserPhase', 'new Projectile', 'game.scene.actors.find(a => a.archipelagoInaBridge)?.destroy(game, game.scene.actors.at(-1));');
NNM.code.findReplaceAllLines('Dragon.laserPhase', '96', 'self.archipelagoState ? 999 : 96');
NNM.code.findReplaceAllLines('Dragon.laserPhase', '(12 * 6 + 10) * 16', 'this.__archipelagoLaserBottom ?? (12 * 6 + 10) * 16');
NNM.code.findReplaceAllLines('Dragon', '173 * 16', 'self.archipelagoState ? game.scene.view.pos.x + 208 : 173 * 16');
NNM.code.findReplaceAllLines('Dragon', '163 * 16', 'self.archipelagoState ? game.scene.view.pos.x + 48 : 163 * 16');
NNM.code.findReplaceAllLines('Dragon.laserPhase', '168 * 16', 'self.archipelagoState ? game.scene.view.pos.x + 128 : 168 * 16');
NNM.code.insertAfterFirstMatchingLine('Dragon.draw', 'sp_demon_laser', `
	if (self.archipelagoState) {
		cx.drawImage(game.assets.images.sp_demon_laser, (Math.floor(this.frameCount * .25) % 4) * 64, 341, 64, 43, 0, 160, 64, 86);
		cx.drawImage(game.assets.images.sp_demon_laser, (Math.floor(this.frameCount * .25) % 6) * 64, 192, 64, 96, 0, this.__archipelagoLaserBottom - Math.round(this.pos.y) - 96, 64, 96);
	} else
`);
NNM.code.findReplaceAllLines('Towa', '8 * 16', '(self.archipelagoState ? self.archipelagoState.arenaB - 32 : 8 * 16)');
NNM.code.findReplaceAllLines('Towa.bibiPhase', '9.5 * 16', '(self.archipelagoState ? (self.archipelagoState.arenaL + self.archipelagoState.arenaR) / 2 - 8 : 9.5 * 16)');
NNM.code.findReplaceAllLines('Towa.bibiPhase', '(2 + i * 5) * 16', '(self.archipelagoState ? (i + .5) * (self.archipelagoState.arenaR - self.archipelagoState.arenaL) / 4 - 8 + self.archipelagoState.arenaL : (2 + i * 5) * 16)');
NNM.code.insertAfterFirstMatchingLine('Towa.update', 'this.isCeilling = false', 'if (self.archipelagoState && this.isUpsideDown && this.health && this.vel.y === 0) this.vel.y = -16;');
NNM.code.insertBeforeFirstMatchingLine('Bibi.checkHit', 'return', 'if (self.archipelagoState && collision && collisionBox instanceof Aircon) this.phase = "idle";');
NNM.code.insertAtStartOfScope('Bibi.idlePhase', 'if (self.archipelagoState) { if (!this.isGrounded) return; this.vel.x = 0; }');
NNM.code.insertBeforeFirstMatchingLine('NUINUI_HOLO_HQ_EVENTS', 'bg_kiara', _ => {
	if (self.archipelagoState && game.scene.boss instanceof Towa) {
		const ys = game.scene.boss.mirrorAnim ? (game.scene.boss.mirrorAnim / 10 - 1) * (game.scene.boss.mirror ? 1 : -1) : game.scene.boss.mirror ? -1 : 1;
		if (ys !== 1) {
			cx.translate(0, game.height / 2);
			cx.scale(1, ys);
			cx.translate(0, -game.height / 2);
		}
	}
});
NNM.code.findReplaceAllLines('Lui.constructor', 'random() * 3', '(self.archipelagoState && self.archipelagoState.arenaB < room.pos.y + 130 ? 0 : random() * 3)');

NNM.code.insertAfterFirstMatchingLine('BowPickup.update', 'CollisionBox.intersects', 'if (self.archipelagoState) self.archipelagoState.setSaveField("nuinui", "item-gun");');
for (const scope of NNM.code.filesMatching('bowPickup.js')[0].scopes)
	if (scope.endsWith('.constructor') && scope !== 'BowPickup.constructor')
		NNM.code.insertAtEndOfScope(scope, 'if (self.archipelagoState) this.toFilter = true;');
